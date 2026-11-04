import { useState } from 'react'
import { api } from '../services/api'

const TITLES = {
  login: 'Log in to manage your store.',
  create: 'Set up your store. You will be its owner.',
  join: 'Join a store with the code from its owner.',
}

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login') // login | create | join
  const [f, setF] = useState({ first_name: '', middle_name: '', last_name: '', email: '', password: '', confirm: '', store_name: '', code: '', birthdate: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const reg = mode !== 'login'
  const set = k => e => setF({ ...f, [k]: e.target.value })

  const submit = async e => {
    e.preventDefault()
    setErr('')
    if (reg && f.password !== f.confirm) return setErr('Passwords do not match')
    setBusy(true)
    try {
      onLogin(await api(reg ? '/register' : '/login', 'POST',
        reg ? { mode, first_name: f.first_name, middle_name: f.middle_name, last_name: f.last_name, email: f.email, password: f.password, store_name: f.store_name, code: f.code, birthdate: f.birthdate }
          : { email: f.email, password: f.password }))
    } catch (x) { setErr(x.message) }
    setBusy(false)
  }

  const go = m => { setMode(m); setErr('') }

  return (
    <div className="login-wrap">
    <form className="login" onSubmit={submit}>
      <div className="logo" style={{ padding: 0, marginBottom: 4 }}>Sari<span>-Store</span></div>
      <p className="sub" style={{ marginBottom: 8 }}>{TITLES[mode]}</p>

      {mode === 'create' && <>
        <label>Store name</label>
        <input required autoFocus value={f.store_name} onChange={set('store_name')} />
      </>}
      {mode === 'join' && <>
        <label>Store code</label>
        <input required autoFocus value={f.code} onChange={set('code')} style={{ textTransform: 'uppercase' }} />

      </>}
      {reg && <>
        <label>First name</label>
        <input required value={f.first_name} onChange={set('first_name')} />
        <label>Middle name (optional)</label>
        <input value={f.middle_name} onChange={set('middle_name')} />
        <label>Last name</label>
        <input required value={f.last_name} onChange={set('last_name')} />
        <label>Birthdate</label>
        <input type="date" required max={new Date().toISOString().slice(0, 10)} value={f.birthdate} onChange={set('birthdate')} />  
       
      </>}

      <label>Email</label>
      <input type="email" required autoFocus={mode === 'login'} value={f.email} onChange={set('email')} />
      <label>Password{reg && ' (at least 8 characters)'}</label>
      <input type="password" required minLength={reg ? 8 : undefined} value={f.password} onChange={set('password')} />
      {reg && <>
        <label>Confirm password</label>
        <input type="password" required value={f.confirm} onChange={set('confirm')} />
      </>}

      {err && <p style={{ color: 'var(--bad)', margin: '10px 0 0' }}>{err}</p>}
      <button className="btn" style={{ width: '100%', marginTop: 18 }} disabled={busy}>
        {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : mode === 'create' ? 'Create my store' : 'Join store'}
      </button>

      {mode === 'login' ? <>
        <button type="button" className="btn ghost" style={{ width: '100%', marginTop: 10 }} onClick={() => go('create')}>Start a new store</button>
        <button type="button" className="btn ghost" style={{ width: '100%', marginTop: 10 }} onClick={() => go('join')}>Join a store with a code</button>
      </> : (
        <button type="button" className="btn ghost" style={{ width: '100%', marginTop: 10 }} onClick={() => go('login')}>I already have an account</button>
      )}
    </form>
    </div>
  )
}