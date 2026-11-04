export default function StatusPill({ p }) {
  if (p.qty <= 0) return <span className="pill low out">Out of stock</span>
  if (p.qty <= 10) return <span className="pill low">Low stock</span>
  return <span className="pill">In stock</span>
}
