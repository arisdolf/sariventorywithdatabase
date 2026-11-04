import { useState } from 'react'
import Empty from '../components/Empty'
import StatusPill from '../components/StatusPill'
import { api } from '../services/api'
import { CATS, peso } from '../utils/format'

export default function Products({ D, run, setModal, user }) {
  const [q, setQ] = useState('')
  const costs = user?.perms?.includes('costs')
  const list = D.products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))

  const form = p => setModal({
    title: p ? 'Edit product' : 'Add product',
    fields: [
      { n: 'name', l: 'Product name', v: p?.name, req: 1 },
      { n: 'cat', l: 'Category', opts: CATS, v: p?.cat },
      ...(costs ? [{ n: 'cost_price', l: 'Capital / cost per item (₱)', t: 'number', v: p?.cost_price ?? 0, req: 1 }] : []),
      { n: 'price', l: 'Selling price (₱)', t: 'number', v: p?.price, req: 1 },
      { n: 'qty', l: 'Stock quantity', t: 'number', v: p?.qty ?? 0, req: 1 },
    ],
    save: v => run(() => p ? api('/products/' + p.id, 'PUT', v) : api('/products', 'POST', v), 'Product saved'),
  })
  const remove = p => { if (confirm('Delete this product?')) run(() => api('/products/' + p.id, 'DELETE'), 'Product deleted') }

  return (
    <>
      <h1>Products</h1><p className="sub">Add, edit and track what you sell.</p>
      <div className="bar">
        <input placeholder="Search products" value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
        <button className="btn" onClick={() => form()}>Add product</button>
      </div>
      <div className="tw">{list.length ? <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            {costs && <th>Capital</th>}
            <th>Selling price</th>
            {costs && <th>Profit</th>}
            <th>Stock</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map(p => <tr key={p.id}>
            <td className="main">{p.name}</td>
            <td data-label="Category">{p.cat}</td>
            {costs && <td data-label="Capital">{peso(p.cost_price ?? 0)}</td>}
            <td data-label="Selling price">{peso(p.price)}</td>
            {costs && <td data-label="Profit / item">{peso(p.price - (p.cost_price ?? 0))}</td>}
            <td data-label="Stock">{p.qty}</td>
            <td data-label="Status"><StatusPill p={p} /></td>
            <td className="act"><button className="btn ghost sm" onClick={() => form(p)}>Edit</button>{' '}
              <button className="btn ghost sm" onClick={() => remove(p)}>Delete</button></td></tr>)}
        </tbody></table> : <Empty>No products found. Try another search or add a product.</Empty>}</div>
    </>
  )
}