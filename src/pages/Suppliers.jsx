import Empty from '../components/Empty'
import { api } from '../services/api'

export default function Suppliers({ D, run, setModal }) {
  const add = () => setModal({
    title: 'Add supplier',
    fields: [{ n: 'name', l: 'Supplier name', req: 1 }, { n: 'contact', l: 'Contact person' }, { n: 'phone', l: 'Phone' }],
    save: v => run(() => api('/suppliers', 'POST', v), 'Supplier saved'),
  })
  const remove = s => { if (confirm('Delete this supplier?')) run(() => api('/suppliers/' + s.id, 'DELETE'), 'Supplier deleted') }
  return (
    <>
      <h1>Suppliers</h1><p className="sub">People you buy stock from.</p>
      <div className="bar"><button className="btn" onClick={add}>Add supplier</button></div>
      <div className="tw">{D.suppliers.length ? <table><thead><tr><th>Name</th><th>Contact person</th><th>Phone</th><th></th></tr></thead><tbody>
        {D.suppliers.map(s => <tr key={s.id}><td className="main">{s.name}</td><td data-label="Contact">{s.contact}</td><td data-label="Phone">{s.phone}</td>
          <td className="act"><button className="btn ghost sm" onClick={() => remove(s)}>Delete</button></td></tr>)}
      </tbody></table> : <Empty>No suppliers yet.</Empty>}</div>
    </>
  )
}
