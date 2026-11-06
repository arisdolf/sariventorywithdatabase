import Empty from '../components/Empty'
import { api } from '../services/api'

export default function Suppliers({ D, run, setModal }) {
  const form = s => setModal({
    title: s ? 'Edit supplier' : 'Add supplier',
    fields: [
      { n: 'name', l: 'Supplier name', v: s?.name, req: 1 },
      { n: 'contact', l: 'Contact person (optional)', v: s?.contact },
      { n: 'phone', l: 'Phone (optional)', v: s?.phone },
      { n: 'email', l: 'Email (optional)', t: 'email', v: s?.email },
      { n: 'address', l: 'Address (optional)', v: s?.address },
    ],
    save: v => run(() => s ? api('/suppliers/' + s.id, 'PUT', v) : api('/suppliers', 'POST', v), 'Supplier saved'),
  })
  const remove = s => { if (confirm('Delete this supplier?')) run(() => api('/suppliers/' + s.id, 'DELETE'), 'Supplier deleted') }

  return (
    <>
      <h1>Suppliers</h1><p className="sub">People you buy stock from.</p>
      <div className="bar"><button className="btn" onClick={() => form()}>Add supplier</button></div>
      <div className="tw wrap">{D.suppliers.length ? <table>
        <thead><tr><th>Name</th><th>Contact person</th><th>Phone</th><th>Email</th><th>Address</th><th></th></tr></thead>
        <tbody>
          {D.suppliers.map(s => <tr key={s.id}>
            <td className="main">{s.name}</td>
            <td data-label="Contact">{s.contact || '—'}</td>
            <td data-label="Phone">{s.phone || '—'}</td>
            <td data-label="Email">{s.email || '—'}</td>
            <td data-label="Address">{s.address || '—'}</td>
            <td className="act">
              <button className="btn ghost sm" onClick={() => form(s)}>Edit</button>{' '}
              <button className="btn ghost sm" onClick={() => remove(s)}>Delete</button>
            </td></tr>)}
        </tbody></table> : <Empty>No suppliers yet.</Empty>}</div>
    </>
  )
}