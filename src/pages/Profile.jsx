import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { PageSkeleton } from '../components/Skeleton'
export default function Profile({ D, run, toast, user }) {
  const [f, setF] = useState(null)
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' })
  const [store, setStore] = useState(user?.store || '')
  const isOwner = user?.perms?.includes('team')
    const [dp, setDp] = useState('')
  const [dc, setDc] = useState('')
  const set = k => e => setF({ ...f, [k]: e.target.value })
   const [orig, setOrig] = useState(null)
    useEffect(() => {
    api('/profile').then(d => {
      const clean = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v ?? '']))
      setF(clean); setOrig(clean)
    }).catch(e => toast(e.message))
  }, [])
  useEffect(() => { setStore(user?.store || '') }, [user?.store])

if (!f) return <PageSkeleton page="profile" />
    const dirty = JSON.stringify(f) !== JSON.stringify(orig)
   const save = async e => {
    e.preventDefault()
    const ok = await run(() => api('/profile', 'PUT', f), 'Profile saved')
    if (ok) setOrig(f)
  }
  const changePw = async e => {
    e.preventDefault()
    if (pw.new_password !== pw.confirm) return toast('New passwords do not match')
    const ok = await run(() => api('/profile/password', 'PUT', {
      current_password: pw.current_password, new_password: pw.new_password,
    }), 'Password changed. Other devices were logged out.')
    if (ok) setPw({ current_password: '', new_password: '', confirm: '' })
  }
  const rename = e => {
    e.preventDefault()
    run(() => api('/store', 'PUT', { name: store }), 'Store renamed')
  }

    const del = async e => {
    e.preventDefault()
    try {
      await api('/account', 'DELETE', { password: dp, confirm: dc })
      localStorage.removeItem('token'); localStorage.removeItem('user')
      window.dispatchEvent(new Event('logout'))
    } catch (x) { toast(x.message) }
  }

  return (
    <>
      <h1>Profile</h1>
      <p className="sub">{user?.roleLabel} at {user?.store}</p>

      <form className="card" onSubmit={save} style={{ marginBottom: 20, maxWidth: 520 }}>
        <h3>Your details</h3>
        <label>First name</label>
        <input required value={f.first_name} onChange={set('first_name')} style={{ width: '100%' }} />
        <label>Middle name (optional)</label>
        <input value={f.middle_name} onChange={set('middle_name')} style={{ width: '100%' }} />
        <label>Last name</label>
        <input required value={f.last_name} onChange={set('last_name')} style={{ width: '100%' }} />
        <label>Email (cannot be changed)</label>
        <input disabled value={f.email} style={{ width: '100%' }} />
        <label>Birthdate</label>
        <input type="date" required max={new Date().toISOString().slice(0, 10)} value={f.birthdate} onChange={set('birthdate')} style={{ width: '100%' }} />
                <button className="btn" style={{ marginTop: 16 }} disabled={!dirty}>Save changes</button>
      </form>

      <form className="card" onSubmit={changePw} style={{ marginBottom: 20, maxWidth: 520 }}>
        <h3>Change password</h3>
        <label>Current password</label>
        <input type="password" required value={pw.current_password} onChange={e => setPw({ ...pw, current_password: e.target.value })} style={{ width: '100%' }} />
        <label>New password (at least 8 characters)</label>
        <input type="password" required minLength={8} value={pw.new_password} onChange={e => setPw({ ...pw, new_password: e.target.value })} style={{ width: '100%' }} />
        <label>Confirm new password</label>
        <input type="password" required value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} style={{ width: '100%' }} />
        <button className="btn" style={{ marginTop: 16 }} disabled={!pw.current_password || !pw.new_password || !pw.confirm}>Change password</button>
      </form>

      {isOwner && (
        <form className="card" onSubmit={rename} style={{ maxWidth: 520 }}>
          <h3>Store name</h3>
          <input required value={store} onChange={e => setStore(e.target.value)} style={{ width: '100%' }} />
          <button className="btn" style={{ marginTop: 16 }} disabled={!store.trim() || store === user?.store}>Rename store</button>
        </form>
      )}

            <form className="card danger-zone" onSubmit={del} style={{ marginTop: 20, maxWidth: 520 }}>
        <h3>Delete account</h3>
        <p style={{ color: 'var(--mute)', margin: '0 0 8px' }}>
          {isOwner
            ? 'This permanently deletes your store and all its products, sales and stock records. Remove your team first.'
            : 'This removes your login and personal details. Sales you made stay in the store’s records, shown as “Deleted user”.'}
        </p>
        <label>Your password</label>
        <input type="password" value={dp} onChange={e => setDp(e.target.value)} style={{ width: '100%' }} />
        <label>Type DELETE to confirm</label>
        <input value={dc} onChange={e => setDc(e.target.value)} style={{ width: '100%' }} />
        <button className="btn danger" style={{ marginTop: 16 }} disabled={!dp || dc !== 'DELETE'}>Delete my account</button>
      </form>
      
    </>
  )
}