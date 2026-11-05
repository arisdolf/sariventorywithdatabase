import { useEffect, useState } from 'react'
import Empty from '../components/Empty'
import { api } from '../services/api'
import { PageSkeleton } from '../components/Skeleton'
const PERM = {
  sell: 'make sales', products: 'manage products', stock: 'add stock',
  suppliers: 'manage suppliers', costs: 'see capital and profit', team: 'manage the team',
  history: 'see sales history', void: 'void sales',
}

export default function Team({ user, toast }) {
  const [t, setT] = useState(null)
  const load = () => api('/team').then(setT).catch(e => toast(e.message))
  useEffect(() => { load() }, [])

  const act = async (fn, m) => {
    try { await fn(); await load(); toast(m) } catch (e) { toast(e.message) }
  }
  const copy = () => { navigator.clipboard?.writeText(t.store.join_code); toast('Code copied') }
  const newCode = () => {
    if (confirm('Make a new code? The old code will stop working.')) act(() => api('/team/code', 'POST'), 'New code created')
  }
  const remove = m => {
    if (confirm('Remove ' + m.name + ' from the store?')) act(() => api('/team/' + m.id, 'DELETE'), 'Member removed')
  }

if (!t) return <><h1>Team</h1><PageSkeleton title={false} stats={false} cards={4} /></>

  return (
    <>
      <h1>Team</h1><p className="sub">Manage who works in {t.store.name}.</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <small style={{ color: 'var(--mute)' }}>Store code. Give it to staff so they can join.</small>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 3, margin: '6px 0 12px' }}>{t.store.join_code}</div>
        <div className="bar" style={{ marginBottom: 0 }}>
          <button className="btn" onClick={copy}>Copy code</button>
          <button className="btn ghost" onClick={newCode}>Make a new code</button>
        </div>
      </div>

      <div className="tw">{t.members.length ? <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
        <tbody>
          {t.members.map(m => {
            const fixed = m.role === 'owner' || m.id === user.id
            return (
              <tr key={m.id}>
                <td className="main">{m.name}{m.id === user.id && ' (you)'}</td>
                <td data-label="Email">{m.email}</td>
                <td data-label="Role">
                  {fixed
                    ? (m.role === 'owner' ? 'Owner' : m.role)
                    : <select value={m.role} onChange={e => act(() => api('/team/' + m.id, 'PUT', { role: e.target.value }), 'Role updated')}>
                        {t.roles.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                      </select>}
                </td>
                <td className="act">{!fixed && <button className="btn ghost sm" onClick={() => remove(m)}>Remove</button>}</td>
              </tr>
            )
          })}
        </tbody></table> : <Empty>No team members yet.</Empty>}</div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>What each role can do</h3>
        {t.roles.map(r => (
          <div key={r.key} style={{ padding: '6px 0' }}>
            <b>{r.label}:</b> {r.perms.length ? r.perms.map(p => PERM[p]).join(', ') : 'view the dashboard only'}
          </div>
        ))}
      </div>
    </>
  )
}