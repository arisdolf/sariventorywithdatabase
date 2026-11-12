import { useState } from 'react'
import Empty from '../components/Empty'
import StatusPill from '../components/StatusPill'
import Categories from '../components/Categories'
import HomemadeProduct from './HomemadeProduct'
import { api } from '../services/api'
import { peso } from '../utils/format'
import { useConfirm } from '../components/Confirm'

const soldText = p => p.sold_by === 'pack' ? `Pack of ${p.pack_qty} pcs`
  : p.sold_by === 'box' ? `Box of ${p.pack_qty} ${p.box_contains === 'pack' ? 'packs' : 'pcs'}` : ''

export default function Products({ D, run, setModal, user }) {
  const ask = useConfirm()
  const [tab, setTab] = useState('list')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [showCats, setShowCats] = useState(false)
  const [showArch, setShowArch] = useState(false)
  const costs = user?.perms?.includes('costs')
  const cats = D.categories || []
  const active = cat === '' || cat === '__none' || cats.some(c => c.name === cat) ? cat : ''
  const list = D.products.filter(p =>
    (p.name.toLowerCase().includes(q.toLowerCase()) || (p.code || '').toLowerCase().includes(q.toLowerCase())) &&
    (active === '' || (active === '__none' ? !p.cat : p.cat === active))
  )

  const form = p => setModal({
    title: p ? 'Edit product' : 'Add product',
    fields: [
      { n: 'name', l: 'Product name', v: p?.name, req: 1 },
      { n: 'description', l: 'Description (optional)', v: p?.description },
      { n: 'code', l: 'Product code / barcode (optional)', v: p?.code },
      { n: 'sold_by', l: 'How is it sold?', v: p?.sold_by ?? 'piece', opts: [['piece', 'By piece'], ['pack', 'By pack'], ['box', 'By box']] },
      { n: 'box_contains', l: 'What is inside the box?', v: p?.box_contains ?? 'piece', opts: [['piece', 'Pieces'], ['pack', 'Packs']], show: v => v.sold_by === 'box' },
      { n: 'pack_qty', t: 'number', v: p?.pack_qty, req: 1, show: v => v.sold_by !== 'piece',
        l: v => v.sold_by === 'pack' ? 'How many pieces in a pack?' : `How many ${v.box_contains === 'pack' ? 'packs' : 'pieces'} in a box?` },
      { n: 'size_unit', l: 'Measure per item', v: p?.size_unit ?? '', opts: [['', 'Not measured'], ['mg', 'Milligrams (mg)'], ['g', 'Grams (g)'], ['kg', 'Kilograms (kg)'], ['ml', 'Milliliters (ml)'], ['l', 'Liters (L)']] },
      { n: 'size_value', l: 'Amount per item', t: 'number', v: p?.size_value, req: 1, show: v => v.size_unit },
      { n: 'cat', l: 'Category', opts: [['', 'No category'], ...cats.map(c => c.name)], v: p?.cat },
      ...(costs ? [{ n: 'cost_price', l: 'Capital / cost per item (₱)', t: 'number', v: p?.cost_price ?? 0, req: 1 }] : []),
      { n: 'price', l: 'Selling price (₱)', t: 'number', v: p?.price, req: 1 },
      { n: 'low_stock', l: 'Warn me when stock is at or below', t: 'number', v: p?.low_stock ?? 10, req: 1 },
    ],
    save: v => {
      const body = {
        ...v,
        size_value: v.size_unit ? v.size_value : '',
        pack_qty: v.sold_by === 'piece' ? '' : v.pack_qty,
        box_contains: v.sold_by === 'box' ? v.box_contains : '',
      }
      return run(() => p ? api('/products/' + p.id, 'PUT', body) : api('/products', 'POST', body), 'Product saved')
    },
  })

  const remove = async p => {
    if (await ask({ title: 'Delete product?', message: `“${p.name}” will be hidden. You can restore it from the Deleted list.`, confirmText: 'Delete', danger: true }))
      run(() => api('/products/' + p.id, 'DELETE'), 'Product deleted')
  }
  const restore = p => run(() => api('/products/' + p.id + '/restore', 'POST'), 'Product restored')

  return (
    <>
      <h1>Products</h1><p className="sub">Add and edit what you sell. Stock is added on the Inventory page.</p>

      {costs && (
        <div className="seg" style={{ maxWidth: 380, marginBottom: 14 }}>
          <button type="button" className={tab === 'list' ? 'on' : ''} onClick={() => setTab('list')}>All products</button>
          <button type="button" className={tab === 'home' ? 'on' : ''} onClick={() => setTab('home')}>Add homemade</button>
        </div>
      )}

      {tab === 'home' && costs ? <HomemadeProduct D={D} run={run} onDone={() => setTab('list')} /> : <>
        <div className="bar">
          <input placeholder="Search products" value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
          <select value={active} onChange={e => setCat(e.target.value)} aria-label="Filter by category">
            <option value="">All categories</option>
            {cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            <option value="__none">No category</option>
          </select>
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
              <th>Name</th><th>Category</th><th>Code</th><th>Size</th>
              {costs && <th>Capital</th>}
              <th>Selling price</th>
              {costs && <th>Profit</th>}
              <th>Stock</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(p => <tr key={p.id}>
              <td className="main"><div>{p.name}{p.is_homemade ? <> <span className="pill">Homemade</span></> : null}
                {soldText(p) && <div style={{ fontWeight: 400, fontSize: 13, color: 'var(--mute)' }}>{soldText(p)}</div>}
                {p.description && <div style={{ fontWeight: 400, fontSize: 13, color: 'var(--mute)' }}>{p.description}</div>}
              </div></td>
              <td data-label="Category">{p.cat || '—'}</td>
              <td data-label="Code">{p.code || '—'}</td>
              <td data-label="Size">{p.size_value ? `${p.size_value} ${p.size_unit === 'l' ? 'L' : p.size_unit}` : '—'}</td>
              {costs && <td data-label="Capital">{peso(p.cost_price ?? 0)}</td>}
              <td data-label="Selling price">{peso(p.price)}</td>
              {costs && <td data-label="Profit / item">{peso(p.price - (p.cost_price ?? 0))}</td>}
              <td data-label="Stock">{p.qty}</td>
              <td data-label="Status"><StatusPill p={p} /></td>
              <td className="act"><button className="btn ghost sm" onClick={() => form(p)}>Edit</button>{' '}
                <button className="btn ghost sm" onClick={() => remove(p)}>Delete</button></td></tr>)}
          </tbody></table> : <Empty>No products found. Try another search or add a product.</Empty>}</div>
      </>}
    </>
  )
}