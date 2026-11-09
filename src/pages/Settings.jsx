import { useState } from 'react'
import { api } from '../services/api'
import { ask, show, supported } from '../utils/notify'

const RESETS = [
  ['daily', 'Every day', 'Starts again at #1 each morning. Best for busy stores.'],
  ['weekly', 'Every week', 'Starts again at #1 every Monday.'],
  ['monthly', 'Every month', 'Starts again at #1 on the 1st.'],
  ['never', 'Never', 'Keeps counting up forever.'],
]
const EVENTS = [
  ['sales', 'history', 'Sales and voided sales'],
  ['stock', 'stock', 'Low stock and stock removals'],
  ['team', 'team', 'Team and store changes'],
]

const Section = ({ title, sub, children }) => (
  <section className="set-sec">
    <h2>{title}</h2>
    {sub && <p className="sub" style={{ marginBottom: 14 }}>{sub}</p>}
    {children}
  </section>
)

export default function Settings({ user, run, toast, setView }) {
  const perms = user?.perms || []
  const isOwner = perms.includes('team')

  const [reset, setReset] = useState(user?.orderReset || 'daily')
  const n = user?.notify || { on: false, sales: true, stock: true, team: true }
  const [dp, setDp] = useState('')
  const [dc, setDc] = useState('')
  const perm = supported() ? Notification.permission : 'unsupported'

  const saveReset = e => { e.preventDefault(); run(() => api('/settings/orders', 'PUT', { reset }), 'Order numbering saved') }

  const saveNotify = next => run(() => api('/settings/notifications', 'PUT', next), 'Saved')
  const toggleOn = async e => {
    const on = e.target.checked
    if (on) {
      const p = await ask()
      if (p === 'unsupported') return toast('This browser does not support notifications')
      if (p !== 'granted') return toast('Notifications are blocked. Allow them in your browser settings.')
    }
    saveNotify({ ...n, on })
  }
  const test = async () => {
    const ok = await show('Sariventory', 'Notifications are working.')
    if (!ok) toast('Could not show a notification. Check your browser permission.')
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
      <h1>Settings</h1>
      <p className="sub">Manage how {user?.store} works for you.</p>

      <Section title="Order numbers" sub="When should sale numbers start again at #1? Past sales keep their numbers.">
        <form className="card" onSubmit={saveReset} style={{ maxWidth: 520 }}>
          {RESETS.map(([k, label, hint]) => (
            <label key={k} className={'opt' + (reset === k ? ' on' : '')} style={{ margin: '0 0 8px', fontSize: 15, color: 'var(--text)' }}>
              <input type="radio" name="reset" disabled={!isOwner} checked={reset === k} onChange={() => setReset(k)} />
              <span><b>{label}</b><br /><small style={{ color: 'var(--mute)' }}>{hint}</small></span>
            </label>
          ))}
          {isOwner
            ? <button className="btn" style={{ marginTop: 8 }} disabled={reset === (user?.orderReset || 'daily')}>Save</button>
            : <p style={{ color: 'var(--mute)', margin: '8px 0 0' }}>Only the store owner can change this.</p>}
        </form>
      </Section>

      <Section title="Notifications">
        <div className="card" style={{ maxWidth: 520 }}>
          <div className="row2" style={{ borderTop: 0, paddingTop: 0 }}>
            <span><b>Notify me</b><br /><small style={{ color: 'var(--mute)' }}>Shows a notification when something happens in your store.</small></span>
            <label className="switch"><input type="checkbox" checked={!!n.on} onChange={toggleOn} /><span /></label>
          </div>

          {n.on && <>
            <p style={{ margin: '14px 0 6px', color: 'var(--mute)' }}>Tell me about</p>
            {EVENTS.filter(([, p]) => perms.includes(p)).map(([k, , label]) => (
              <div className="row2" key={k}>
                <span>{label}</span>
                <label className="switch"><input type="checkbox" checked={!!n[k]} onChange={e => saveNotify({ ...n, [k]: e.target.checked })} /><span /></label>
              </div>
            ))}
            <button className="btn ghost" style={{ marginTop: 12 }} onClick={test}>Send a test notification</button>
          </>}

          <p style={{ color: 'var(--mute)', margin: '14px 0 0', fontSize: 13 }}>
            {perm === 'denied' ? 'Your browser is blocking notifications for this site. Allow them in the site settings.'
              : perm === 'unsupported' ? 'This browser does not support notifications.'
              : 'You are notified about what other people do. These show while the app is open in your browser, including in the background.'}
          </p>
        </div>
      </Section>

            {(perms.includes('analytics') || perms.includes('activity')) && (
        <Section title="Reports and history">
          <div className="go-list">
            {perms.includes('analytics') && (
              <button type="button" className="go" onClick={() => { setView('analytics'); window.scrollTo(0, 0) }}>
                <span><b>Analytics</b><br /><small>Sales over days, weeks, months and years</small></span>
                <span className="chev">›</span>
              </button>
            )}
            {perms.includes('activity') && (
              <button type="button" className="go" onClick={() => { setView('activity'); window.scrollTo(0, 0) }}>
                <span><b>Activity center</b><br /><small>What everyone on your team has done</small></span>
                <span className="chev">›</span>
              </button>
            )}
          </div>
        </Section>
      )}

      <Section title="Delete account">
        <form className="card danger-zone" onSubmit={del} style={{ maxWidth: 520 }}>
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
      </Section>
    </>
  )
}