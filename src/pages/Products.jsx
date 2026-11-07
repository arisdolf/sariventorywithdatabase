import { useState } from 'react'
import Empty from '../components/Empty'
import StatusPill from '../components/StatusPill'
import Categories from '../components/Categories'
import { api } from '../services/api'
import { peso } from '../utils/format'
import { useConfirm } from '../components/Confirm'
export default function Products({ D, run, setModal, user }) {
  const ask = useConfirm()
  const [q, setQ] = useState('')
  const [showCats, setShowCats] = useState(false)
  const costs = user?.perms?.includes('costs')
  const list = D.products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
  const [showArch, setShowArch] = useState(false)
  const form = p => setModal({
    title: p ? 'Edit product' : 'Add product',
    fields: [
      { n: 'name', l: 'Product name', v: p?.name, req: 1 },
      { n: 'description', l: 'Description (optional)', v: p?.description },
      { n: 'cat', l: 'Category', opts: [['', 'No category'], ...(D.categories || []).map(c => c.name)], v: p?.cat },
      ...(costs ? [{ n: 'cost_price', l: 'Capital / cost per item (₱)', t: 'number', v: p?.cost_price ?? 0, req: 1 }] : []),
      { n: 'price', l: 'Selling price (₱)', t: 'number', v: p?.price, req: 1 },
      { n: 'low_stock', l: 'Warn me when stock is at or below', t: 'number', v: p?.low_stock ?? 10, req: 1 },
      { n: 'qty', l: 'Stock quantity', t: 'number', v: p?.qty ?? 0, req: 1 },
    ],
    save: v => run(() => p ? api('/products/' + p.id, 'PUT', v) : api('/products', 'POST', v), 'Product saved'),
  })
     const remove = async p => {
    if (await ask({ title: 'Delete product?', message: `“${p.name}” will be hidden. You can restore it from the Deleted list.`, confirmText: 'Delete', danger: true }))
      run(() => api('/products/' + p.id, 'DELETE'), 'Product deleted')
  }
  const restore = p => run(() => api('/products/' + p.id + '/restore', 'POST'), 'Product restored')
  return (
    <>
      <h1>Products</h1><p className="sub">Add, edit and track what you sell.</p>
      <div className="bar">
        <input placeholder="Search products" value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
        {(D.archived || []).length > 0 && (
          <button className="btn ghost" onClick={() => setShowArch(s => !s)}>Deleted ({D.archived.length})</button>
        )}
        <button className="btn ghost" onClick={() => setShowCats(s => !s)}>{showCats ? 'Hide categories' : 'Categories'}</button>
        <button className="btn" onClick={() => form()}>Add product</button>
      </div>
      {showCats && <Categories D={D} run={run} setModal={setModal} />}
      {showArch && (
        <div className="card" style={{ marginBottom: 14 }}>
          <h3>Deleted products</h3>
          {D.archived.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid var(--line)' }}>
              <span>{p.name}</span>
              <button className="btn ghost sm" onClick={() => restore(p)}>Restore</button>
            </div>
          ))}
        </div>
      )}
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
            <td className="main"><div>{p.name}
              {p.description && <div style={{ fontWeight: 400, fontSize: 13, color: 'var(--mute)' }}>{p.description}</div>}
            </div></td>
            <td data-label="Category">{p.cat || '—'}</td>
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