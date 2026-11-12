import { useState } from 'react'
import Empty from '../components/Empty'
import StatusPill from '../components/StatusPill'
import Categories from '../components/Categories'
import HomemadeProduct from './HomemadeProduct'
import { api } from '../services/api'
import { peso, UNITS, isMass, unitLabel, BASE, r2, nice } from '../utils/format'
import { useConfirm } from '../components/Confirm'

const soldText = p => p.sold_by === 'pack' ? `Pack of ${p.pack_qty} pcs`
  : p.sold_by === 'box' ? `Box of ${p.pack_qty} ${p.box_contains === 'pack' ? 'packs' : 'pcs'}` : ''

// Works out cost, size and minimum price of one repack from the bulk details
const repack = v => {
  const B = +v.bulk_price, S = +v.bulk_size, N = Math.round(+v.divisions)
  if (!(B > 0 && S > 0 && N >= 1)) return null
  const [size, unit] = nice(S * BASE[v.bulk_unit] / N, isMass(v.bulk_unit))
  return { cost: B / N, min: Math.ceil(B / N * 100) / 100, size, unit, N }
}

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
      ...(!p && costs ? [{
        n: 'repack', v: false,
        tabs: [
          [false, 'Regular product', 'For items you buy and sell as they are, like a canned drink or a bag of chips.', 'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8'],
          [true, 'Repacked goods', 'For goods you buy in bulk and divide evenly into smaller packs, like a sack of rice sold per kilo.', 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z'],
        ],
      }] : []),
      { n: 'bulk_price', l: 'Price you paid for the whole bulk (₱)', t: 'number', req: 1, show: v => v.repack },
{ n: 'bulk_size', u: 'bulk_unit', amt: 1, l: 'Total amount in the bulk', opts: UNITS, uv: 'kg', req: 1, show: v => v.repack },
{ n: 'divisions', l: 'How many repacks will you make?', t: 'number', req: 1, show: v => v.repack },
      {
        n: '_info', show: v => v.repack, note: v => {
          const r = repack(v)
          return r ? ['note', `Each repack: ${r.size} ${unitLabel(r.unit)}. Cost per repack: ${peso(r.cost)}. Minimum selling price: ${peso(r.min)}.`] : null
        }
      },
      { n: 'name', l: 'Product name', v: p?.name, req: 1 },
      { n: 'description', l: 'Description (optional)', v: p?.description },
      { n: 'code', l: 'Product code / barcode (optional)', v: p?.code },
      { n: 'sold_by', l: 'How is it sold?', v: p?.sold_by ?? 'piece', opts: [['piece', 'By piece'], ['pack', 'By pack'], ['box', 'By box']], show: v => !v.repack },
      { n: 'box_contains', l: 'What is inside the box?', v: p?.box_contains ?? 'piece', opts: [['piece', 'Pieces'], ['pack', 'Packs']], show: v => v.sold_by === 'box' && !v.repack },
      {
        n: 'pack_qty', t: 'number', v: p?.pack_qty, req: 1, show: v => v.sold_by !== 'piece' && !v.repack,
        l: v => v.sold_by === 'pack' ? 'How many pieces in a pack?' : `How many ${v.box_contains === 'pack' ? 'packs' : 'pieces'} in a box?`
      },
      {
        n: 'size_value', u: 'size_unit', amt: 1, l: 'Size per item (optional)', v: p?.size_value, uv: p?.size_unit || 'g', show: v => !v.repack,
        opts: [['mg', 'mg'], ['g', 'g'], ['kg', 'kg'], ['ml', 'ml'], ['l', 'L']]
      },
      { n: 'cat', l: 'Category', opts: [['', 'No category'], ...cats.map(c => c.name)], v: p?.cat },
      ...(costs ? [{ n: 'cost_price', l: 'Capital / cost per item (₱)', t: 'number', v: p?.cost_price ?? 0, req: 1, show: v => !v.repack }] : []),
      {
        n: 'price', l: 'Selling price (₱)', t: 'number', v: p?.price, req: 1,
        ph: v => { const r = v.repack && repack(v); return r ? String(r.min) : '' }
      },
      {
        n: '_warn', show: v => v.repack, note: v => {
          const r = repack(v), s = +v.price
          if (!r || v.price === '' || !s) return null
          if (s < r.min) return ['bad', `Your price is below the minimum of ${peso(r.min)}. You would lose ${peso(r.min - s)} on every repack.`]
          if (s === r.min) return ['warn', 'You would earn nothing on each repack. Add a little profit.']
          return ['note', `You earn ${peso(s - r.cost)} per repack. Selling all ${r.N} earns ${peso((s - r.cost) * r.N)}.`]
        }
      },
      { n: 'low_stock', l: 'Warn me when stock is at or below', t: 'number', v: p?.low_stock ?? 10, req: 1 },
    ],
    save: v => {
      const r = v.repack ? repack(v) : null
      if (v.repack && !r) return run(() => Promise.reject(new Error('Fill in the bulk price, amount and number of repacks')), '')
      const body = r
        ? { ...v, sold_by: 'piece', pack_qty: '', box_contains: '', cost_price: r2(r.cost), size_value: r.size, size_unit: r.unit, is_repacked: true }
        : { ...v, size_unit: v.size_value ? v.size_unit : '', pack_qty: v.sold_by === 'piece' ? '' : v.pack_qty, box_contains: v.sold_by === 'box' ? v.box_contains : '' }
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
              {p.is_repacked ? <> <span className="pill">Repacked</span></> : null}
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