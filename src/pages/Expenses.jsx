import { useEffect, useState } from 'react'
import Empty from '../components/Empty'
import { PageSkeleton } from '../components/Skeleton'
import { useConfirm } from '../components/Confirm'
import { api } from '../services/api'
import { peso } from '../utils/format'

const today = () => new Date().toLocaleDateString('en-CA')
const KIND = { supply: 'Shop supply', misc: 'Miscellaneous' }

export default function Expenses({ run, toast, setModal }) {
  const ask = useConfirm()
  const [month, setMonth] = useState(today().slice(0, 7))
  const [d, setD] = useState(null)
  const load = () => api('/expenses?month=' + month).then(setD).catch(e => toast(e.message))
  useEffect(() => { load() }, [month])

  const form = (kind, e) => {
    const k = e?.kind ?? kind
    setModal({
      title: e ? 'Edit expense' : k === 'misc' ? 'Add miscellaneous fee' : 'Add shop expense',
      fields: [
        { n: 'title', l: k === 'misc' ? 'What was it for? (e.g. tarpaulin, decorations)' : 'What did you buy? (e.g. paper cups, cooking oil)', v: e?.title, req: 1 },
        { n: 'description', l: 'Description (optional)', v: e?.description },
        { n: 'amount', l: 'How much did you spend? (₱)', t: 'number', v: e?.amount, req: 1 },
        { n: 'spent_on', l: 'Date', t: 'date', v: e?.spent_on ?? today(), req: 1 },
      ],
      save: async v => {
        const ok = await run(() => e ? api('/expenses/' + e.id, 'PUT', { ...v, kind: k }) : api('/expenses', 'POST', { ...v, kind: k }), 'Expense saved')
        if (ok) load()
      },
    })
  }

  const remove = async e => {
    if (!(await ask({ title: 'Delete expense?', message: `“${e.title}” will be removed from this month's costs.`, confirmText: 'Delete', danger: true }))) return
    const ok = await run(() => api('/expenses/' + e.id, 'DELETE'), 'Expense deleted')
    if (ok) load()
  }

  if (!d) return <PageSkeleton page="stock" />
  const t = d.totals

  return (
    <>
      <h1>Expenses</h1>
      <p className="sub">Things you use but do not sell, like cups, plastic bags, oil, gas and condiments, plus other fees. They are subtracted from your monthly profit.</p>

      <div className="bar">
        <input type="month" value={month} onChange={e => e.target.value && setMonth(e.target.value)} aria-label="Month" />
        <button className="btn" onClick={() => form('supply')}>Add shop expense</button>
        <button className="btn ghost" onClick={() => form('misc')}>Add miscellaneous fee</button>
      </div>

      <div className="stats">
        <div className="stat"><b>{peso(t.gross)}</b><small>Profit from sales</small></div>
        <div className="stat"><b>{peso(t.supplies)}</b><small>Shop supplies</small></div>
        <div className="stat"><b>{peso(t.misc)}</b><small>Miscellaneous fees</small></div>
        <div className="stat"><b style={{ color: t.net < 0 ? 'var(--bad)' : 'var(--acc)' }}>{peso(t.net)}</b><small>Net profit this month</small></div>
      </div>

      <div className="tw">{d.items.length ? <table>
        <thead><tr><th>What</th><th>Type</th><th>Date</th><th>Amount</th><th>By</th><th></th></tr></thead>
        <tbody>
          {d.items.map(e => (
            <tr key={e.id}>
              <td className="main"><div>{e.title}
                {e.description && <div style={{ fontWeight: 400, fontSize: 13, color: 'var(--mute)' }}>{e.description}</div>}
              </div></td>
              <td data-label="Type"><span className={'pill' + (e.kind === 'misc' ? ' low' : '')}>{KIND[e.kind]}</span></td>
              <td data-label="Date">{e.spent_on}</td>
              <td data-label="Amount">{peso(e.amount)}</td>
              <td data-label="By">{e.who || '—'}</td>
              <td className="act">
                <button className="btn ghost sm" onClick={() => form(e.kind, e)}>Edit</button>{' '}
                <button className="btn ghost sm" onClick={() => remove(e)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody></table> : <Empty>No expenses for this month.</Empty>}</div>
    </>
  )
}