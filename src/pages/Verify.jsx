import { useState, useEffect } from 'react'
import { api } from '../services/api'

export default function Verify({ email, onLogin, onBack }) {
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(60)

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait(w => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  const submit = async e => {
    e.preventDefault()
    setBusy(true); setErr(''); setInfo('')
    try { onLogin(await api('/verify-email', 'POST', { email, code })) }
    catch (x) { setErr(x.message) }
    setBusy(false)
  }
  const resend = async () => {
    setErr(''); setInfo('')
    try { await api('/resend-code', 'POST', { email }); setInfo('A new code was sent.'); setWait(60) }
    catch (x) { setErr(x.message) }
  }

  return (
    <div className="login-wrap">
      <form className="login" onSubmit={submit}>
        <div className="logo" style={{ padding: 0 }}>Sari<span>ventory</span></div>
        <h2 className="auth-title">Check your email</h2>
        <p className="sub" style={{ marginBottom: 8 }}>We sent a 6-digit code to <b>{email}</b>.</p>
        <p className="auth-note warn">Can't find it? Check your <b>Spam</b> or <b>Junk</b> folder. It can take up to a minute to arrive.</p>
        <label>Verification code</label>
        <input required autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6}
          value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
          style={{ fontSize: 24, letterSpacing: 6, textAlign: 'center' }} />
        {err && <p className="auth-err">{err}</p>}
        {info && <p className="auth-note">{info}</p>}
        <button className="btn" style={{ width: '100%', marginTop: 18 }} disabled={busy || code.length !== 6}>
          {busy ? 'Checking…' : 'Verify email'}
        </button>
        <button type="button" className="btn ghost" style={{ width: '100%', marginTop: 10 }} disabled={wait > 0} onClick={resend}>
          {wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
        </button>
        <p className="auth-switch"><button type="button" className="link" onClick={onBack}>Back</button></p>
      </form>
    </div>
  )
}