import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

export default function SearchSelect({ value, onChange, options, placeholder = 'Select an option…', label, className = '', style, inputStyle, searchToOpen = false }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const box = useRef(null)
  const listboxRef = useRef(null)

  const opts = options.map(o => { const [v, l] = [].concat(o); return [String(v), String(l ?? v)] })
  const current = opts.find(([v]) => v === String(value))
  const list = opts.filter(([, l]) => l.toLowerCase().includes(q.trim().toLowerCase()))
  const showList = open && pos && (!searchToOpen || q.trim().length > 0)

  // Size the list to the space actually left on screen (keyboard included on most phones)
  const place = useCallback(() => {
    if (!box.current) return
    const anchor = box.current.querySelector('input') || box.current
    const r = anchor.getBoundingClientRect()
    const vh = window.visualViewport?.height ?? window.innerHeight
    const vw = document.documentElement.clientWidth
    const width = Math.min(r.width, vw - 24)
    const below = vh - r.bottom - 12
    const above = r.top - 12
    const up = below < 160 && above > below
    setPos({
      left: Math.max(12, Math.min(r.left, vw - width - 12)), width,
      maxHeight: Math.max(96, Math.min(up ? above : below, 320)),
      top: up ? 'auto' : r.bottom + 4,
      bottom: up ? vh - r.top + 4 : 'auto',
    })
  }, [])

  useEffect(() => {
    if (!open) return
    const dismiss = e => {
      if (box.current?.contains(e.target) || listboxRef.current?.contains(e.target)) return
      setOpen(false)
      setQ('')
    }
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    document.addEventListener('pointerdown', dismiss)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      document.removeEventListener('pointerdown', dismiss)
    }
  }, [open, place])

  const choose = v => { onChange(v); setOpen(false); setQ('') }
  const closeIfOutside = target => {
    if (box.current?.contains(target) || listboxRef.current?.contains(target)) return
    setOpen(false)
    setQ('')
  }

  return (
    <div ref={box} className={className} style={style} onBlur={e => closeIfOutside(e.relatedTarget)}>
      <input
        placeholder={placeholder} autoComplete="off" aria-label={label}
        aria-haspopup="listbox" aria-expanded={!!showList}
        value={open ? q : (current?.[1] ?? '')}
        style={inputStyle}
        onFocus={() => { setQ(''); setOpen(true); place() }}
        onChange={e => { setQ(e.target.value); setOpen(true); place() }}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); if (list[0]) choose(list[0][0]) }
          if (e.key === 'Escape') { setOpen(false); setQ('') }
        }}
      />
      {showList && (
        createPortal(
          <ul ref={listboxRef} className="opts fx" role="listbox" style={pos} onBlur={e => closeIfOutside(e.relatedTarget)} onMouseDown={e => e.preventDefault()}>
            {list.length
              ? list.map(([v, l]) => (
                  <li key={v}><button type="button" role="option" aria-selected={v === String(value)} onClick={() => choose(v)}><span>{l}</span></button></li>
                ))
              : <li className="none">No matching products</li>}
          </ul>,
          document.body,
        )
      )}
    </div>
  )
}
