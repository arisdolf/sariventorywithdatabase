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
import Expenses from './pages/Expenses'
import StoreVerification, { StoreAccessNotice } from './pages/StoreVerification'
const EMPTY = { products: [], suppliers: [], orders: [], moves: [] }

const home = u => {
  const p = u?.perms || []
  return p.includes('revenue') ? 'dash' : p.includes('sell') ? 'sale' : p.includes('products') ? 'prod' : 'dash'
}

export default function App() {
  const readAuth = () => {
    const value = new URLSearchParams(window.location.search).get('auth')
    return value === 'login' || value === 'signup' ? value : null
  }
  const [auth, setAuth] = useState(readAuth)
  const [loading, setLoading] = useState(true)
  const [D, setD] = useState(EMPTY)
   const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [view, setView] = useState(() => home(user))
  const [cart, setCart] = useState([])
  const [modal, setModal] = useState(null)
  const [msg, setMsg] = useState('')

  const navigateAuth = next => {
    if (readAuth() === next) return
    const url = new URL(window.location.href)
    if (next) url.searchParams.set('auth', next)
    else url.searchParams.delete('auth')
    window.history.pushState({}, '', url)
    setAuth(next)
  }

  useEffect(() => {
    const syncAuth = () => setAuth(readAuth())
    window.addEventListener('popstate', syncAuth)
    return () => window.removeEventListener('popstate', syncAuth)
  }, [])

  const toastTimer = useRef(null)
  const toast = useCallback(m => {
    setMsg(m)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setMsg(''), 2500)
  }, [])
  const refresh = () => api('/data').then(data => {
    setD(data)
    if (data.me && data.me.storeVerified !== user?.storeVerified) {
      localStorage.setItem('user', JSON.stringify(data.me))
      setUser(data.me)
    }
  }).catch(e => toast(e.message || 'Cannot reach the server. Is php artisan serve running?')).finally(() => setLoading(false))

  useEffect(() => { if (user) refresh() }, [user])
  useEffect(() => {
  const h = () => { setUser(null); setD(EMPTY); navigateAuth('login') }
  window.addEventListener('logout', h)
  return () => window.removeEventListener('logout', h)
}, [])

  // Checks for new activity every 30 seconds when notifications are on
  const lastSeen = useRef(null)
  const notifyOn = !!D.me?.notify?.on && D.me?.storeVerified !== false
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
  setUser(null); setD(EMPTY); setView('dash'); setCart([]); setModal(null); navigateAuth('login')
}

  // Runs an API call, reloads data, closes the form and shows a message
  const run = async (fn, m) => {
    try { await fn(); await refresh(); setModal(null); toast(m); return true }
    catch (e) { toast(e.message); return false }
  }

 if (!user) return auth
  ? <Login onLogin={login} start={auth} onNavigateAuth={navigateAuth} onHome={() => navigateAuth(null)} />
  : <Landing onLogin={() => navigateAuth('login')} onSignup={() => navigateAuth('signup')} />

  const me = D.me || user
  const perms = me.perms || []
  const allowed = {
    exp: perms.includes('costs'),
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
  const verificationRequired = me.storeVerified === false
  const lockedSections = {
    stock: 'Stock movements', sup: 'Suppliers', exp: 'Expenses', team: 'Team',
    sales: 'Sales history', analytics: 'Analytics', activity: 'Activity center',
  }
  const openRequirements = () => {
    setView('dash')
    window.setTimeout(() => document.getElementById('store-requirements')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

    const shared = { D, run, toast, setModal, user: me, onLogout: logout, setView }
  const busy = !verificationRequired && loading && ['dash', 'prod', 'inv', 'sale', 'stock', 'sup'].includes(page)
  return (

    <>
            <Nav view={['analytics', 'activity'].includes(page) ? 'settings' : page} setView={setView} perms={perms} store={me.store} onLogout={logout} />
      <main>
        <div key={page} className="page">
          {verificationRequired && page === 'dash' && <Dashboard {...shared} verificationRequired onOpenRequirements={openRequirements} />}
          {verificationRequired && lockedSections[page] && <StoreAccessNotice section={lockedSections[page]} onOpenRequirements={openRequirements} />}
          {!verificationRequired && page === 'exp' && <Expenses {...shared} />}
          {!verificationRequired && page === 'analytics' && <Analytics {...shared} />}
          {busy && <PageSkeleton page={page} />}
          {!busy && page === 'inv' && <Inventory {...shared} />}
          {page === 'profile' && <Profile {...shared} />}
          {!verificationRequired && page === 'sales' && <Sales {...shared} />}
          {!verificationRequired && page === 'team' && <Team {...shared} />}
          {!verificationRequired && !busy && page === 'dash' && <Dashboard {...shared} />}
          {verificationRequired && page === 'dash' && <StoreVerification user={me} onVerified={() => { toast('Required photos received. Store access unlocked.'); refresh() }} />}
          {!busy && page === 'prod' && <Products {...shared} />}
          {!busy && page === 'sale' && <NewSale {...shared} cart={cart} setCart={setCart} />}
          {!busy && !verificationRequired && page === 'stock' && <StockMovements {...shared} />}
          {!busy && !verificationRequired && page === 'sup' && <Suppliers {...shared} />}
          {!verificationRequired && page === 'activity' && <Activity {...shared} />}
          {page === 'settings' && <Settings {...shared} verificationRequired={verificationRequired} onOpenRequirements={openRequirements} />}
        </div>
      </main>
      {modal && <Modal {...modal} onSave={modal.save} onClose={() => setModal(null)} />}
      <Toast msg={msg} />
    </>
  )
}
