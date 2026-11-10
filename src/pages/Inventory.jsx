import { useState } from 'react'
import Empty from '../components/Empty'
import StatusPill from '../components/StatusPill'
import { api } from '../services/api'

const SOON = 30 // days
const dayDiff = e => Math.round((new Date(e + 'T00:00') - new Date(new Date().toLocaleDateString('en-CA') + 'T00:00')) / 864e5)
const fmt = e => new Date(e + 'T00:00').toLocaleDateString('en-PH', { dateStyle: 'medium' })
const packText = b => b.pack === 'box' ? `${b.boxes} box${b.boxes === 1 ? '' : 'es'} × ${b.per_box} pcs` : 'By piece'

function Expiry({ e }) {
  if (!e) return <span style={{ color: 'var(--mute)' }}>No expiry</span>
  const d = dayDiff(e)
  return <>
    {fmt(e)}{' '}
    {d < 0 ? <span className="pill low out">Expired</span>
      : d <= SOON ? <span className="pill low">{d === 0 ? 'Today' : d + 'd left'}</span> : null}
  </>
}

export default function Inventory({ D, run, setModal }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState({})
  const cats = D.categories || []

  const by = {}
  for (const b of D.batches || []) (by[b.pid] ||= []).push(b) // already sorted: earliest expiry first

  const needle = q.trim().toLowerCase()
  const rows = D.products.map(p => {
    const bs = by[p.id] || []
    const ds = bs.filter(b => b.expiry).map(b => dayDiff(b.expiry))
    return { p, bs, expired: ds.some(d => d < 0), soon: ds.some(d => d >= 0 && d <= SOON) }
  }).filter(({ p, bs, expired, soon }) =>
    (!needle || (p.name + ' ' + (p.code || '')).toLowerCase().includes(needle) || bs.some(b => (b.code || '').toLowerCase().includes(needle))) &&
    (cat === '' || (cat === '__none' ? !p.cat : p.cat === cat)) &&
    (status === '' ||
      (status === 'low' && p.qty > 0 && p.qty <= (p.low_stock ?? 10)) ||
      (status === 'out' && p.qty <= 0) ||
      (status === 'soon' && soon) ||
      (status === 'expired' && expired))
  )
  const groups = [...cats.map(c => c.name), ''].map(n => [n, rows.filter(r => (r.p.cat || '') === n)]).filter(([, l]) => l.length)

  const opts = D.products.map(p => [p.id, p.name + (p.code ? ' · ' + p.code : '') + ' (' + p.qty + ' in stock)'])

  const receive = p => setModal({
    title: p ? 'Add stock · ' + p.name : 'Receive stock',
    fields: [
      ...(p ? [] : [{ n: 'pid', l: 'Product', opts, search: 1, ph: 'Search product…' }]),
      { n: 'pack', l: 'How is it received?', opts: [['piece', 'By piece'], ['box', 'By box']] },
      { n: 'qty', t: 'number', v: 1, req: 1,
        l: v => v.pack === 'box'
          ? 'Number of boxes' + (+v.qty > 0 && +v.per_box > 0 ? ` (= ${v.qty * v.per_box} pieces)` : '')
          : 'Number of pieces' },
      { n: 'per_box', l: 'Pieces in each box', t: 'number', req: 1, show: v => v.pack === 'box' },
      { n: 'batch_code', l: 'Batch / barcode number (optional)' },
      { n: 'expiry', l: 'Expiry date (leave blank if none)', t: 'date' },
      { n: 'rem', l: 'Remarks (optional)' },
    ],
    save: v => run(() => api('/inventory/batches', 'POST', {
      product_id: +(p ? p.id : v.pid), pack: v.pack, qty: +v.qty,
      per_box: v.pack === 'box' ? +v.per_box : null,
      batch_code: v.batch_code, expiry: v.expiry, remarks: v.rem,
    }), 'Stock added'),
  })

  const editBatch = b => setModal({
    title: 'Edit batch details',
    fields: [
      { n: 'batch_code', l: 'Batch / barcode number', v: b.code },
      { n: 'expiry', l: 'Expiry date', t: 'date', v: b.expiry },
    ],
    save: v => run(() => api('/inventory/batches/' + b.id, 'PUT', { batch_code: v.batch_code, expiry: v.expiry }), 'Batch updated'),
  })

  const removeBatch = (p, b) => setModal({
    title: 'Remove from batch · ' + p.name,
    fields: [
      { n: 'qty', l: `Pieces to remove (max ${b.qty})`, t: 'number', v: b.qty, req: 1 },
      { n: 'reason', l: 'Reason', v: b.expiry && dayDiff(b.expiry) < 0 ? 'expired' : 'damaged',
        opts: [['expired', 'Expired'], ['damaged', 'Damaged'], ['lost', 'Lost'], ['other', 'Other']] },
      { n: 'rem', l: 'Remarks (optional)' },
    ],
    save: v => run(() => api('/stock/remove', 'POST', { product_id: p.id, batch_id: b.id, qty: +v.qty, reason: v.reason, remarks: v.rem }), 'Stock removed'),
  })

  return (
    <>
      <h1>Inventory</h1><p className="sub">Receive stock in batches and keep track of expiry dates.</p>
      <div className="bar">
        <input placeholder="Search product, barcode or batch number" value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
        <select value={cat} onChange={e => setCat(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          <option value="__none">No category</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
          <option value="soon">Expiring in {SOON} days</option>
          <option value="expired">Has expired stock</option>
        </select>
        <button className="btn" onClick={() => receive()}>Receive stock</button>
      </div>

      {groups.length ? groups.map(([name, list]) => (
        <section key={name} style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 8px' }}>{name || 'No category'} <small style={{ color: 'var(--mute)', fontWeight: 400 }}>· {list.length} product{list.length === 1 ? '' : 's'}</small></h3>
          {list.map(({ p, bs, expired, soon }) => {
            const on = !!open[p.id]
            const toggle = () => setOpen({ ...open, [p.id]: !on })
            return (
              <div className="card" key={p.id} style={{ marginBottom: 8 }}>
                <div role="button" tabIndex={0} onClick={toggle}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                    <b>{p.name}</b>{p.size_value ? <small style={{ color: 'var(--mute)' }}> · {p.size_value} {p.size_unit === 'l' ? 'L' : p.size_unit}</small> : null}
                    <div><small style={{ color: 'var(--mute)' }}>{bs.length} batch{bs.length === 1 ? '' : 'es'}</small></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {expired ? <span className="pill low out">Expired batch</span> : soon ? <span className="pill low">Expiring soon</span> : null}
                    <StatusPill p={p} />
                    <b>{p.qty}</b>
                    <span style={{ color: 'var(--mute)' }}>{on ? '▾' : '›'}</span>
                  </div>
                </div>

                {on && (
                  <div style={{ marginTop: 10, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                    {bs.length ? (
                      <div className="tw"><table>
                        <thead><tr><th>Batch / barcode</th><th>Received as</th><th>Added</th><th>Left</th><th>Expiry</th><th></th></tr></thead>
                        <tbody>
                          {bs.map(b => (
                            <tr key={b.id}>
                              <td className="main">{b.code || 'No batch number'}</td>
                              <td data-label="Received as">{packText(b)}</td>
                              <td data-label="Added">{b.at}</td>
                              <td data-label="Left">{b.qty}{b.qty !== b.received && <small style={{ color: 'var(--mute)' }}> of {b.received}</small>}</td>
                              <td data-label="Expiry"><span><Expiry e={b.expiry} /></span></td>
                              <td className="act">
                                <button className="btn ghost sm" onClick={() => editBatch(b)}>Edit</button>{' '}
                                <button className="btn ghost sm" onClick={() => removeBatch(p, b)}>Remove</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table></div>
                    ) : <Empty>No stock yet. Add the first batch.</Empty>}
                    <button className="btn sm" style={{ marginTop: 10 }} onClick={() => receive(p)}>Add stock to this product</button>
                  </div>
                )}
              </div>
            )
          })}
        </section>
      )) : <Empty>No products found. Add products first, then receive stock here.</Empty>}
    </>
  )
}