import { useState, useEffect } from 'react'
import { api } from '../services/api'

export default function ForgotPassword({ initialEmail = '', onBack, onDone }) {
  const [step, setStep] = useState(1) // 1 = enter email, 2 = enter code + new password
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(0)

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait(w => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  const send = async e => {
    e?.preventDefault()
    setBusy(true); setErr(''); setInfo('')
    try {
      await api('/forgot-password', 'POST', { email })
      setStep(2); setWait(60)
      setInfo('If that email has an account, we sent a 6-digit code to it.')
    } catch (x) { setErr(x.message) }
    setBusy(false)
  }

  const submit = async e => {
    e.preventDefault()
    setErr(''); setInfo('')
    if (pw !== confirm) return setErr('Passwords do not match')
    setBusy(true)
    try {
      await api('/reset-password', 'POST', { email, code, password: pw })
      onDone()
    } catch (x) { setErr(x.message) }
    setBusy(false)
  }

  return (
    <div className="login-wrap">
      <form className="login" onSubmit={step === 1 ? send : submit}>
        <div className="logo" style={{ padding: 0 }}>Sari<span>ventory</span></div>
        <h2 className="auth-title">Reset your password</h2>
        <p className="sub" style={{ marginBottom: 8 }}>
          {step === 1 ? 'Enter your email and we will send you a code.' : <>Enter the code sent to <b>{email}</b> and choose a new password.</>}
        </p>

        {step === 1 && <>
          <label>Email</label>
          <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)} />
        </>}

        {step === 2 && <>
          <label>Verification code</label>
          <input required autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6}
            value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            style={{ fontSize: 24, letterSpacing: 6, textAlign: 'center' }} />
          <label>New password (at least 8 characters)</label>
          <input type="password" required minLength={8} value={pw} onChange={e => setPw(e.target.value)} />
          <label>Confirm new password</label>
          <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} />
        </>}

        {err && <p className="auth-err">{err}</p>}
        
        {info && <p className="auth-note">{info}</p>}
          {step === 2 && <p className="auth-note warn">Can't find it? Check your <b>Spam</b> or <b>Junk</b> folder.</p>}
        <button className="btn" style={{ width: '100%', marginTop: 18 }} disabled={busy || (step === 2 && code.length !== 6)}>
          {busy ? 'Please wait…' : step === 1 ? 'Send code' : 'Change password'}
        </button>
        {step === 2 && (
          <button type="button" className="btn ghost" style={{ width: '100%', marginTop: 10 }} disabled={wait > 0 || busy} onClick={send}>
            {wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
          </button>
        )}
        <p className="auth-switch"><button type="button" className="link" onClick={onBack}>Back to log in</button></p>
      </form>
    </div>
  )
}