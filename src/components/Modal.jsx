import { useState } from 'react'

export default function Modal({ title, fields, onSave, onClose }) {
  const [v, setV] = useState(
    Object.fromEntries(fields.map(f => [f.n, f.v ?? (f.opts ? [].concat(f.opts[0])[0] : '')]))
  )
  return (
    <div className="ov"><dialog open>
      <form onSubmit={e => { e.preventDefault(); onSave(v) }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {fields.map(f => (
          <div key={f.n}>
            <label>{f.l}</label>
            {f.opts
              ? <select value={v[f.n]} onChange={e => setV({ ...v, [f.n]: e.target.value })}>
                  {f.opts.map(o => { const [val, lab] = [].concat(o); return <option key={val} value={val}>{lab ?? val}</option> })}
                </select>
              : <input type={f.t || 'text'} required={f.req} min={f.t === 'number' ? 0 : undefined} step={f.t === 'number' ? 'any' : undefined}
                  value={v[f.n]} onChange={e => setV({ ...v, [f.n]: e.target.value })} />}
          </div>
        ))}
        <div className="row">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn">Save</button>
        </div>
      </form>
    </dialog></div>
  )
}