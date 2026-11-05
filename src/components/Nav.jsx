import { useState } from 'react'

const ICONS = {
  dash: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  prod: <><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5M12 13v8" /></>,
  sale: <><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 7H6" /></>,
  sales: <><path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
  stock: <><path d="M7 4v16M7 20l-3-3M7 20l3-3" /><path d="M17 20V4M17 4l-3 3M17 4l3 3" /></>,
  sup: <><path d="M1 6h13v10H1zM14 9h4l3 3v4h-7" /><circle cx="6" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>,
  team: <><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.5.6 4 2.6 4 5" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" /></>,
  more: <><circle cx="5" cy="12" r="1.7" fill="currentColor" /><circle cx="12" cy="12" r="1.7" fill="currentColor" /><circle cx="19" cy="12" r="1.7" fill="currentColor" /></>,
  out: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>,
}

const Icon = ({ n }) => <span className="ic"><svg viewBox="0 0 24 24">{ICONS[n]}</svg></span>

// key, long label, short label, permission needed
const TABS = [
  ['dash', 'Dashboard', 'Home', null],
  ['prod', 'Products', 'Items', 'products'],
  ['sale', 'New sale', 'Sell', 'sell'],
  ['sales', 'Sales history', 'Sales', 'history'],
  ['stock', 'Stock movements', 'Stock', 'stock'],
  ['sup', 'Suppliers', 'Suppliers', 'suppliers'],
  ['team', 'Team', 'Team', 'team'],
  ['profile', 'Profile', 'Me', null],
]

export default function Nav({ view, setView, perms = [], store, onLogout }) {
  const [more, setMore] = useState(false)
  const tabs = TABS.filter(t => !t[3] || perms.includes(t[3]))
  const main = tabs.slice(0, 4)
  const rest = tabs.slice(4)
  const go = k => { setView(k); setMore(false); window.scrollTo(0, 0) }

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="side">
        <div className="logo">Sari<span>ventory</span></div>
        {tabs.map(([k, long]) => (
          <button key={k} className={view === k ? 'on' : ''} onClick={() => go(k)}>
            <Icon n={k} /><span>{long}</span>
          </button>
        ))}
        <button className="out" onClick={onLogout}><Icon n="out" /><span>Log out</span></button>
      </nav>

    

      {/* Mobile floating tab bar */}
      <div className="tabbar">
        {main.map(([k, , short]) => (
          <button key={k} className={view === k ? 'on' : ''} onClick={() => go(k)}>
            <Icon n={k} /><span>{short}</span>
          </button>
        ))}
        <button className={rest.some(t => t[0] === view) || more ? 'on' : ''} onClick={() => setMore(true)}>
          <Icon n="more" /><span>More</span>
        </button>
      </div>

      {/* Mobile "More" sheet */}
      {more && <>
        <div className="scrim" onClick={() => setMore(false)} />
        <div className="sheet">
          <div className="grab" />
          <div className="tiles">
            {rest.map(([k, long]) => (
              <button key={k} className={'tile' + (view === k ? ' on' : '')} onClick={() => go(k)}>
                <Icon n={k} /><span>{long}</span>
              </button>
            ))}
            <button className="tile danger" onClick={() => { setMore(false); onLogout() }}>
              <Icon n="out" /><span>Log out</span>
            </button>
          </div>
        </div>
      </>}
    </>
  )
}