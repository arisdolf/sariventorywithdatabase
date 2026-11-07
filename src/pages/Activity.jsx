import { useEffect, useState } from 'react'
import Empty from '../components/Empty'
import { PageSkeleton } from '../components/Skeleton'
import { api } from '../services/api'

const TYPES = [['', 'Everything'], ['sales', 'Sales'], ['stock', 'Stock'], ['catalog', 'Products and suppliers'], ['team', 'Team and settings']]
const COLOR = { sale: 'var(--acc)', void: 'var(--bad)', lowstock: 'var(--warn)', stock: 'var(--warn)', team: 'var(--acc)', settings: 'var(--mute)' }

export default function Activity({ toast, embedded, setView }) {
  const [rows, setRows] = useState(null)
  const [members, setMembers] = useState([])
  const [more, setMore] = useState(false)
  const [uid, setUid] = useState('')
  const [type, setType] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async append => {
    setBusy(true)
    const p = new URLSearchParams()
    if (uid) p.set('user', uid)
    if (type) p.set('type', type)
    if (append && rows?.length) p.set('before', rows[rows.length - 1].id)
    try {
      const d = await api('/activity?' + p)
      setMembers(d.members); setMore(d.more)
      setRows(append ? [...rows, ...d.items] : d.items)
    } catch (e) { toast(e.message) }
    setBusy(false)
  }
  useEffect(() => { load(false) }, [uid, type])

  if (!rows) return <PageSkeleton page="sales" />

  return (
    <>
                {!embedded && <>
        <button type="button" className="link" onClick={() => setView('settings')}>‹ Back to Settings</button>
        <h1 style={{ marginTop: 8 }}>Activity center</h1>
        <p className="sub">What everyone on your team has done, newest first.</p>
      </>}

      <div className="bar">
        <select value={uid} onChange={e => setUid(e.target.value)}>
          <option value="">Everyone</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={type} onChange={e => setType(e.target.value)}>
          {TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>

      {rows.length ? rows.map(a => (
        <div className="card" key={a.id} style={{ marginBottom: 8, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLOR[a.action] || 'var(--mute)', marginTop: 7, flex: 'none' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ overflowWrap: 'anywhere' }}><b>{a.who}</b> · {a.summary}</div>
            <small style={{ color: 'var(--mute)' }}>{a.at}</small>
          </div>
        </div>
      )) : <Empty>Nothing here yet.</Empty>}

      {more && <button className="btn ghost" disabled={busy} onClick={() => load(true)}>{busy ? 'Loading…' : 'Load more'}</button>}
    </>
  )
}