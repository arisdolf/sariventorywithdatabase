import { useEffect, useState } from 'react'
import Empty from '../components/Empty'
import { api } from '../services/api'
import { peso } from '../utils/format'
import Receipt from '../components/Receipt'
import { PageSkeleton } from '../components/Skeleton'
const row = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0' }

export default function Sales({ run, toast, user }) {
  const [list, setList] = useState(null)
  const [open, setOpen] = useState(null)
  const canVoid = user?.perms?.includes('void')
  const costs = user?.perms?.includes('costs')
  const [rc, setRc] = useState(null)
  const load = () => api('/sales').then(setList).catch(e => toast(e.message))
  useEffect(() => { load() }, [])

  const voidSale = async s => {
    if (!confirm('Void sale #' + s.id + '? The items go back into stock.')) return
    const ok = await run(() => api('/sales/' + s.id + '/void', 'POST'), 'Sale voided and stock returned')
    if (ok) load()
  }

if (!list) return <PageSkeleton page="sales" />

  return (
    <>
      <h1>Sales history</h1><p className="sub">Your latest 100 sales. Tap one to see its items.</p>
      {list.length ? list.map(s => {
        const voided = s.status === 'cancelled'
        const profit = s.items.reduce((a, i) => a + (i.price - (i.cost ?? 0)) * i.qty, 0)
        return (
          <div className="card" key={s.id} style={{ marginBottom: 10, opacity: voided ? 0.6 : 1 }}>
            <div style={{ ...row, cursor: 'pointer', alignItems: 'center' }} onClick={() => setOpen(open === s.id ? null : s.id)}>
              <div>
                <b>Sale #{s.id}</b>{' '}
                {voided && <span className="pill low out">Voided</span>}
                <div style={{ color: 'var(--mute)', fontSize: 13 }}>{s.at}{s.cashier && ' · ' + s.cashier}</div>
              </div>
              <b style={{ textDecoration: voided ? 'line-through' : 'none' }}>{peso(s.total)}</b>
            </div>
            {open === s.id && <div style={{ marginTop: 10, borderTop: '1px solid var(--line)', paddingTop: 8 }}>
              {s.items.map((i, k) => (
                <div key={k} style={row}><span>{i.qty} × {i.name}</span><span>{peso(i.price * i.qty)}</span></div>
              ))}
              {costs && !voided && <div style={{ ...row, color: 'var(--mute)' }}><span>Profit</span><span>{peso(profit)}</span></div>}
                {!voided && (
                <button className="btn ghost sm" style={{ marginTop: 10, marginRight: 8 }}
                  onClick={() => setRc({ store: user?.store, id: s.id, at: s.at, cashier: s.cashier, items: s.items, total: s.total, method: s.method, paid: s.paid })}>
                  Print receipt
                </button>
              )}
              {canVoid && !voided && (
                <button className="btn ghost sm" style={{ marginTop: 10 }} onClick={() => voidSale(s)}>Void this sale</button>
              )}
            </div>}
          </div>
        )
      }) : <Empty>No sales yet.</Empty>}
            {rc && <Receipt r={rc} onClose={() => setRc(null)} />}
    </>
  )
}