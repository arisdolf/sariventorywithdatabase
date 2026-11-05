import { useEffect, useState } from 'react'
import Empty from '../components/Empty'
import { PageSkeleton } from '../components/Skeleton'
import { api } from '../services/api'
import { peso } from '../utils/format'

const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]
const GROUPS = [['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['yearly', 'Yearly']]

// A grouping is only offered when it makes sense for the range AND the account is old enough
const groupOk = (g, unit, n, meta) => {
  const months = unit === 'years' ? n * 12 : n
  if (g === 'daily') return months <= 3
  if (g === 'weekly') return months <= 12 && meta.age_days >= 14
  if (g === 'monthly') return months >= 2 && meta.age_months >= 2
  return unit === 'years' && n >= 2 && meta.age_years >= 2 // yearly
}

export default function Analytics({ toast }) {
  const [g, setG] = useState('daily')
  const [unit, setUnit] = useState('months')
  const [n, setN] = useState(1)
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setBusy(true)
    api(`/analytics?group=${g}&unit=${unit}&n=${n}`)
      .then(setData)
      .catch(e => toast(e.message))
      .finally(() => setBusy(false))
  }, [g, unit, n])

  if (!data) return <PageSkeleton page="analytics" />

  const { meta, series, totals } = data
  const maxN = unit === 'years' ? meta.age_years : Math.max(1, meta.age_months)
  const steps = STEPS.filter(s => s <= maxN)
  const groups = GROUPS.filter(([k]) => groupOk(k, unit, n, meta))
  const canYears = meta.age_years >= 1
  const max = Math.max(...series.map(s => s.sales), 1)

  // Change the range, and move to a valid grouping if the current one no longer fits
  const setRange = (u, k) => {
    setUnit(u); setN(k)
    if (!groupOk(g, u, k, meta)) {
      const first = GROUPS.find(([x]) => groupOk(x, u, k, meta))
      if (first) setG(first[0])
    }
  }

  return (
    <>
      <h1>Analytics</h1>
      <p className="sub">Sales over time. Options grow as your store gets older.</p>

      <div className="bar">
        <div className="seg" style={{ margin: 0 }}>
          {groups.map(([k, l]) => (
            <button key={k} type="button" className={g === k ? 'on' : ''} onClick={() => setG(k)}>{l}</button>
          ))}
        </div>
        <select value={n} onChange={e => setRange(unit, +e.target.value)}>
          {steps.map(s => <option key={s} value={s}>Last {s} {unit === 'years' ? (s === 1 ? 'year' : 'years') : (s === 1 ? 'month' : 'months')}</option>)}
        </select>
        {canYears && (
          <div className="seg" style={{ margin: 0 }}>
            <button type="button" className={unit === 'months' ? 'on' : ''} onClick={() => setRange('months', 1)}>Months</button>
            <button type="button" className={unit === 'years' ? 'on' : ''} onClick={() => setRange('years', 1)}>Years</button>
          </div>
        )}
      </div>

      <div style={{ opacity: busy ? 0.5 : 1, transition: 'opacity .15s' }}>
        <div className="stats">
          <div className="stat"><b>{peso(totals.sales)}</b><small>Total sales</small></div>
          <div className="stat"><b>{totals.orders}</b><small>Orders</small></div>
          <div className="stat"><b>{peso(totals.orders ? totals.sales / totals.orders : 0)}</b><small>Average sale</small></div>
          {totals.profit != null && <div className="stat"><b>{peso(totals.profit)}</b><small>Profit</small></div>}
        </div>

        {totals.orders ? <>
          <div className="an-chart">
            {series.map(s => (
              <div className="an-col" key={s.key} title={`${s.label}: ${peso(s.sales)} · ${s.orders} order${s.orders === 1 ? '' : 's'}`}>
                <div className="an-plot"><div className="an-bar" style={{ height: (s.sales / max * 100) + '%' }} /></div>
                <small>{s.label}</small>
              </div>
            ))}
          </div>

          <div className="tw"><table>
            <thead><tr><th>Period</th><th>Orders</th><th>Sales</th>{totals.profit != null && <th>Profit</th>}</tr></thead>
            <tbody>
              {[...series].reverse().map(s => (
                <tr key={s.key}>
                  <td className="main">{s.label}</td>
                  <td data-label="Orders">{s.orders}</td>
                  <td data-label="Sales">{peso(s.sales)}</td>
                  {totals.profit != null && <td data-label="Profit">{peso(s.profit)}</td>}
                </tr>
              ))}
            </tbody>
          </table></div>
        </> : <Empty>No sales in this period yet.</Empty>}
      </div>
    </>
  )
}
