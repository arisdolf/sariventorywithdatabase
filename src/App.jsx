import { useState, useEffect } from 'react'
import { api } from './services/api'
import Nav from './components/Nav'
import Modal from './components/Modal'
import Toast from './components/Toast'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import NewSale from './pages/NewSale'
import StockMovements from './pages/StockMovements'
import Suppliers from './pages/Suppliers'
import Team from './pages/Team'
import Sales from './pages/Sales'
import Profile from './pages/Profile'
const EMPTY = { products: [], suppliers: [], orders: [], moves: [] }

export default function App() {
  const [D, setD] = useState(EMPTY)
  const [view, setView] = useState('dash')
  const [cart, setCart] = useState([])
  const [modal, setModal] = useState(null)
  const [msg, setMsg] = useState('')
  const [user, setUser] = useState(() => {
    try { return localStorage.getItem('token') ? JSON.parse(localStorage.getItem('user')) : null }
    catch { return null }
  })

  const toast = m => { setMsg(m); setTimeout(() => setMsg(''), 2500) }
  const refresh = () => api('/data').then(setD).catch(e => toast(e.message || 'Cannot reach the server. Is php artisan serve running?'))

  useEffect(() => { if (user) refresh() }, [user])
  useEffect(() => {
    const h = () => { setUser(null); setD(EMPTY) }
    window.addEventListener('logout', h)
    return () => window.removeEventListener('logout', h)
  }, [])

  const login = ({ token, user }) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setD(EMPTY); setView('dash')
    setUser(user)
  }
  const logout = async () => {
    try { await api('/logout', 'POST') } catch {}
    localStorage.removeItem('token'); localStorage.removeItem('user')
    setUser(null); setD(EMPTY); setView('dash'); setCart([]); setModal(null)
  }

  // Runs an API call, reloads data, closes the form and shows a message
  const run = async (fn, m) => {
    try { await fn(); await refresh(); setModal(null); toast(m); return true }
    catch (e) { toast(e.message); return false }
  }

  if (!user) return <Login onLogin={login} />

  const me = D.me || user
  const perms = me.perms || []
  const allowed = {
        profile: true,
    sales: perms.includes('history'),
    dash: true,
    prod: perms.includes('products'),
    sale: perms.includes('sell'),
    stock: perms.includes('stock'),
    sup: perms.includes('suppliers'),
    team: perms.includes('team'),
  }
  const page = allowed[view] ? view : 'dash'

  const shared = { D, run, toast, setModal, user: me, onLogout: logout }
  return (
    <>
      <Nav view={page} setView={setView} perms={perms} store={me.store} onLogout={logout} />
      <main>
        {page === 'profile' && <Profile {...shared} />}
        {page === 'dash' && <Dashboard {...shared} />}
        {page === 'prod' && <Products {...shared} />}
        {page === 'sale' && <NewSale {...shared} cart={cart} setCart={setCart} />}
        {page === 'sales' && <Sales {...shared} />}
        {page === 'stock' && <StockMovements {...shared} />}
        {page === 'sup' && <Suppliers {...shared} />}
        {page === 'team' && <Team {...shared} />}
      </main>
      {modal && <Modal {...modal} onSave={modal.save} onClose={() => setModal(null)} />}
      <Toast msg={msg} />
    </>
  )
}