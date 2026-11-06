import { useState, useRef, useEffect } from 'react'

export default function SearchSelect({ value, onChange, options, placeholder = 'Search…' }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const box = useRef(null)

  const opts = options.map(o => { const [v, l] = [].concat(o); return [String(v), String(l ?? v)] })
  const current = opts.find(([v]) => v === String(value))
  const list = opts.filter(([, l]) => l.toLowerCase().includes(q.trim().toLowerCase()))

  // Size the list to the space actually left on screen (keyboard included on most phones)
  const place = () => {
    if (!box.current) return
    const r = box.current.getBoundingClientRect()
    const vh = window.visualViewport?.height ?? window.innerHeight
    const below = vh - r.bottom - 12
    const above = r.top - 12
    const up = below < 160 && above > below
    setPos({
      left: r.left, width: r.width,
      maxHeight: Math.max(96, Math.min(up ? above : below, 320)),
      top: up ? 'auto' : r.bottom + 4,
      bottom: up ? vh - r.top + 4 : 'auto',
    })
  }

  useEffect(() => {
    if (!open) return
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true) }
  }, [open])

  const choose = v => { onChange(v); setOpen(false); setQ('') }

  return (
    <div ref={box} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) { setOpen(false); setQ('') } }}>
      <input
        placeholder={placeholder} autoComplete="off"
        value={open ? q : (current?.[1] ?? '')}
        onFocus={() => { setQ(''); setOpen(true); place() }}
        onChange={e => { setQ(e.target.value); setOpen(true); place() }}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); if (list[0]) choose(list[0][0]) }
          if (e.key === 'Escape') { setOpen(false); setQ('') }
        }}
      />
      {open && pos && (
        <ul className="opts fx" style={pos} onMouseDown={e => e.preventDefault()}>
          {list.length
            ? list.map(([v, l]) => (
                <li key={v}><button type="button" onClick={() => choose(v)}><span>{l}</span></button></li>
              ))
            : <li className="none">No matching products</li>}
        </ul>
      )}
    </div>
  )
}