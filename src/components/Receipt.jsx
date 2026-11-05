import { peso } from '../utils/format'

const LABEL = { cash: 'Cash', gcash: 'GCash', maya: 'Maya', other: 'Other' }

export default function Receipt({ r, onClose }) {
  const showCash = r.method === 'cash' && r.paid != null
  return (
    <div className="ov rc-ov">
      <div className="receipt">
        <div className="rc-c">
          <b style={{ fontSize: 16 }}>{r.store}</b>
          <div>Sale #{r.id}</div>
          <div>{r.at}</div>
          {r.cashier && <div>Cashier: {r.cashier}</div>}
        </div>
        <hr />
        {r.items.map((i, k) => (
          <div className="rc-r" key={k}><span>{i.qty} × {i.name}</span><span>{peso(i.price * i.qty)}</span></div>
        ))}
        <hr />
        <div className="rc-r"><b>TOTAL</b><b>{peso(r.total)}</b></div>
        <div className="rc-r"><span>Paid by</span><span>{LABEL[r.method] || r.method}</span></div>
        {showCash && <>
          <div className="rc-r"><span>Cash received</span><span>{peso(r.paid)}</span></div>
          <div className="rc-r"><span>Change</span><span>{peso(r.paid - r.total)}</span></div>
        </>}
        <hr />
        <div className="rc-c">Thank you! Come again.</div>
        <div className="row no-print">
          <button type="button" className="btn ghost" onClick={onClose}>Close</button>
          <button type="button" className="btn" onClick={() => window.print()}>Print</button>
        </div>
      </div>
    </div>
  )
}