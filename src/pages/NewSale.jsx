import { useState } from 'react'
import Empty from '../components/Empty'
import { api } from '../services/api'
import { peso } from '../utils/format'

export default function NewSale({ D, run, toast, cart, setCart }) {
  const [sel, setSel] = useState('')
  const [sq, setSq] = useState('')
  const [open, setOpen] = useState(false)
  const [cq, setCq] = useState(1)

  const pick = D.products.filter(p => p.qty > 0 && p.name.toLowerCase().includes((sel ? '' : sq).trim().toLowerCase()))
  const choose = p => { setSel(String(p.id)); setSq(p.name); setOpen(false) }
  const cartTotal = cart.reduce((a, c) => a + c.price * c.qty, 0)

  const addToCart = () => {
    const p = D.products.find(i => i.id === +sel) || (sq.trim() && pick.length === 1 ? pick[0] : null)
    if (!p) return toast('Search and pick a product first')
    const n = Math.max(1, +cq || 1), c = cart.find(i => i.id === p.id), have = (c?.qty || 0) + n
    if (have > p.qty) return toast('Only ' + p.qty + ' in stock')
    setCart(c ? cart.map(i => i.id === p.id ? { ...i, qty: have } : i) : [...cart, { id: p.id, name: p.name, price: p.price, qty: n }])
    setSel(''); setSq(''); setCq(1); setOpen(false)
  }
  const checkout = async () => {
    const ok = await run(() => api('/sales', 'POST', { items: cart.map(c => ({ id: c.id, qty: c.qty })) }), 'Sale completed')
    if (ok) setCart([])
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
      <button className="btn" disabled={!cart.length} onClick={checkout}>Complete sale</button>
    </>
  )
}
