import { useState } from 'react'
import { api } from '../services/api'
import Terms from '../components/Terms'
import { STORE_TYPES } from '../utils/format'
import Verify from './Verify'
import ForgotPassword from './ForgotPassword'
const TODAY = new Date().toISOString().slice(0, 10)

// Defined outside the page so inputs keep focus while typing
function Shell({ title, sub, children, onHome }) {
  return (
    <div className="login-wrap">
      <div className="login">
        {onHome && <button type="button" className="link" onClick={onHome}>‹ Back to home</button>}
        <div className="logo" style={{ padding: '10px 0 0' }}>Sari<span>ventory</span></div>
        <h2 className="auth-title">{title}</h2>
        <p className="sub" style={{ marginBottom: 8 }}>{sub}</p>
        {children}
      </div>
    </div>
  )
}

const Field = ({ label, ...p }) => <><label>{label}</label><input {...p} /></>

export default function Login({ onLogin, start = 'login', onHome }) {
  
  const [showTerms, setShowTerms] = useState(false)
  const [waiting, setWaiting] = useState(false)
  
 const [screen, setScreen] = useState(start) // login | signup
  const [kind, setKind] = useState('create')     // create | join (signup only)
  const [needStore, setNeedStore] = useState(false) // shown only when login says "no store"
  const [f, setF] = useState({
    first_name: '', middle_name: '', last_name: '',
    email: '', password: '', confirm: '', store_name: '', code: '' ,store_type: 'sari_sari', terms: false,
  })
    const [forgot, setForgot] = useState(false)
  const [notice, setNotice] = useState('')
    const [pending, setPending] = useState(null) // email waiting for a code
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = k => e => { const val = e.target.value; setF(prev => ({ ...prev, [k]: val })) }

  const go = (s, store = false) => { setScreen(s); setErr(''); setNeedStore(store) }
  const finish = res => res.needs_verification ? setPending(res.email) : res.pending ? setWaiting(true) : onLogin(res)
  const submit = async e => {
    e.preventDefault()
    setErr('')
    const signup = screen === 'signup'
    if (signup && f.password !== f.confirm) return setErr('Passwords do not match')
    if (signup && !f.terms) return setErr('Please agree to the Terms and Conditions')
    setBusy(true)
        try {
      if (!signup) {
        finish(await api(needStore ? '/rejoin' : '/login', 'POST',
          { email: f.email, password: f.password, ...(needStore && { code: f.code }) }))
      } else {
        finish(await api('/register', 'POST', {
          mode: kind, first_name: f.first_name, middle_name: f.middle_name, last_name: f.last_name,
          email: f.email, password: f.password,
          store_name: f.store_name, code: f.code,
          store_type: f.store_type, accept_terms: f.terms,
        }))
      }
    } catch (x) {
      if (x.data?.needs_verification) setPending(x.data.email)
      else if (x.data?.needs_store) setNeedStore(true)
      else setErr(x.message)
    }
    setBusy(false)
  }

      if (forgot) return (
    <ForgotPassword
      initialEmail={f.email}
      onBack={() => setForgot(false)}
      onDone={() => { setForgot(false); setF({ ...f, password: '' }); setNotice('Password changed. Log in with your new password.') }}
    />
  )
   if (pending) return <Verify email={pending} onLogin={onLogin} onPending={() => { setPending(null); setWaiting(true) }} onBack={() => { setPending(null); go('login') }} />
if (waiting) return (
  <Shell title="Waiting for approval" sub="The store owner needs to confirm you before you can come in.">
    <p className="auth-note">We told the owner about your request. Log in again after they approve you.</p>
    <button className="btn" style={{ width: '100%', marginTop: 18 }} onClick={() => { setWaiting(false); go('login') }}>Back to log in</button>
  </Shell>
)
  /* ---------- Log in ---------- */
  if (screen === 'login') return (
  <Shell title="Welcome back" sub="Log in to manage your store." onHome={onHome}>
    <form onSubmit={submit}>
      {notice && <p className="auth-note">{notice}</p>}
        
        
        <Field label="Email" type="email" required autoFocus value={f.email} onChange={set('email')} />
        <Field label="Password" type="password" required value={f.password} onChange={set('password')} />
        <p style={{ margin: '8px 0 0', textAlign: 'right' }}>
          <button type="button" className="link" onClick={() => { setNotice(''); setForgot(true) }}>Forgot password?</button>
        </p>

        {needStore && <>
          <p className="auth-note">Enter a store code to join a store with this account.</p>
          <Field label="Store code" required autoFocus value={f.code} onChange={set('code')} style={{ textTransform: 'uppercase' }} />
        </>}

        {err && <p className="auth-err">{err}</p>}
        <button className="btn" style={{ width: '100%', marginTop: 18 }} disabled={busy}>
          {busy ? 'Please wait…' : needStore ? 'Join store' : 'Log in'}
        </button>
        {needStore && <p className="auth-switch" style={{ marginTop: 10 }}>
          <button type="button" className="link" onClick={() => setNeedStore(false)}>Cancel</button>
        </p>}
      </form>
      <p className="auth-switch">New here? <button type="button" className="link" onClick={() => go('signup')}>Create an account</button></p>
    </Shell>
  )

  /* ---------- Create account ---------- */
  return (
    <Shell title="Create your account" sub="Start your own store, or join one with a code." onHome={onHome}>
      <form onSubmit={submit}>
        <div className="seg">
          <button type="button" className={kind === 'create' ? 'on' : ''} onClick={() => setKind('create')}>Start a store</button>
          <button type="button" className={kind === 'join' ? 'on' : ''} onClick={() => setKind('join')}>Join with a code</button>
        </div>

                {kind === 'create' ? <>
          <Field label="Store name" required autoFocus value={f.store_name} onChange={set('store_name')} />
          <label>Type of business</label>
          <select value={f.store_type} onChange={set('store_type')}>
            {STORE_TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </> : <Field label="Store code" required autoFocus value={f.code} onChange={set('code')} style={{ textTransform: 'uppercase' }} />}

        {kind === 'join' && (
          <p className="auth-note warn">
            Already have an account?{' '}
            <button type="button" className="link" onClick={() => go('login', true)}>Log in and enter the code instead</button>
          </p>
        )}

        <div className="auth-grid">
          <div><Field label="First name" required value={f.first_name} onChange={set('first_name')} /></div>
          <div><Field label="Last name" required value={f.last_name} onChange={set('last_name')} /></div>
        </div>
        <Field label="Middle name (optional)" value={f.middle_name} onChange={set('middle_name')} />
      
        <Field label="Email" type="email" required value={f.email} onChange={set('email')} />
        <Field label="Password (at least 8 characters)" type="password" required minLength={8} value={f.password} onChange={set('password')} />
        <Field label="Confirm password" type="password" required value={f.confirm} onChange={set('confirm')} />

                <label className="check">
          <input type="checkbox" checked={f.terms} onChange={e => setF({ ...f, terms: e.target.checked })} />
          <span>I agree to the <button type="button" className="link" onClick={() => setShowTerms(true)}>Terms and Conditions</button></span>
        </label>

        {err && <p className="auth-err">{err}</p>}
        <button className="btn" style={{ width: '100%', marginTop: 18 }} disabled={busy || !f.terms}>
          {busy ? 'Please wait…' : kind === 'create' ? 'Create my store' : 'Join store'}
        </button>
      </form>
      <p className="auth-switch">Already have an account? <button type="button" className="link" onClick={() => go('login')}>Log in</button></p>
              {showTerms && <Terms onClose={() => setShowTerms(false)} />}
    </Shell>
  )
}