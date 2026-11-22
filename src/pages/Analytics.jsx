import { useEffect, useState } from 'react'
import Empty from '../components/Empty'
import SearchSelect from '../components/SearchSelect'
import { PageSkeleton } from '../components/Skeleton'
import { api } from '../services/api'
import { peso } from '../utils/format'

const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]
const GROUPS = [['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['yearly', 'Yearly']]
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)
const MAX_MONTHS = 60

// Quick ranges: a grouping is only offered when it makes sense for the range AND the account is old enough
const groupOk = (g, unit, n, meta) => {
  const months = unit === 'years' ? n * 12 : n
  if (g === 'daily') return months <= 3
  if (g === 'weekly') return months <= 12 && meta.age_days >= 14
  if (g === 'monthly') return months >= 2 && meta.age_months >= 2
  return unit === 'years' && n >= 2 && meta.age_years >= 2 // yearly
}

// Custom ranges: the grouping depends only on how many months the range covers
const customOk = (g, m) => g === 'daily' ? m <= 3 : g === 'weekly' ? m <= 12 : g === 'monthly' ? m >= 2 : m >= 24

// Months are strings like "2022-01"
const spanMonths = (a, b) => (+b.slice(0, 4) - +a.slice(0, 4)) * 12 + (+b.slice(5) - +a.slice(5)) + 1
const ym = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
const lastDay = v => new Date(+v.slice(0, 4), +v.slice(5), 0).getDate()

function MonthPick({ value, onChange }) {
  const [y, m] = value.split('-')
  return (
    <span style={{ display: 'flex', gap: 8, flex: '1 1 240px' }}>
      <SearchSelect label="Month" value={m} onChange={value => onChange(y + '-' + value)} options={MONTHS.map((name, i) => [String(i + 1).padStart(2, '0'), name])} style={{ flex: 1 }} />
      <SearchSelect label="Year" value={y} onChange={value => onChange(value + '-' + m)} options={YEARS.map(yr => [yr, yr])} style={{ flex: '0 1 100px' }} />
    </span>
  )
}

export default function Analytics({ toast, embedded, setView }) {
  const now = new Date()
  const [mode, setMode] = useState('quick') // quick | custom
  const [g, setG] = useState('daily')
  const [unit, setUnit] = useState('months')
  const [n, setN] = useState(1)
  const [from, setFrom] = useState(ym(new Date(now.getFullYear(), now.getMonth() - 1, 1)))
  const [to, setTo] = useState(ym(now))
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)

  const custom = mode === 'custom'
  const months = spanMonths(from, to)
  const rangeOk = months >= 1 && months <= MAX_MONTHS
  // In custom mode, use the chosen grouping if it fits the range, otherwise the first one that does
  const gEff = custom ? (customOk(g, months) ? g : (GROUPS.find(([k]) => customOk(k, months))?.[0] ?? 'daily')) : g

  const pickFrom = v => { setFrom(v); if (v > to) setTo(v) }
  const pickTo = v => { setTo(v); if (v < from) setFrom(v) }

  useEffect(() => {
    if (custom && !rangeOk) return
    const url = custom
      ? `/analytics?group=${gEff}&from=${from}-01&to=${to}-${lastDay(to)}`
      : `/analytics?group=${g}&unit=${unit}&n=${n}`
    setBusy(true)
    api(url)
      .then(setData)
      .catch(e => toast(e.message))
      .finally(() => setBusy(false))
  }, [mode, g, unit, n, from, to])

  if (!data) return <PageSkeleton page="analytics" />

  const { meta = {}, series, totals } = data
  const maxN = unit === 'years' ? meta.age_years : Math.max(1, meta.age_months)
  const steps = STEPS.filter(s => s <= maxN)
  const groups = GROUPS.filter(([k]) => custom ? customOk(k, months) : groupOk(k, unit, n, meta))
  const canYears = meta.age_years >= 1
  const max = Math.max(...series.map(s => s.sales), 1)
  const plotTop = 8
  const plotBottom = 222
  const chartPoints = series.map((item, index) => ({
    item,
    x: series.length === 1 ? 500 : 12 + index * (976 / (series.length - 1)),
    y: plotTop + (plotBottom - plotTop) * (1 - item.sales / max),
  }))
  const linePath = chartPoints.map(({ x, y }, index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' ')
  const labelStep = Math.max(1, Math.ceil((series.length - 1) / 5))
  const xLabels = chartPoints.filter((_, index) => index % labelStep === 0 || index === series.length - 1)
  const yTicks = Array.from({ length: 5 }, (_, index) => ({
    y: plotTop + (plotBottom - plotTop) * index / 4,
    value: max * (1 - index / 4),
  }))

  // Change the quick range, and move to a valid grouping if the current one no longer fits
  const setRange = (u, k) => {
    setUnit(u); setN(k)
    if (!groupOk(g, u, k, meta)) {
      const first = GROUPS.find(([x]) => groupOk(x, u, k, meta))
      if (first) setG(first[0])
    }
  }
  const goQuick = () => { setMode('quick'); setG('daily'); setUnit('months'); setN(1) }

  return (
    <>
      {!embedded && <>
        <button type="button" className="link" onClick={() => setView('settings')}>‹ Back to Settings</button>
        <h1 style={{ marginTop: 8 }}>Analytics</h1>
        <p className="sub">Sales over time. Pick a quick range or choose your own dates.</p>
      </>}

      <div className="bar">
        <div className="seg" style={{ margin: 0 }}>
          <button type="button" className={!custom ? 'on' : ''} onClick={goQuick}>Quick</button>
          <button type="button" className={custom ? 'on' : ''} onClick={() => setMode('custom')}>Custom</button>
        </div>
        <div className="seg" style={{ margin: 0 }}>
          {groups.map(([k, l]) => (
            <button key={k} type="button" className={gEff === k ? 'on' : ''} onClick={() => setG(k)}>{l}</button>
          ))}
        </div>

        {!custom && <>
          <SearchSelect label="Date range" value={n} onChange={value => setRange(unit, +value)}
            options={steps.map(s => [s, `Last ${s} ${unit === 'years' ? (s === 1 ? 'year' : 'years') : (s === 1 ? 'month' : 'months')}`])} />
          {canYears && (
            <div className="seg" style={{ margin: 0 }}>
              <button type="button" className={unit === 'months' ? 'on' : ''} onClick={() => setRange('months', 1)}>Months</button>
              <button type="button" className={unit === 'years' ? 'on' : ''} onClick={() => setRange('years', 1)}>Years</button>
            </div>
          )}
        </>}
      </div>

      {custom && (
        <div className="bar" style={{ alignItems: 'center' }}>
          <span style={{ color: 'var(--mute)' }}>From</span>
          <MonthPick value={from} onChange={pickFrom} />
          <span style={{ color: 'var(--mute)' }}>to</span>
          <MonthPick value={to} onChange={pickTo} />
        </div>
      )}
      {custom && !rangeOk && <p className="auth-err" style={{ marginTop: 0 }}>Please pick a range of 5 years or less.</p>}

      {(!custom || rangeOk) && (
        <div style={{ opacity: busy ? 0.5 : 1, transition: 'opacity .15s' }}>
          <div className="stats">
            <div className="stat"><b>{peso(totals.sales)}</b><small>Total sales</small></div>
            <div className="stat"><b>{totals.orders}</b><small>Orders</small></div>
            <div className="stat"><b>{peso(totals.orders ? totals.sales / totals.orders : 0)}</b><small>Average sale</small></div>
            {totals.profit != null && <div className="stat"><b>{peso(totals.profit)}</b><small>Profit</small></div>}
          </div>

          {totals.orders ? <>
            <div className="an-line-chart" role="img" aria-label="Sales line chart by period. Exact values are listed in the table below.">
              <div className="an-line-y-axis" aria-hidden="true">
                {yTicks.map((tick, index) => <span key={index}>{peso(Math.round(tick.value)).replace(/\.00$/, '')}</span>)}
              </div>
              <svg className="an-line-svg" viewBox="0 0 1000 230" preserveAspectRatio="none" aria-hidden="true">
                {yTicks.map((tick, index) => <line key={index} className="an-line-grid" x1="0" x2="1000" y1={tick.y} y2={tick.y} />)}
                {chartPoints.length > 1 && <path className="an-line-path" d={linePath} pathLength="1" />}
                {chartPoints.map(({ item, x, y }, index) => (
                  <circle key={item.key} className="an-line-point" style={{ animationDelay: `${Math.min(index, 10) * 24}ms` }} cx={x} cy={y} r="4">
                    <title>{`${item.label}: ${peso(item.sales)} · ${item.orders} order${item.orders === 1 ? '' : 's'}`}</title>
                  </circle>
                ))}
              </svg>
              <div className="an-line-x-spacer" aria-hidden="true" />
              <div className="an-line-x-axis" aria-hidden="true">
                {xLabels.map(({ item, x }, index) => {
                  const first = item.key === series[0].key
                  const last = item.key === series[series.length - 1].key
                  return <span key={item.key} className={`an-line-x-label${first ? ' is-first' : ''}${last ? ' is-last' : ''}${index % 2 === 1 && !last ? ' hide-mobile' : ''}`} style={{ left: `${x / 10}%` }}>{item.label}</span>
                })}
              </div>
            </div>

            <div className="tw scroll"><table>
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
      )}
    </>
  )
}
