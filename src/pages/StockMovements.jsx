import Empty from '../components/Empty'
import { api } from '../services/api'

export default function StockMovements({ D, run, setModal }) {
  const pname = id => D.products.find(p => p.id === id)?.name || 'Deleted product'
  const addStock = () => setModal({
    title: 'Add stock',
    fields: [
      { n: 'pid', l: 'Product', opts: D.products.map(p => [p.id, p.name]) },
      { n: 'qty', l: 'Quantity received', t: 'number', v: 1, req: 1 },
      { n: 'rem', l: 'Remarks (optional)' },
    ],
    save: v => run(() => api('/stock', 'POST', { product_id: +v.pid, qty: +v.qty, remarks: v.rem }), 'Stock added'),
  })
  return (
    <>
      <h1>Stock movements</h1><p className="sub">Every stock change is logged here</p>
      <div className="bar"><button className="btn" onClick={addStock}>Add stock</button></div>
      <div className="tw">{D.moves.length ? <table><thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Qty</th><th>Remarks</th></tr></thead><tbody>
        {D.moves.map(m => <tr key={m.id}><td data-label="Date">{m.at}</td><td className="main">{pname(m.pid)}</td><td data-label="Type"><span className={'pill ' + (m.type === 'OUT' ? 'low' : '')}>{m.type}</span></td><td data-label="Qty">{m.qty}</td><td data-label="Remarks">{m.remarks}</td></tr>)}
      </tbody></table> : <Empty>No movements yet.</Empty>}</div>
    </>
  )
}
