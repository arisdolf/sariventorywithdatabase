import { useState } from 'react'
import SearchSelect from './SearchSelect'

export default function Modal({ title, fields, onSave, onClose }) {
  const [v, setV] = useState(
    Object.fromEntries(fields.map(f => [f.n, f.v ?? (f.opts && !f.search ? [].concat(f.opts[0])[0] : '')]))
  )
  const [err, setErr] = useState('')

  const submit = e => {
    e.preventDefault()
    const missing = fields.find(f => f.search && !v[f.n])
    if (missing) return setErr('Please pick from the list: ' + missing.l)
    onSave(v)
  }

  return (
    <div className="ov"><dialog open>
      <form onSubmit={submit}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {fields.map(f => (
          <div key={f.n}>
            <label>{f.l}</label>
            {f.search
              ? <SearchSelect value={v[f.n]} options={f.opts} placeholder={f.ph}
                  onChange={val => { setV({ ...v, [f.n]: val }); setErr('') }} />
              : f.opts
              ? <select value={v[f.n]} onChange={e => setV({ ...v, [f.n]: e.target.value })}>
                  {f.opts.map(o => { const [val, lab] = [].concat(o); return <option key={val} value={val}>{lab ?? val}</option> })}
                </select>
              : <input type={f.t || 'text'} required={f.req} min={f.t === 'number' ? 0 : undefined} step={f.t === 'number' ? 'any' : undefined}
                  value={v[f.n]} onChange={e => setV({ ...v, [f.n]: e.target.value })} />}
          </div>
        ))}
        {err && <p className="auth-err">{err}</p>}
        <div className="row">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn">Save</button>
        </div>
      </form>
    </dialog></div>
  )
}