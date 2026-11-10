import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from './services/api'
import Nav from './components/Nav'
import Modal from './components/Modal'
import Toast from './components/Toast'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import NewSale from './pages/NewSale'
import StockMovements from './pages/StockMovements'
import Suppliers from './pages/Suppliers'
import Team from './pages/Team'
import Sales from './pages/Sales'
import Profile from './pages/Profile'
import { PageSkeleton } from './components/Skeleton'
import Analytics from './pages/Analytics'
import Login from './pages/Login'
import Settings from './pages/Settings'
import Activity from './pages/Activity'
import { show } from './utils/notify'
import Landing from './pages/Landing'
import Inventory from './pages/Inventory'
const EMPTY = { products: [], suppliers: [], orders: [], moves: [] }

const home = u => {
  const p = u?.perms || []
  return p.includes('revenue') ? 'dash' : p.includes('sell') ? 'sale' : p.includes('products') ? 'prod' : 'dash'
}

export default function App() {
  const [auth, setAuth] = useState(null) // null = landing page, 'login' or 'signup'
  const [loading, setLoading] = useState(true)
  const [D, setD] = useState(EMPTY)
   const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [view, setView] = useState(() => home(user))
  const [cart, setCart] = useState([])
  const [modal, setModal] = useState(null)
  const [msg, setMsg] = useState('')

  const toastTimer = useRef(null)
  const toast = useCallback(m => {
    setMsg(m)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setMsg(''), 2500)
  }, [])
  const refresh = () => api('/data').then(setD).catch(e => toast(e.message || 'Cannot reach the server. Is php artisan serve running?')).finally(() => setLoading(false))

  useEffect(() => { if (user) refresh() }, [user])
  useEffect(() => {
  const h = () => { setUser(null); setD(EMPTY); setAuth(null) }
  window.addEventListener('logout', h)
  return () => window.removeEventListener('logout', h)
}, [])

  // Checks for new activity every 30 seconds when notifications are on
  const lastSeen = useRef(null)
  const notifyOn = !!D.me?.notify?.on
  useEffect(() => {
    if (!user || !notifyOn) return
    lastSeen.current = null
    const tick = async () => {
      try {
        const r = await api('/notifications' + (lastSeen.current == null ? '' : '?after=' + lastSeen.current))
        lastSeen.current = r.last
        for (const it of r.items) {
          if (document.hidden) show('Sariventory', it.summary)
          else toast(it.summary)
        }
      } catch { }
    }
    tick()
    const t = setInterval(tick, 30000)
    return () => clearInterval(t)
  }, [user, notifyOn])

  const login = ({ token, user }) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setD(EMPTY); setView(home(user)); setLoading(true)
    setUser(user)
  }
  const logout = async () => {
  try { await api('/logout', 'POST') } catch { }
  localStorage.removeItem('token'); localStorage.removeItem('user')
  setUser(null); setD(EMPTY); setView('dash'); setCart([]); setModal(null); setAuth(null)
}

  // Runs an API call, reloads data, closes the form and shows a message
  const run = async (fn, m) => {
    try { await fn(); await refresh(); setModal(null); toast(m); return true }
    catch (e) { toast(e.message); return false }
  }

 if (!user) return auth
  ? <Login onLogin={login} start={auth} onHome={() => setAuth(null)} />
  : <Landing onLogin={() => setAuth('login')} onSignup={() => setAuth('signup')} />

  const me = D.me || user
  const perms = me.perms || []
  const allowed = {
    inv: perms.includes('stock'),
    analytics: perms.includes('analytics'),
    profile: true,
    sales: perms.includes('history'),
    dash: true,
    prod: perms.includes('products'),
    sale: perms.includes('sell'),
    stock: perms.includes('stock'),
    sup: perms.includes('suppliers'),
    team: perms.includes('team'),
    activity: perms.includes('activity'),
    settings: true,
  }
  const page = allowed[view] ? view : 'dash'

    const shared = { D, run, toast, setModal, user: me, onLogout: logout, setView }
  const busy = loading && ['dash', 'prod', 'inv', 'sale', 'stock', 'sup'].includes(page)
  return (

    <>
            <Nav view={['analytics', 'activity'].includes(page) ? 'settings' : page} setView={setView} perms={perms} store={me.store} onLogout={logout} />
      <main>
        <div key={page} className="page">
          {page === 'analytics' && <Analytics {...shared} />}
          {busy && <PageSkeleton page={page} />}
          {!busy && page === 'inv' && <Inventory {...shared} />}
          {page === 'profile' && <Profile {...shared} />}
          {page === 'sales' && <Sales {...shared} />}
          {page === 'team' && <Team {...shared} />}
          {!busy && page === 'dash' && <Dashboard {...shared} />}
          {!busy && page === 'prod' && <Products {...shared} />}
          {!busy && page === 'sale' && <NewSale {...shared} cart={cart} setCart={setCart} />}
          {!busy && page === 'stock' && <StockMovements {...shared} />}
          {!busy && page === 'sup' && <Suppliers {...shared} />}
          {page === 'activity' && <Activity {...shared} />}
          {page === 'settings' && <Settings {...shared} />}
        </div>
      </main>
      {modal && <Modal {...modal} onSave={modal.save} onClose={() => setModal(null)} />}
      <Toast msg={msg} />
    </>
  )
}