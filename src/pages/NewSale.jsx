import { useState } from 'react'
import Empty from '../components/Empty'
import Receipt from '../components/Receipt'
import { api } from '../services/api'
import { peso } from '../utils/format'

const METHODS = [['cash', 'Cash'], ['gcash', 'GCash'], ['maya', 'Maya'], ['other', 'Other']]

export default function NewSale({ D, run, toast, cart, setCart, user }) {
  const [sel, setSel] = useState('')
  const [sq, setSq] = useState('')
  const [open, setOpen] = useState(false)
  const [cq, setCq] = useState(1)
  const [method, setMethod] = useState('cash')
  const [paid, setPaid] = useState('')
  const [receipt, setReceipt] = useState(null)

  const pick = D.products.filter(p => p.qty > 0 && p.name.toLowerCase().includes((sel ? '' : sq).trim().toLowerCase()))
  const choose = p => { setSel(String(p.id)); setSq(p.name); setOpen(false) }
  const cartTotal = cart.reduce((a, c) => a + c.price * c.qty, 0)
  const change = (+paid || 0) - cartTotal

  const addToCart = () => {
    const p = D.products.find(i => i.id === +sel) || (sq.trim() && pick.length === 1 ? pick[0] : null)
    if (!p) return toast('Search and pick a product first')
    const n = Math.max(1, +cq || 1), c = cart.find(i => i.id === p.id), have = (c?.qty || 0) + n
    if (have > p.qty) return toast('Only ' + p.qty + ' in stock')
    setCart(c ? cart.map(i => i.id === p.id ? { ...i, qty: have } : i) : [...cart, { id: p.id, name: p.name, price: p.price, qty: n }])
    setSel(''); setSq(''); setCq(1); setOpen(false)
  }

  const checkout = async () => {
    if (method === 'cash' && (paid === '' || Math.round(+paid * 100) < Math.round(cartTotal * 100))) {
      return toast('Cash received is less than the total')
    }
    let res
    const ok = await run(async () => {
      res = await api('/sales', 'POST', {
        items: cart.map(c => ({ id: c.id, qty: c.qty })),
        method,
        amount_paid: method === 'cash' ? +paid : null,
      })
    }, 'Sale completed')
    if (ok) {
      setReceipt({
        store: user?.store, id: res.order_id, cashier: user?.name,
        at: new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }),
        items: cart, total: cartTotal, method, paid: method === 'cash' ? +paid : cartTotal,
      })
      setCart([]); setPaid(''); setMethod('cash')
    }
  }

  return (
    <>
      <h1>New sale</h1><p className="sub">Pick items, then complete the sale. Stock updates automatically.</p>
      <div className="bar">
        <div className="pick" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false) }}>
          <input placeholder="Search or pick a product" value={sq} autoComplete="off"
            onFocus={() => setOpen(true)}
            onChange={e => { setSq(e.target.value); setSel(''); setOpen(true) }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (pick[0]) choose(pick[0]) } }} />
          <button type="button" className="caret" aria-label="Show all products" onClick={() => setOpen(o => !o)}>▾</button>
          {open && <ul className="opts" onMouseDown={e => e.preventDefault()}>
            {pick.length
              ? pick.map(p => <li key={p.id}><button type="button" onClick={() => choose(p)}><span>{p.name}</span><small>{peso(p.price)} · {p.qty} left</small></button></li>)
              : <li className="none">No matching products</li>}
          </ul>}
        </div>
        <input type="number" min="1" value={cq} onChange={e => setCq(e.target.value)} style={{ width: 90 }} />
        <button className="btn" onClick={addToCart}>Add to sale</button>
      </div>
      <div className="tw">{cart.length ? <table><thead><tr><th>Item</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead><tbody>
        {cart.map((c, i) => <tr key={c.id}><td className="main">{c.name}</td><td data-label="Qty">{c.qty}</td><td data-label="Subtotal">{peso(c.price * c.qty)}</td><td className="act"><button className="btn ghost sm" onClick={() => setCart(cart.filter((_, j) => j !== i))}>Remove</button></td></tr>)}
      </tbody></table> : <Empty>The sale is empty. Add a product above.</Empty>}</div>

      <div className="tot">Total: {peso(cartTotal)}</div>

      {cart.length > 0 && (
        <div className="card" style={{ marginBottom: 14, maxWidth: 520 }}>
          <h3>Payment</h3>
          <div className="bar" style={{ marginBottom: 10 }}>
            {METHODS.map(([k, label]) => (
              <button key={k} type="button" className={'btn sm ' + (method === k ? '' : 'ghost')} onClick={() => setMethod(k)}>{label}</button>
            ))}
          </div>
          {method === 'cash' && <>
            <label>Cash received (₱)</label>
            <div className="bar" style={{ marginBottom: 6 }}>
              <input type="number" min="0" step="any" inputMode="decimal" value={paid}
                onChange={e => setPaid(e.target.value)} style={{ flex: 1 }} />
              <button type="button" className="btn ghost" onClick={() => setPaid(String(cartTotal))}>Exact</button>
            </div>
            <div style={{ fontWeight: 600, color: change < 0 ? 'var(--bad)' : 'var(--acc)' }}>
              {paid === '' ? 'Enter the cash received'
                : change < 0 ? 'Short by ' + peso(-change)
                : 'Change: ' + peso(change)}
            </div>
          </>}
        </div>
      )}

      <button className="btn" disabled={!cart.length} onClick={checkout}>Complete sale</button>
      {receipt && <Receipt r={receipt} onClose={() => setReceipt(null)} />}
    </>
  )
}