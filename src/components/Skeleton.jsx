export const Sk = ({ w = '100%', h = 14, r = 8, style }) =>
  <span className="sk" style={{ display: 'block', width: w, height: h, borderRadius: r, ...style }} />

export function PageSkeleton({ title = true, stats = true, cards = 4 }) {
  return (
    <div role="status" aria-label="Loading">
      {title && <>
        <Sk w={200} h={26} style={{ marginBottom: 8 }} />
        <Sk w={280} h={14} style={{ marginBottom: 22 }} />
      </>}
      {stats && <div className="stats">
        {[0, 1, 2].map(i => (
          <div className="stat" key={i}>
            <Sk w={90} h={26} style={{ marginBottom: 8 }} /><Sk w={120} h={12} />
          </div>
        ))}
      </div>}
      {Array.from({ length: cards }, (_, i) => (
        <div className="card" key={i} style={{ marginBottom: 10 }}>
          <Sk w="45%" h={16} style={{ marginBottom: 10 }} /><Sk w="75%" h={12} />
        </div>
      ))}
    </div>
  )
}