export default function StatusPill({ p }) {
  const low = p.low_stock ?? 10
  if (p.qty <= 0) return <span className="pill low out">Out of stock</span>
  if (p.qty <= low) return <span className="pill low">Low stock</span>
  return <span className="pill">In stock</span>
}