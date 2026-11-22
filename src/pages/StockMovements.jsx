import Empty from '../components/Empty'
import { api } from '../services/api'

export default function StockMovements({ D, run, setModal }) {
  const pname = id => D.products.find(p => p.id === id)?.name || 'Deleted product'
  const batches = (D.batches || []).filter(b => b.qty > 0).map(batch => {
    const product = D.products.find(p => p.id === batch.pid)
    if (!product) return null
    const productCode = product.code ? ` | Barcode ${product.code}` : ''
    const expiry = batch.expiry
      ? `Expires ${new Date(batch.expiry + 'T00:00').toLocaleDateString('en-PH', { dateStyle: 'medium' })}`
      : 'No expiry date'
    return { batch, product, label: `${product.name}${productCode} | Batch ${batch.code || 'No code'} | ${expiry} | ${batch.qty} left` }
  }).filter(Boolean)

  const removeStock = () => setModal({
    title: 'Remove stock',
    fields: [
      { n: 'batch_id', l: 'Product and batch', opts: batches.map(({ batch, label }) => [batch.id, label]), search: 1, searchToOpen: 1, ph: 'Search product, barcode or batch code…' },
      { n: 'qty', l: v => {
        const selected = batches.find(({ batch }) => batch.id === +v.batch_id)?.batch
        return selected ? `Pieces to remove (max ${selected.qty})` : 'Pieces to remove'
      }, t: 'number', v: 1, min: 1, max: v => batches.find(({ batch }) => batch.id === +v.batch_id)?.batch.qty, step: 1, req: 1 },
      { n: 'reason', l: 'Reason', opts: [['expired', 'Expired'], ['damaged', 'Damaged'], ['lost', 'Lost'], ['other', 'Other']] },
      { n: 'rem', l: 'Remarks (optional)' },
    ],
    save: v => {
      const selected = batches.find(({ batch }) => batch.id === +v.batch_id)
      if (!selected) return
      return run(() => api('/stock/remove', 'POST', {
        product_id: selected.product.id, batch_id: selected.batch.id, qty: +v.qty, reason: v.reason, remarks: v.rem,
      }), 'Stock removed')
    },
  })

  return (
    <>
      <h1>Stock movements</h1><p className="sub">Every stock change is logged here. Add new stock on the Inventory page.</p>
      <div className="bar">
        <button className="btn ghost" onClick={removeStock}>Remove stock</button>
      </div>
      <div className="tw">{D.moves.length ? <table>
        <thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Qty</th><th>By</th><th>Remarks</th></tr></thead>
        <tbody>
          {D.moves.map(m => <tr key={m.id}>
            <td data-label="Date">{m.at}</td>
            <td className="main">{pname(m.pid)}</td>
            <td data-label="Type"><span className={'pill ' + (m.type === 'OUT' ? 'low' : '')}>{m.type}</span></td>
            <td data-label="Qty">{m.qty}</td>
            <td data-label="By">{m.who || '—'}</td>
            <td data-label="Remarks">{m.remarks}</td>
          </tr>)}
        </tbody></table> : <Empty>No movements yet.</Empty>}</div>
    </>
  )
}
