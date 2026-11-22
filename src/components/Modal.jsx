import { useState, useEffect, useRef } from 'react'
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
  const dlg = useRef(null)
  const trigger = useRef(document.activeElement)

  // Focus the first field on open, give focus back on close, Escape closes (not while saving)
  useEffect(() => {
    dlg.current?.querySelector('input:not([type=checkbox]), select')?.focus()
    const back = trigger.current
    return () => back?.focus?.()
  }, [])
  useEffect(() => {
    const k = e => { if (e.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [busy, onClose])

  const submit = async e => {
    e.preventDefault()
    if (busy) return
    const missing = fields.find(f => (!f.show || f.show(v)) && f.search && !v[f.n])
    if (missing) return setErr('Pick an option from the list for “' + missing.l + '”.')
    setErr(''); setBusy(true)
    try { await onSave(v) } finally { setBusy(false) }
  }

  return (
    <div className="ov"><dialog open ref={dlg} role="dialog" aria-modal="true" aria-labelledby="md-title" aria-busy={busy}>
      <form onSubmit={submit}>
        <h3 id="md-title" style={{ margin: 0 }}>{title}</h3>
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
                      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
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
                <input type="number" inputMode="decimal" required={f.req} min="0" step="any" placeholder={f.ph || 'Amount'} aria-label={f.l}
                  value={v[f.n]} onChange={e => setV({ ...v, [f.n]: e.target.value })} />
                <SearchSelect className="unit-select" label="Unit" value={v[f.u]} options={f.opts}
                  onChange={val => setV({ ...v, [f.u]: val })} />
              </div>
            </div>
          )

          if (f.note) { const n = f.note(v); return n ? <p key={f.n} role={n[0] === 'bad' ? 'alert' : 'status'} className={tone(n[0])}>{n[1]}</p> : null }
          const label = typeof f.l === 'function' ? f.l(v) : f.l
          return (
            <div key={f.n}>
              <label>{label}{!f.req && !f.opts && !/optional/i.test(label) ? ' (optional)' : ''}</label>
              {f.search
                ? <SearchSelect value={v[f.n]} options={f.opts} label={label} placeholder={f.ph} searchToOpen={f.searchToOpen}
                    onChange={val => { setV({ ...v, [f.n]: val }); setErr('') }} />
                : f.opts
                  ? <SearchSelect label={label} value={v[f.n]} options={f.opts}
                      onChange={val => setV({ ...v, [f.n]: val })} />
                  : <input type={f.t || 'text'} required={f.req}
                      min={typeof f.min === 'function' ? f.min(v) : (f.min ?? (f.t === 'number' ? 0 : undefined))}
                      max={typeof f.max === 'function' ? f.max(v) : f.max}
                      step={f.step ?? (f.t === 'number' ? 'any' : undefined)}
                      inputMode={f.t === 'number' ? 'decimal' : undefined}
                      placeholder={typeof f.ph === 'function' ? f.ph(v) : f.ph}
                      value={v[f.n]} onChange={e => setV({ ...v, [f.n]: e.target.value })} />}
            </div>
          )
        })}
        {err && <p className="auth-err" role="alert">{err}</p>}
        <div className="row">
          <button type="button" className="btn ghost" disabled={busy} onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </dialog></div>
  )
}
