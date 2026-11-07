import Empty from '../components/Empty'
import { peso } from '../utils/format'

const row = { display: 'flex', justifyContent: 'space-between', padding: '6px 0' }

export default function Dashboard({ D, user, onLogout }) {
  const low = D.products.filter(p => p.qty <= (p.low_stock ?? 10))
  const t = D.today || { sales: 0, cost: 0, items: 0, orders: 0 }
  const costs = user?.perms?.includes('costs')
  const today = new Date().toDateString()
  const salesToday = D.orders.filter(o => new Date(o.date).toDateString() === today).reduce((a, o) => a + o.total, 0)
  const sales = D.today ? t.sales : salesToday

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1>{user?.store} Dashboard</h1>
          <p className="sub">Welcome, {user?.name}. Here's your store at a glance.</p>
        </div>

      </div>
      <div className="stats">
        <div className="stat"><b>{D.products.length}</b><small>Products</small></div>
        <div className="stat"><b>{low.length}</b><small>Need restocking</small></div>
        <div className="stat"><b>{D.suppliers.length}</b><small>Suppliers</small></div>
      </div>
      <div className="stats">
        <div className="stat"><b>{peso(sales)}</b><small>Sales today</small></div>
        {costs && <>
          <div className="stat"><b>{peso(t.cost)}</b><small>Capital of items sold</small></div>
          <div className="stat"><b>{peso(sales - t.cost)}</b><small>Profit today</small></div>
        </>}
        <div className="stat"><b>{t.items}</b><small>Items sold</small></div>
      </div>
      <div className="grid2">
        <div className="card"><h3>Running low</h3>
          {low.length ? low.map(p => <div key={p.id} style={row}><span>{p.name}</span><span>{p.qty} left</span></div>) : <Empty>Everything is well stocked.</Empty>}
        </div>
        <div className="card"><h3>Recent sales</h3>
          {D.orders.length ? D.orders.slice(0, 5).map(o => <div key={o.id} style={row}><span>Order #{o.no ?? o.id}</span><span>{peso(o.total)}</span></div>) : <Empty>No sales yet. Record one under New sale.</Empty>}
        </div>
      </div>
    </>
  )
}