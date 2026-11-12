import { useState } from 'react'
import { api } from '../services/api'
import { peso, UNITS, BASE, isMass, unitLabel, r2, nice } from '../utils/format'

const blank = () => ({ name: '', pkg: '', unit: 'g', price: '', used: '', uunit: 'g' })
const family = u => UNITS.filter(([k]) => isMass(k) === isMass(u))
const fmt = (base, mass) => { const [v, u] = nice(base, mass); return `${v} ${unitLabel(u)}` }
const touched = r => r.name || r.pkg || r.price || r.used

export default function HomemadeProduct({ D, run, onDone }) {
  const [name, setName] = useState('')
  const [cat, setCat] = useState('')
  const [pieces, setPieces] = useState('')
  const [price, setPrice] = useState('')
  const [rows, setRows] = useState([blank()])

  const setRow = (i, patch) => setRows(rows.map((r, j) => j === i ? { ...r, ...patch } : r))

  const calc = rows.map(r => {
    const pkg = (+r.pkg || 0) * BASE[r.unit]
    const used = (+r.used || 0) * BASE[r.uunit]
    const cost = pkg > 0 ? used / pkg * (+r.price || 0) : 0
    const packs = pkg > 0 && used > 0 ? Math.ceil(used / pkg - 1e-9) : 0
    return { pkg, used, cost, packs, left: packs * pkg - used, mass: isMass(r.unit), ok: pkg > 0 && used > 0 && +r.price > 0 }
  })

  const n = Math.round(+pieces) || 0
  const sell = +price || 0
  const total = calc.reduce((a, c) => a + c.cost, 0)
  const mass = calc.filter(c => c.mass).reduce((a, c) => a + c.used, 0)
  const vol = calc.filter(c => !c.mass).reduce((a, c) => a + c.used, 0)
  const useMass = mass > 0
  const base = useMass ? mass : vol
  const size = n && base > 0 ? nice(base / n, useMass) : null
  const cost = n ? total / n : 0
  const profit = sell - cost
  const margin = sell > 0 ? profit / sell * 100 : 0
  const suggest = Math.ceil(cost / 0.7 * 2) / 2 // about 30% profit
  const active = rows.map((r, i) => [r, calc[i]]).filter(([r]) => touched(r))
  const ready = name.trim() && n > 0 && total > 0 && sell > 0 && active.length > 0 && active.every(([, c]) => c.ok)

  const leftNote = c => {
    if (!c.pkg || !c.used) return null
    if (c.left < 1e-6) return 'Uses the whole pack. Nothing left over.'
    const more = Math.floor(c.left / c.used + 1e-9)
    const pct = Math.round(c.left / (c.packs * c.pkg) * 100)
    return `${c.packs > 1 ? `You will need ${c.packs} packs. ` : ''}Left over after this batch: ${fmt(c.left, c.mass)} (${pct}%)` +
      (more >= 1 ? `, enough for ${more} more batch${more === 1 ? '' : 'es'} like this.` : '. Not enough for another batch.')
  }

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
    const names = active.map(([r]) => r.name.trim()).filter(Boolean)
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
      <p className="sub" style={{ marginBottom: 8 }}>
        For each ingredient, enter the pack you bought and how much of it goes into one batch.
        Only the amount you use is counted as cost. The rest stays as leftover.
      </p>

      <label>Product name</label>
      <input required value={name} onChange={e => setName(e.target.value)} style={{ width: '100%' }} />
      <label>Category</label>
      <select value={cat} onChange={e => setCat(e.target.value)} style={{ width: '100%' }}>
        <option value="">No category</option>
        {(D.categories || []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>

      <label style={{ marginTop: 16 }}>Ingredients for one batch</label>
      {rows.map((r, i) => {
        const c = calc[i], note = leftNote(c)
        return (
          <div className="card" key={i} style={{ marginBottom: 10 }}>
            <div className="bar" style={{ alignItems: 'center', marginBottom: 4 }}>
              <input placeholder="Ingredient (e.g. flour)" aria-label="Ingredient" value={r.name} onChange={e => setRow(i, { name: e.target.value })} style={{ flex: 1 }} />
              {rows.length > 1 && <button type="button" className="btn ghost sm" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button>}
            </div>

            <label>The pack you bought: size and price</label>
            <div className="bar" style={{ marginBottom: 4 }}>
              <input type="number" min="0" step="any" placeholder="Weight / size of the pack" value={r.pkg} onChange={e => setRow(i, { pkg: e.target.value })} style={{ flex: '1 1 120px' }} />
              <select value={r.unit} aria-label="Pack unit" onChange={e => setRow(i, { unit: e.target.value, uunit: isMass(e.target.value) === isMass(r.uunit) ? r.uunit : e.target.value })}>
                {UNITS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              <input type="number" min="0" step="any" placeholder="Price you paid (₱)" value={r.price} onChange={e => setRow(i, { price: e.target.value })} style={{ flex: '1 1 120px' }} />
            </div>

            <label>How much you use in one batch</label>
            <div className="bar" style={{ marginBottom: 4 }}>
              <input type="number" min="0" step="any" placeholder="Amount used" value={r.used} onChange={e => setRow(i, { used: e.target.value })} style={{ flex: '1 1 120px' }} />
              <select value={r.uunit} aria-label="Used unit" onChange={e => setRow(i, { uunit: e.target.value })}>
                {family(r.unit).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>

            {c.ok && <small style={{ color: 'var(--mute)' }}>Cost in this batch: {peso(c.cost)}</small>}
            {note && <p className="auth-note" style={{ marginBottom: 0 }}>{note}</p>}
          </div>
        )
      })}
      <button type="button" className="btn ghost sm" onClick={() => setRows([...rows, blank()])}>Add ingredient</button>
      {mass > 0 && vol > 0 && <p className="auth-note warn">You mixed weight and liquid. The size per piece uses the weight only.</p>}

      <label style={{ marginTop: 16 }}>How many pieces will this batch be divided into?</label>
      <input type="number" min="1" step="1" required value={pieces} onChange={e => setPieces(e.target.value)} style={{ width: '100%' }} />

      {n > 0 && total > 0 && (
        <div className="stats" style={{ marginTop: 16, marginBottom: 8 }}>
          <div className="stat"><b>{peso(total)}</b><small>Batch cost</small></div>
          <div className="stat"><b>{peso(cost)}</b><small>Cost per piece</small></div>
          <div className="stat"><b>{size ? `${size[0]} ${unitLabel(size[1])}` : '—'}</b><small>Size per piece</small></div>
        </div>
      )}

      <label>Selling price per piece (₱)</label>
      <input type="number" min="0" step="any" required value={price} placeholder={n && total ? String(Math.ceil(cost * 100) / 100) : ''} onChange={e => setPrice(e.target.value)} style={{ width: '100%' }} />
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