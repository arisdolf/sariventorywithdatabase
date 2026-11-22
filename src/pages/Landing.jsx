const FEATURES = [
  ['Sales at the counter', 'Build a sale in a few taps, choose a payment method, and keep a clear record of every order.', 'M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 7H6M9 20h.01M18 20h.01'],
  ['Products and pricing', 'Keep products, categories, costs and selling prices together, including items you make or repack.', 'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8'],
  ['Stock and restocking', 'Set low stock levels and record restocks, expiry, damage and other adjustments with a reason.', 'M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3'],
  ['Suppliers and team', 'Keep supplier contacts close and invite staff with access that fits their role.', 'M2 20c0-3.5 3-6 7-6s7 2.5 7 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.5.6 4 2.6 4 5'],
  ['Sales and profit reports', 'Review sales over time and understand costs, expenses and profit in one view.', 'M4 20V10M10 20V4M16 20v-8M22 20H2'],
  ['Activity you can follow', 'See changes made by your team and get notifications about what is happening in your store.', 'M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0'],
  ['Ready for the shop floor', 'Use Sariventory on your phone at the counter, in the stockroom or while you are on the go.', 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2'],
]

const STEPS = [
  ['Set up your store', 'Create an account, name your store, and invite your team when you are ready.'],
  ['Add what you sell', 'Enter products, prices and starting stock so your records match your shelves.'],
  ['Keep the day moving', 'Record sales and stock changes as they happen. Check your numbers whenever you need.'],
]

const Ico = ({ d }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)

export default function Landing({ onLogin, onSignup }) {
  const to = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="lp">
      <a className="lp-skip" href="#main-content">Skip to content</a>
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-in">
          <a className="lp-brand" href="#top" aria-label="Sariventory home">Sari<span>ventory</span></a>
          <nav className="lp-links" aria-label="Main navigation">
            <button type="button" className="link" onClick={() => to('features')}>Features</button>
            <button type="button" className="link" onClick={() => to('how')}>How it works</button>
            <button type="button" className="link" onClick={() => to('for-your-store')}>For your store</button>
          </nav>
          <div className="lp-nav-btns">
            <button type="button" className="btn ghost sm" onClick={onLogin}>Login</button>
            <button type="button" className="btn sm" onClick={onSignup}>Sign in</button>
          </div>
        </div>
      </header>

      <main id="main-content" className="lp-main">
        <section id="top" className="lp-hero">
          <div className="lp-wrap lp-hero-in">
            <div className="lp-copy">
              <span className="lp-eyebrow"><span className="lp-dot" /> Inventory and sales for small stores</span>
              <h1>Spend less time counting. More time running your store.</h1>
              <p>Keep products, stock and sales together in one simple place. Sariventory is made for sari-sari stores, market stalls and small businesses.</p>
              <div className="lp-cta">
                <button type="button" className="btn" onClick={onSignup}>Sign in <span aria-hidden="true">→</span></button>
                <button type="button" className="btn ghost" onClick={onLogin}>I already have an account · Login</button>
              </div>
              <p className="lp-reassure"><span aria-hidden="true">✓</span> Set up at your own pace <span className="lp-reassure-sep">·</span> Invite your team when you’re ready</p>
            </div>

            <div className="lp-preview-wrap" aria-label="Example of the Sariventory store dashboard">
              <div className="lp-preview-note"><span className="lp-preview-live" /> A clearer view of your store</div>
              <div className="lp-mock">
                <div className="lp-mock-head">
                  <div><small>YOUR STORE</small><strong>Today at a glance</strong></div>
                  <span className="lp-mock-date">Sample view</span>
                </div>
                <div className="lp-mock-stats">
                  <div><small>Sales today</small><b>₱2,480</b><span>Across 18 orders</span></div>
                  <div><small>Estimated profit</small><b>₱760</b><span>After item costs</span></div>
                </div>
                <div className="lp-mock-section"><span>Stock to check</span><span>View inventory <b aria-hidden="true">→</b></span></div>
                <div className="lp-mock-row"><span className="lp-product-mark">IC</span><span className="lp-product-name">Instant coffee<small>Pantry</small></span><span className="lp-stock good">In stock</span></div>
                <div className="lp-mock-row"><span className="lp-product-mark warm">CS</span><span className="lp-product-name">Canned sardines<small>Canned goods</small></span><span className="lp-stock low">Restock soon</span></div>
                <div className="lp-mock-row"><span className="lp-product-mark blue">SD</span><span className="lp-product-name">Soft drink, 1 L<small>Drinks</small></span><span className="lp-stock good">In stock</span></div>
                <div className="lp-mock-chart-head"><span>Sales this week</span><span>₱8,420</span></div>
                <div className="lp-mock-chart" aria-hidden="true">{[36, 58, 43, 74, 52, 88, 66].map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}</div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="lp-sec">
          <div className="lp-wrap">
            <div className="lp-section-heading">
              <span className="lp-kicker">THE DAILY WORK, IN ONE PLACE</span>
              <h2>Everything your store needs to stay on track</h2>
              <p>Useful tools for the counter, the stockroom and the decisions in between.</p>
            </div>
            <div className="lp-grid">
              {FEATURES.map(([title, description, icon]) => (
                <article className="lp-card" key={title}>
                  <span className="lp-ic"><Ico d={icon} /></span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="lp-sec lp-alt">
          <div className="lp-wrap">
            <div className="lp-section-heading">
              <span className="lp-kicker">A SIMPLE PLACE TO START</span>
              <h2>From first product to your next sale</h2>
              <p>Start with the basics, then add more as your store grows.</p>
            </div>
            <div className="lp-steps">
              {STEPS.map(([title, description], i) => (
                <article className="lp-step" key={title}>
                  <span className="lp-num">0{i + 1}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="for-your-store" className="lp-sec lp-fit">
          <div className="lp-wrap lp-fit-in">
            <div className="lp-fit-copy">
              <span className="lp-kicker">BUILT AROUND YOUR ROUTINE</span>
              <h2>Small store, clearer records.</h2>
              <p>Whether you are behind the counter or checking stock after closing, keep the details you need close at hand.</p>
            </div>
            <div className="lp-fit-list">
              <div><span>01</span><p><b>Know what is selling</b><small>See orders, products and daily totals without searching through notebooks.</small></p></div>
              <div><span>02</span><p><b>Catch stock gaps early</b><small>Set low stock levels and keep a record of every adjustment.</small></p></div>
              <div><span>03</span><p><b>Bring your team along</b><small>Share access by role so staff can handle their part of the work.</small></p></div>
            </div>
          </div>
        </section>

        <section className="lp-final-sec">
          <div className="lp-wrap">
            <div className="lp-final">
              <span className="lp-kicker">YOUR STORE, A LITTLE MORE ORGANIZED</span>
              <h2>Ready to get your store in view?</h2>
              <p>Sign in to start a store, or log in to join your team with a store code.</p>
              <div className="lp-cta lp-cta-center">
                <button type="button" className="btn lp-btn-inv" onClick={onSignup}>Sign in <span aria-hidden="true">→</span></button>
                <button type="button" className="btn lp-btn-line" onClick={onLogin}>Login</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <div className="lp-wrap lp-foot-in"><a className="lp-brand" href="#top">Sari<span>ventory</span></a><span>© {new Date().getFullYear()} Sariventory</span><button className="link" type="button" onClick={onLogin}>Login to your store <span aria-hidden="true">→</span></button></div>
      </footer>
    </div>
  )
}
