import { useState } from 'react'
import { api } from '../services/api'
import { peso } from '../utils/format'

const UNITS = [['mg', 'mg'], ['g', 'g'], ['kg', 'kg'], ['ml', 'ml'], ['l', 'L']]
const BASE = { mg: 0.001, g: 1, kg: 1000, ml: 1, l: 1000 } // to grams or milliliters
const MASS = ['mg', 'g', 'kg']
const r2 = n => Math.round(n * 100) / 100
const blank = () => ({ name: '', unit: 'g', amount: '', price: '' })

// 1500 g -> 1.5 kg, 0.5 g -> 500 mg, 2000 ml -> 2 L
const nice = (base, mass) => mass
  ? (base >= 1000 ? [r2(base / 1000), 'kg'] : base < 1 ? [r2(base * 1000), 'mg'] : [r2(base), 'g'])
  : (base >= 1000 ? [r2(base / 1000), 'l'] : [r2(base), 'ml'])

export default function HomemadeProduct({ D, run, onDone }) {
  const [name, setName] = useState('')
  const [cat, setCat] = useState('')
  const [pieces, setPieces] = useState('')
  const [price, setPrice] = useState('')
  const [rows, setRows] = useState([blank()])

  const setRow = (i, k, v) => setRows(rows.map((r, j) => j === i ? { ...r, [k]: v } : r))

  const n = +pieces || 0
  const sell = +price || 0
  const total = rows.reduce((a, r) => a + (+r.amount || 0) * (+r.price || 0), 0)
  const mass = rows.filter(r => MASS.includes(r.unit)).reduce((a, r) => a + (+r.amount || 0) * BASE[r.unit], 0)
  const vol = rows.filter(r => !MASS.includes(r.unit)).reduce((a, r) => a + (+r.amount || 0) * BASE[r.unit], 0)
  const useMass = mass > 0
  const base = useMass ? mass : vol
  const size = n && base > 0 ? nice(base / n, useMass) : null
  const cost = n ? total / n : 0
  const profit = sell - cost
  const margin = sell > 0 ? profit / sell * 100 : 0
  const suggest = Math.ceil(cost / 0.7 * 2) / 2 // price that earns about 30% profit
  const ready = name.trim() && n > 0 && total > 0 && sell > 0

  let advice = null
  if (n && total) {
    if (!sell) advice = ['note', `Suggested price: ${peso(suggest)} per piece (about 30% profit).`]
    else if (profit <= 0) advice = ['bad', `You would lose ${peso(-profit)} on every piece. Try at least ${peso(suggest)}.`]
    else if (margin < 20) advice = ['warn', `Profit is only ${peso(profit)} per piece (${Math.round(margin)}%). That is thin. Try ${peso(suggest)} for a healthier profit.`]
    else advice = ['note', `You earn ${peso(profit)} per piece (${Math.round(margin)}% profit). Selling all ${n} pieces earns ${peso(profit * n)}.`]
  }

  const save = async e => {
    e.preventDefault()
    if (!ready) return
    const names = rows.map(r => r.name.trim()).filter(Boolean)
    const ok = await run(() => api('/products', 'POST', {
      name: name.trim(), cat, cost_price: r2(cost), price: sell, low_stock: 10,
      sold_by: 'piece', is_homemade: true,
      description: ('Homemade' + (names.length ? ': ' + names.join(', ') : '')).slice(0, 500),
      size_value: size ? size[0] : '', size_unit: size ? size[1] : '',
    }), 'Homemade product saved. Receive stock on the Inventory page.')
    if (ok) onDone()
  }

  return (
    <form className="card" onSubmit={save} style={{ maxWidth: 720 }}>
      <h3>Homemade product</h3>
      <p className="sub" style={{ marginBottom: 8 }}>List what goes into one batch. We work out the cost and size of each piece.</p>

      <label>Product name</label>
      <input required value={name} onChange={e => setName(e.target.value)} style={{ width: '100%' }} />
      <label>Category</label>
      <select value={cat} onChange={e => setCat(e.target.value)} style={{ width: '100%' }}>
        <option value="">No category</option>
        {(D.categories || []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>

      <label style={{ marginTop: 16 }}>Ingredients for one batch</label>
      {rows.map((r, i) => (
        <div className="bar" key={i} style={{ alignItems: 'center', marginBottom: 8 }}>
          <input placeholder="Ingredient (e.g. flour)" aria-label="Ingredient" value={r.name} onChange={e => setRow(i, 'name', e.target.value)} style={{ flex: '2 1 160px' }} />
          <select value={r.unit} onChange={e => setRow(i, 'unit', e.target.value)} aria-label="Unit" style={{ flex: '0 0 auto' }}>
            {UNITS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <input type="number" min="0" step="any" placeholder={'Amount used (' + (r.unit === 'l' ? 'L' : r.unit) + ')'} aria-label="Amount used" value={r.amount} onChange={e => setRow(i, 'amount', e.target.value)} style={{ flex: '1 1 110px' }} />
          <input type="number" min="0" step="any" placeholder={'Price per 1 ' + (r.unit === 'l' ? 'L' : r.unit) + ' (₱)'} aria-label="Price per unit" value={r.price} onChange={e => setRow(i, 'price', e.target.value)} style={{ flex: '1 1 130px' }} />
          {rows.length > 1 && <button type="button" className="btn ghost sm" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button>}
        </div>
      ))}
      <button type="button" className="btn ghost sm" onClick={() => setRows([...rows, blank()])}>Add ingredient</button>
      {mass > 0 && vol > 0 && <p className="auth-note warn">You mixed weight and liquid. The size per piece uses the weight only.</p>}

      <label style={{ marginTop: 16 }}>How many pieces will this batch make?</label>
      <input type="number" min="1" step="1" required value={pieces} onChange={e => setPieces(e.target.value)} style={{ width: '100%' }} />

      {n > 0 && total > 0 && (
        <div className="stats" style={{ marginTop: 16, marginBottom: 8 }}>
          <div className="stat"><b>{peso(total)}</b><small>Batch cost</small></div>
          <div className="stat"><b>{peso(cost)}</b><small>Cost per piece</small></div>
          <div className="stat"><b>{size ? `${size[0]} ${size[1] === 'l' ? 'L' : size[1]}` : '—'}</b><small>Size per piece</small></div>
        </div>
      )}

      <label>Selling price per piece (₱)</label>
      <input type="number" min="0" step="any" required value={price} onChange={e => setPrice(e.target.value)} style={{ width: '100%' }} />
      {advice && (
        <p className={advice[0] === 'bad' ? 'auth-err' : advice[0] === 'warn' ? 'auth-note warn' : 'auth-note'}>
          {advice[1]}
          {advice[0] !== 'note' || !sell ? <> <button type="button" className="link" onClick={() => setPrice(String(suggest))}>Use {peso(suggest)}</button></> : null}
        </p>
      )}

      <button className="btn" style={{ marginTop: 16 }} disabled={!ready}>Save homemade product</button>
    </form>
  )
}