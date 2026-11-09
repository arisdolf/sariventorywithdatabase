const FEATURES = [
  ['Fast sales', 'Pick items, take cash, GCash or Maya, and the stock updates by itself. Print a receipt in one tap.', 'M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 7H6M9 20h.01M18 20h.01'],
  ['Product tracking', 'Add products with capital and selling price, group them by category, and see your profit per item.', 'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8'],
  ['Low stock alerts', 'Set a warning level for each item and see what needs restocking before you run out.', 'M12 3 2 20h20zM12 10v4M12 17.5v.01'],
  ['Stock movements', 'Every restock, expired, damaged or lost item is logged with who did it and why.', 'M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3'],
  ['Suppliers', 'Keep contact details of the people you buy from in one place.', 'M1 6h13v10H1zM14 9h4l3 3v4h-7'],
  ['Team and roles', 'Share a store code with your staff. Choose what each person can see and do.', 'M2 20c0-3.5 3-6 7-6s7 2.5 7 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.5.6 4 2.6 4 5'],
  ['Sales and analytics', 'See daily, weekly, monthly and yearly sales, with profit, in simple charts.', 'M4 20V10M10 20V4M16 20v-8M22 20H2'],
  ['Activity and notifications', 'Know what your team did, and get notified when something happens in your store.', 'M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0'],
  ['Works on your phone', 'Made for small screens too. Use it at the counter, in the stockroom or on the go.', 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2'],
]

const STEPS = [
  ['Create your store', 'Sign up and name your store. It takes about a minute.'],
  ['Add your products', 'Enter what you sell, what it costs you, and what you sell it for.'],
  ['Start selling', 'Record sales and watch your stock and profit update.'],
]

// NOTE: these are sample reviews. Replace them with real feedback from your users before launch.
const REVIEWS = [
  ['I used to write everything in a notebook. Now I see my sales and what is running low in seconds.', 'Maria S.', 'Sari-sari store owner'],
  ['The receipt and GCash options are perfect for my stall. My staff learned it in one afternoon.', 'Joel R.', 'Food stall owner'],
  ['I can finally see my real profit per item. Sariventory is simple and it just works.', 'Aileen D.', 'Mini grocery owner'],
]

const Ico = ({ d }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)

const Stars = () => <div className="lp-stars" aria-label="5 out of 5 stars">★★★★★</div>

export default function Landing({ onLogin, onSignup }) {
  const to = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-in">
          <div className="logo" style={{ padding: 0 }}>Sari<span>ventory</span></div>
          <nav className="lp-links">
            <button type="button" className="link" onClick={() => to('features')}>Features</button>
            <button type="button" className="link" onClick={() => to('how')}>How it works</button>
            <button type="button" className="link" onClick={() => to('reviews')}>Reviews</button>
          </nav>
          <div className="lp-nav-btns">
            <button type="button" className="btn ghost sm" onClick={onLogin}>Log in</button>
            <button type="button" className="btn sm" onClick={onSignup}>Get started</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-wrap lp-hero-in">
          <div className="lp-copy">
            <span className="pill">Inventory and sales for small stores</span>
            <h1>Run your store without the notebook.</h1>
            <p>Sariventory helps sari-sari stores, stalls and small businesses track products, stock and sales. Know what you sold, what is running low, and how much you earned.</p>
            <div className="lp-cta">
              <button type="button" className="btn" onClick={onSignup}>Create your store</button>
              <button type="button" className="btn ghost" onClick={onLogin}>I have an account</button>
            </div>
            
          </div>

          <div className="lp-mock" aria-hidden>
            <div className="lp-mock-top"><i /><i /><i /></div>
            <div className="lp-mock-stats">
              <div><b>₱2,480.00</b><small>Sales today</small></div>
              <div><b>₱760.00</b><small>Profit today</small></div>
            </div>
            <div className="lp-mock-row"><span>Instant coffee</span><span className="pill">In stock</span></div>
            <div className="lp-mock-row"><span>Canned sardines</span><span className="pill low">Low stock</span></div>
            <div className="lp-mock-row"><span>Soft drink 1L</span><span className="pill">In stock</span></div>
            <div className="lp-mock-bars">
              {[35, 55, 40, 70, 50, 85, 60].map((h, i) => <span key={i} style={{ height: h + '%' }} />)}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="lp-sec">
        <div className="lp-wrap">
          <h2>Everything your store needs</h2>
          <p className="sub lp-sub">Simple tools that cover the daily work, from the counter to the stockroom.</p>
          <div className="lp-grid">
            {FEATURES.map(([t, d, icon]) => (
              <div className="lp-card" key={t}>
                <span className="lp-ic"><Ico d={icon} /></span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="lp-sec lp-alt">
        <div className="lp-wrap">
          <h2>Get started in three steps</h2>
          <p className="sub lp-sub">No setup headaches. No special equipment.</p>
          <div className="lp-steps">
            {STEPS.map(([t, d], i) => (
              <div className="lp-step" key={t}>
                <span className="lp-num">{i + 1}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="lp-sec">
        <div className="lp-wrap">
          <h2>Loved by store owners</h2>
          <p className="sub lp-sub">See what people say about Sariventory.</p>
          <div className="lp-grid lp-rev">
            {REVIEWS.map(([q, name, role]) => (
              <figure className="lp-card" key={name}>
                <Stars />
                <blockquote>“{q}”</blockquote>
                <figcaption>
                  <span className="lp-av">{name[0]}</span>
                  <span><b>{name}</b><br /><small>{role}</small></span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Final call to action */}
      <section className="lp-sec">
        <div className="lp-wrap">
          <div className="lp-final">
            <h2>Ready to manage your store the easy way?</h2>
            <p>Create your store today, or join your team with a store code.</p>
            <div className="lp-cta" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn lp-btn-inv" onClick={onSignup}>Create your store</button>
              <button type="button" className="btn lp-btn-line" onClick={onLogin}>Log in</button>
            </div>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-wrap">© {new Date().getFullYear()} Sariventory. Made for small stores.</div>
      </footer>
    </div>
  )
}