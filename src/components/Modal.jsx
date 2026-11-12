import { useState } from 'react'
import SearchSelect from './SearchSelect'

const tone = t => t === 'bad' ? 'auth-err' : t === 'warn' ? 'auth-note warn' : 'auth-note'

export default function Modal({ title, fields, onSave, onClose }) {
  const [v, setV] = useState(
  Object.fromEntries(fields.flatMap(f => f.amt
    ? [[f.n, f.v ?? ''], [f.u, f.uv ?? [].concat(f.opts[0])[0]]]
    : [[f.n, f.v ?? (f.opts && !f.search ? [].concat(f.opts[0])[0] : '')]]))
)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async e => {
    e.preventDefault()
    if (busy) return
    const missing = fields.find(f => (!f.show || f.show(v)) && f.search && !v[f.n])
    if (missing) return setErr('Please pick from the list: ' + missing.l)
    setBusy(true)
    try { await onSave(v) } finally { setBusy(false) }
  }

  return (
  <div className="ov"><dialog open>
    <form onSubmit={submit}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      {fields.filter(f => !f.show || f.show(v)).map(f => {
        if (f.sw) return (
          <div key={f.n} className="row2" style={{ borderTop: 0, paddingTop: 12 }}>
            <span><b>{f.l}</b><br /><small style={{ color: 'var(--mute)' }}>{f.hint}</small></span>
            <label className="switch"><input type="checkbox" checked={!!v[f.n]} onChange={e => setV({ ...v, [f.n]: e.target.checked })} /><span /></label>
          </div>
        )

        if (f.tabs) {
          const cur = f.tabs.find(t => t[0] === v[f.n])
          return (
            <div key={f.n}>
              <div className="mtabs" role="tablist">
                {f.tabs.map(([val, lab, , icon]) => (
                  <button key={lab} type="button" role="tab" aria-selected={v[f.n] === val}
                    className={v[f.n] === val ? 'on' : ''}
                    onClick={() => setV({ ...v, [f.n]: val })}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
                    <span>{lab}</span>
                  </button>
                ))}
              </div>
              {cur?.[2] && <p className="mtabs-hint">{cur[2]}</p>}
            </div>
          )
        }

        if (f.amt) return (
          <div key={f.n}>
            <label>{f.l}</label>
            <div className="amt">
              <input type="number" required={f.req} min="0" step="any" placeholder={f.ph || 'Amount'}
                value={v[f.n]} onChange={e => setV({ ...v, [f.n]: e.target.value })} />
              <select aria-label="Unit" value={v[f.u]} onChange={e => setV({ ...v, [f.u]: e.target.value })}>
                {f.opts.map(o => { const [val, lab] = [].concat(o); return <option key={val} value={val}>{lab ?? val}</option> })}
              </select>
            </div>
          </div>
        )

        if (f.note) { const n = f.note(v); return n ? <p key={f.n} className={tone(n[0])}>{n[1]}</p> : null }
        return (
          <div key={f.n}>
            <label>{typeof f.l === 'function' ? f.l(v) : f.l}</label>
            {f.search
              ? <SearchSelect value={v[f.n]} options={f.opts} placeholder={f.ph}
                  onChange={val => { setV({ ...v, [f.n]: val }); setErr('') }} />
              : f.opts
              ? <select value={v[f.n]} onChange={e => setV({ ...v, [f.n]: e.target.value })}>
                  {f.opts.map(o => { const [val, lab] = [].concat(o); return <option key={val} value={val}>{lab ?? val}</option> })}
                </select>
              : <input type={f.t || 'text'} required={f.req} min={f.t === 'number' ? 0 : undefined} step={f.t === 'number' ? 'any' : undefined}
                  placeholder={typeof f.ph === 'function' ? f.ph(v) : f.ph}
                  value={v[f.n]} onChange={e => setV({ ...v, [f.n]: e.target.value })} />}
          </div>
        )
      })}
      {err && <p className="auth-err">{err}</p>}
      <div className="row">
        <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  </dialog></div>
)
}