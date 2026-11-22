import Empty from '../components/Empty'
import { peso } from '../utils/format'

function LockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>
}

function LockedTool({ title, description, onUnlock, wide = false }) {
  return (
    <button type="button" className={`dash-locked-tool${wide ? ' wide' : ''}`} onClick={onUnlock}>
      <span className="dash-locked-icon"><LockIcon /></span>
      <span className="dash-locked-copy"><b>{title}</b><small>{description}</small></span>
      <span className="dash-locked-cta">Complete requirements</span>
    </button>
  )
}

export default function Dashboard({ D, user, setView, verificationRequired = false, onOpenRequirements = () => {} }) {
  const low = D.products.filter(p => p.qty <= (p.low_stock ?? 10))
  const t = D.today || { sales: 0, cost: 0, items: 0, orders: 0 }
  const perms = user?.perms || []
  const costs = perms.includes('costs')
  const revenue = perms.includes('revenue')
  const canSup = perms.includes('suppliers')
  const canStock = perms.includes('stock')
  const today = new Date().toDateString()
  const salesToday = D.orders.filter(o => new Date(o.date).toDateString() === today).reduce((a, o) => a + o.total, 0)
  const sales = D.today ? t.sales : salesToday

  return (
    <>
      <header className="dash-head">
        <div>
          <span className="dash-kicker">STORE OVERVIEW</span>
          <h1>{user?.store || 'Your store'}</h1>
          <p className="sub">{verificationRequired
            ? 'Daily sales and inventory are ready. Complete store requirements to unlock the rest.'
            : `Welcome back, ${user?.name?.split(' ')[0] || 'there'}. Here’s how things are looking today.`}</p>
        </div>
        {perms.includes('sell') && <button type="button" className="btn" onClick={() => setView('sale')}>＋ New sale</button>}
      </header>

      {verificationRequired && <button type="button" className="dash-setup-banner" onClick={onOpenRequirements}>
        <span className="dash-setup-mark"><LockIcon /></span>
        <span><b>Finish setting up your store</b><small>Submit your required document photos to unlock monthly reports and store tools.</small></span>
        <span className="dash-setup-action">Complete requirements</span>
      </button>}

      {revenue && <section className="dash-section" aria-label="Sales summary">
        <div className="dash-section-title"><h2>Today</h2><span>Sales and activity</span></div>
        <div className="stats">
          <div className="stat stat-primary"><small>Sales today</small><b>{peso(sales)}</b><span>{t.orders} {t.orders === 1 ? 'order' : 'orders'}</span></div>
          {costs && <>
            <div className="stat"><small>Item costs</small><b>{peso(t.cost)}</b><span>Capital of items sold</span></div>
            <div className="stat"><small>Estimated profit</small><b>{peso(sales - t.cost)}</b><span>Before expenses</span></div>
          </>}
          <div className="stat"><small>Items sold</small><b>{t.items}</b><span>Across today’s orders</span></div>
        </div>
      </section>}

      <section className="dash-section" aria-label="Store inventory summary">
        <div className="dash-section-title"><h2>Inventory</h2><span>Products and restocking</span></div>
        <div className="stats">
          <div className="stat"><small>Active products</small><b>{D.products.length}</b><span>Items in your catalog</span></div>
          {canStock ? <button type="button" className={'stat stat-action' + (low.length ? ' needs-attention' : '')} onClick={() => setView('inv')}>
            <small>Need restocking</small><b>{low.length}</b><span>{low.length ? 'Review low stock →' : 'Everything is well stocked'}</span>
          </button> : <div className="stat"><small>Need restocking</small><b>{low.length}</b><span>{low.length ? 'Ask a manager to review low stock' : 'Everything is well stocked'}</span></div>}
          {!verificationRequired && canSup && <div className="stat"><small>Suppliers</small><b>{D.suppliers.length}</b><span>Saved contacts</span></div>}
        </div>
      </section>

      {!verificationRequired && costs && D.month && <section className="dash-section" aria-label="Monthly performance">
        <div className="dash-section-title"><h2>This month</h2><span>Profit and expenses</span></div>
        <div className="stats">
          <div className="stat"><small>Gross profit</small><b>{peso(D.month.gross)}</b><span>Before expenses</span></div>
          <div className="stat"><small>Expenses</small><b>{peso(D.month.expenses)}</b><span>Recorded this month</span></div>
          <div className="stat"><small>Net profit</small><b className={D.month.net < 0 ? 'negative' : ''}>{peso(D.month.net)}</b><span>After expenses</span></div>
        </div>
      </section>}

      <section className="grid2 dash-lists" aria-label="Recent store activity">
        <div className="card dash-list">
          <div className="dash-list-head"><div><h2>Running low</h2><p>Products at or below their restock level</p></div>{canStock && <button type="button" className="link" onClick={() => setView('inv')}>Inventory →</button>}</div>
          {low.length ? <div className="dash-rows">{low.slice(0, 6).map(p => <div className="dash-row" key={p.id}><span className="dash-item-icon">{p.name?.slice(0, 1)?.toUpperCase()}</span><span className="dash-row-name">{p.name}<small>Restock level: {p.low_stock ?? 10}</small></span><span className="dash-qty">{p.qty} left</span></div>)}</div> : <Empty>Everything is well stocked.</Empty>}
        </div>
        {revenue && <div className="card dash-list">
          <div className="dash-list-head"><div><h2>Recent sales</h2><p>Your latest recorded orders</p></div>{verificationRequired
            ? <button type="button" className="link dash-locked-link" onClick={onOpenRequirements}>Complete requirements</button>
            : <button type="button" className="link" onClick={() => setView('sales')}>Sales history →</button>}</div>
          {D.orders.length ? <div className="dash-rows">{D.orders.slice(0, 5).map(o => <div className="dash-row" key={o.id}><span className="dash-item-icon dash-sale-icon">↗</span><span className="dash-row-name">Order #{o.no ?? o.id}<small>{new Date(o.date).toLocaleDateString()}</small></span><b className="dash-amount">{peso(o.total)}</b></div>)}</div> : <Empty>No sales yet. Record your first one to see it here.</Empty>}
        </div>}
      </section>

      {verificationRequired && <section className="dash-section dash-locked-section" aria-label="Tools available after completing requirements">
        <div className="dash-section-title"><h2>More store tools</h2><span>Available after setup</span></div>
        <div className="dash-locked-grid">
          <LockedTool title="Monthly sales" description="Review monthly revenue, costs, expenses, and profit." onUnlock={onOpenRequirements} />
          <LockedTool title="Sales history" description="Browse and manage all completed sales." onUnlock={onOpenRequirements} />
          <LockedTool title="Stock movements" description="Review every stock addition, sale, and adjustment." onUnlock={onOpenRequirements} />
          <LockedTool title="Suppliers" description="Save supplier contacts and purchase details." onUnlock={onOpenRequirements} />
          <LockedTool title="Expenses" description="Record store costs and view their effect on profit." onUnlock={onOpenRequirements} />
          <LockedTool title="Team" description="Invite staff and manage store access." onUnlock={onOpenRequirements} />
          <LockedTool title="Analytics" description="Compare sales and performance over time." onUnlock={onOpenRequirements} />
          <LockedTool title="Activity center" description="See changes made by you and your team." onUnlock={onOpenRequirements} />
        </div>
      </section>}
    </>
  )
}
