export const Sk = ({ w = '100%', h = 14, r = 8, style }) =>
  <span className="sk" style={{ display: 'block', width: w, height: h, borderRadius: r, ...style }} />

const many = (n, fn) => Array.from({ length: n }, (_, i) => fn(i))

const Head = () => <>
  <Sk w={200} h={26} style={{ marginBottom: 8 }} />
  <Sk w={280} h={14} style={{ marginBottom: 22 }} />
</>

const Stats = ({ n = 3 }) => (
  <div className="stats">
    {many(n, i => (
      <div className="stat" key={i}>
        <Sk w={90} h={26} style={{ marginBottom: 8 }} /><Sk w={120} h={12} />
      </div>
    ))}
  </div>
)

// Toolbar row: optional search box + a few buttons
const Bar = ({ search = true, buttons = 1 }) => (
  <div className="bar">
    {search && <Sk h={40} style={{ flex: 1, minWidth: 160 }} />}
    {many(buttons, i => <Sk key={i} w={110} h={40} />)}
  </div>
)

// Looks like a table on desktop, stacked cards on mobile (see .sk-* in Components.css)
const Table = ({ cols = 5, rows = 6 }) => (
  <div className="sk-tbl">
    <div className="sk-row sk-head">{many(cols, i => <Sk key={i} w="60%" h={12} />)}</div>
    {many(rows, r => (
      <div className="sk-row" key={r}>
        {many(cols, i => <Sk key={i} w={i === 0 ? '80%' : '55%'} h={i === 0 ? 16 : 12} />)}
      </div>
    ))}
  </div>
)

const Lines = ({ n = 4 }) => many(n, i => (
  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0' }}>
    <Sk w="50%" h={14} /><Sk w={60} h={14} />
  </div>
))

const FormCard = ({ fields = 3 }) => (
  <div className="card" style={{ marginBottom: 20, maxWidth: 520 }}>
    <Sk w={140} h={18} style={{ marginBottom: 14 }} />
    {many(fields, i => (
      <div key={i} style={{ marginBottom: 12 }}>
        <Sk w={100} h={12} style={{ marginBottom: 6 }} />
        <Sk h={40} />
      </div>
    ))}
    <Sk w={130} h={40} style={{ marginTop: 16 }} />
  </div>
)

const HEIGHTS = [35, 55, 40, 70, 50, 85, 60, 45, 75, 55, 65, 40]

const PAGES = {
  dash: () => <>
    <Head /><Stats n={3} /><Stats n={4} />
    <div className="grid2">
      <div className="card"><Sk w={110} h={18} style={{ marginBottom: 12 }} /><Lines n={4} /></div>
      <div className="card"><Sk w={110} h={18} style={{ marginBottom: 12 }} /><Lines n={4} /></div>
    </div>
  </>,
inv: () => <><Head /><Bar buttons={2} /><Table cols={5} rows={6} /></>,
  prod: () => <><Head /><Bar buttons={3} /><Table cols={7} rows={6} /></>,

  sale: () => <>
    <Head />
    <div className="bar">
      <Sk h={40} style={{ flex: '1 1 260px' }} /><Sk w={90} h={40} /><Sk w={120} h={40} />
    </div>
    <Table cols={4} rows={3} />
    <Sk w={160} h={24} style={{ margin: '16px 0' }} />
    <Sk w={150} h={40} />
  </>,

  stock: () => <><Head /><Bar search={false} /><Table cols={5} rows={7} /></>,

  sup: () => <><Head /><Bar search={false} /><Table cols={6} rows={5} /></>,

  sales: () => <>
    <Head />
    {many(6, i => (
      <div className="card" key={i} style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Sk w={110} h={16} style={{ marginBottom: 8 }} /><Sk w="60%" h={12} />
        </div>
        <Sk w={70} h={18} />
      </div>
    ))}
  </>,

  team: () => <>
    <Head />
    <div className="card" style={{ marginBottom: 20 }}>
      <Sk w={220} h={12} style={{ marginBottom: 10 }} />
      <Sk w={180} h={30} style={{ marginBottom: 14 }} />
      <div className="bar" style={{ marginBottom: 0 }}><Sk w={110} h={40} /><Sk w={150} h={40} /></div>
    </div>
    <Table cols={4} rows={4} />
    <div className="card" style={{ marginTop: 20 }}>
      <Sk w={170} h={18} style={{ marginBottom: 12 }} /><Lines n={4} />
    </div>
  </>,

  profile: () => <><Head /><FormCard fields={5} /><FormCard fields={3} /></>,

  analytics: () => <>
    <Head />
    <div className="bar"><Sk w={220} h={40} /><Sk w={110} h={40} /><Sk w={110} h={40} /></div>
    <Stats n={4} />
    <div className="an-chart" aria-hidden>
      {HEIGHTS.map((h, i) => (
        <div className="an-col" key={i}>
          <div className="an-plot"><Sk w="100%" h={h + '%'} r={6} style={{ maxWidth: 36 }} /></div>
        </div>
      ))}
    </div>
    <Table cols={4} rows={4} />
  </>,
}

export function PageSkeleton({ page = 'dash' }) {
  const Page = PAGES[page] || PAGES.dash
  return <div role="status" aria-label="Loading"><Page /></div>
}
