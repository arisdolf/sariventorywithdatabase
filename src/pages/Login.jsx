import { useEffect, useState } from 'react'
import { api } from '../services/api'
import Terms from '../components/Terms'
import SearchSelect from '../components/SearchSelect'
import Verify from './Verify'
import ForgotPassword from './ForgotPassword'
import { STORE_TYPES, PW_HINT, strongPw } from '../utils/format'
const TODAY = new Date().toISOString().slice(0, 10)

// Defined outside the page so inputs keep focus while typing
function Shell({ title, sub, children, onHome, screen, onSwitch }) {
  return (
    <div className="login-wrap">
      <div className="login">
        {onHome && <button type="button" className="link auth-back" onClick={onHome}>‹ Back to home</button>}
        <div className="logo" style={{ padding: '10px 0 0' }}>Sari<span>ventory</span></div>
        <div className={`auth-tabs${screen === 'signup' ? ' is-signup' : ''}`} role="group" aria-label="Account access">
          <button type="button" className={screen === 'login' ? 'active' : ''} aria-current={screen === 'login' ? 'page' : undefined} onClick={() => onSwitch('login')}>Login</button>
          <button type="button" className={screen === 'signup' ? 'active' : ''} aria-current={screen === 'signup' ? 'page' : undefined} onClick={() => onSwitch('signup')}>Sign up</button>
        </div>
        <div key={screen} className="auth-content">
          <h2 className="auth-title">{title}</h2>
          <p className="sub auth-sub" style={{ marginBottom: 8 }}>{sub}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

const Field = ({ label, id, ...p }) => {
  const fieldId = id || `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return <><label htmlFor={fieldId}>{label}</label><input id={fieldId} {...p} /></>
}

function PasswordField({ label, id, visible, onToggle, ...props }) {
  const fieldId = id || `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <>
      <label htmlFor={fieldId}>{label}</label>
      <span className="auth-password-field">
        <input id={fieldId} type={visible ? 'text' : 'password'} {...props} />
        <button type="button" className="auth-password-toggle" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={onToggle}>{visible ? 'Hide' : 'Show'}</button>
      </span>
    </>
  )
}

export default function Login({ onLogin, start = 'login', onHome, onNavigateAuth }) {
  
  const [showTerms, setShowTerms] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
 const [screen, setScreen] = useState(start) // login | signup
  useEffect(() => setScreen(start), [start])
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

  const go = (s, store = false) => { setScreen(s); setErr(''); setNeedStore(store); onNavigateAuth?.(s) }
  const finish = res => res.needs_verification ? setPending(res.email) : res.pending ? setWaiting(true) : onLogin(res)
  const submit = async e => {
    e.preventDefault()
    setErr('')
    const signup = screen === 'signup'
    if (signup && f.password !== f.confirm) return setErr('Passwords do not match')
      if (signup && !strongPw(f.password)) return setErr(PW_HINT)
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
  <Shell title="Waiting for approval" sub="The store owner needs to confirm you before you can come in." screen={screen} onSwitch={s => { setWaiting(false); go(s) }} onHome={onHome}>
    <p className="auth-note">We told the owner about your request. Log in again after they approve you.</p>
    <button className="btn" style={{ width: '100%', marginTop: 18 }} onClick={() => { setWaiting(false); go('login') }}>Back to log in</button>
  </Shell>
)
  /* ---------- Log in ---------- */
  if (screen === 'login') return (
  <Shell title="Welcome back" sub="Sign up to manage your store." onHome={onHome} screen={screen} onSwitch={go}>
    <form onSubmit={submit}>
      {notice && <p className="auth-note">{notice}</p>}
        
        
        <Field label="Email" type="email" required autoFocus value={f.email} onChange={set('email')} />
        <PasswordField label="Password" autoComplete="current-password" required value={f.password} onChange={set('password')} visible={showPassword} onToggle={() => setShowPassword(value => !value)} />
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
    </Shell>
  )

  /* ---------- Create account ---------- */
  return (
    <Shell title="Create your account" sub="Start your own store, or join one with a code." onHome={onHome} screen={screen} onSwitch={go}>
      <form onSubmit={submit}>
        <div className={`seg auth-kind-toggle${kind === 'join' ? ' is-join' : ''}`} role="group" aria-label="Store setup">
          <button type="button" className={kind === 'create' ? 'on' : ''} onClick={() => setKind('create')}>Start a store</button>
          <button type="button" className={kind === 'join' ? 'on' : ''} onClick={() => setKind('join')}>Join with a code</button>
        </div>

        <div key={kind} className="auth-kind-fields">
                {kind === 'create' ? <>
          <Field label="Store name" required autoFocus value={f.store_name} onChange={set('store_name')} />
          <label>Type of business</label>
          <SearchSelect className="auth-business-select" style={{ width: '100%', minWidth: 0, maxWidth: '100%' }} inputStyle={{ width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }} label="Type of business" value={f.store_type} options={STORE_TYPES}
            onChange={value => setF(prev => ({ ...prev, store_type: value }))} />
        </> : <Field label="Store code" required autoFocus value={f.code} onChange={set('code')} style={{ textTransform: 'uppercase' }} />}

        {kind === 'join' && (
          <p className="auth-note warn">
            Already have an account?{' '}
            <button type="button" className="link" onClick={() => go('login', true)}>Log in and enter the code instead</button>
          </p>
        )}
        </div>

        <div className="auth-grid">
          <div><Field label="First name" required value={f.first_name} onChange={set('first_name')} /></div>
          <div><Field label="Last name" required value={f.last_name} onChange={set('last_name')} /></div>
        </div>
        <Field label="Middle name (optional)" value={f.middle_name} onChange={set('middle_name')} />
      
        <Field label="Email" type="email" required value={f.email} onChange={set('email')} />
        <PasswordField label={`Password (${PW_HINT})`} autoComplete="new-password" required minLength={8} value={f.password} onChange={set('password')} visible={showPassword} onToggle={() => setShowPassword(value => !value)} />
        <PasswordField label="Confirm password" autoComplete="new-password" required value={f.confirm} onChange={set('confirm')} visible={showConfirm} onToggle={() => setShowConfirm(value => !value)} />

                <label className="check">
          <input type="checkbox" checked={f.terms} onChange={e => setF({ ...f, terms: e.target.checked })} />
          <span>I agree to the <button type="button" className="link" onClick={() => setShowTerms(true)}>Terms and Conditions</button></span>
        </label>

        {err && <p className="auth-err">{err}</p>}
        <button className="btn" style={{ width: '100%', marginTop: 18 }} disabled={busy || !f.terms}>
          {busy ? 'Please wait…' : kind === 'create' ? 'Create my store' : 'Join store'}
        </button>
      </form>
              {showTerms && <Terms onClose={() => setShowTerms(false)} />}
    </Shell>
  )
}
