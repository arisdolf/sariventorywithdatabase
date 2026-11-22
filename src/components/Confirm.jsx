import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const Ctx = createContext(() => Promise.resolve(false))

// const ask = useConfirm();  if (await ask({ title, message, confirmText, cancelText, danger })) { ... }
export const useConfirm = () => useContext(Ctx)

export function ConfirmProvider({ children }) {
  const [s, setS] = useState(null)
  const trigger = useRef(null)
  const box = useRef(null)
  const ask = useCallback(o => new Promise(res => {
    trigger.current = document.activeElement
    setS({ ...o, res })
  }), [])
  const close = v => { s.res(v); setS(null); setTimeout(() => trigger.current?.focus?.(), 0) } // focus goes back

  useEffect(() => {
    if (!s) return
    const k = e => {
      if (e.key === 'Escape') { e.preventDefault(); close(false) }
      if (e.key === 'Tab') { // keep focus inside the dialog
        const els = box.current.querySelectorAll('button')
        const first = els[0], last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [s])

  return (
    <Ctx.Provider value={ask}>
      {children}
      {s && (
        <div className="ov cf-ov" onClick={() => close(false)}>
          <div ref={box} className="card confirm" role="alertdialog" aria-modal="true"
            aria-labelledby="cf-title" aria-describedby={s.message ? 'cf-msg' : undefined}
            onClick={e => e.stopPropagation()}>
            <div className={'cf-icon' + (s.danger ? ' danger' : '')} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17.5v.01" />
              </svg>
            </div>
            <h3 id="cf-title">{s.title || 'Please confirm'}</h3>
            {s.message && <p id="cf-msg">{s.message}</p>}
            <div className="cf-btns">
              {/* safe action first and focused */}
              <button type="button" className="btn ghost" autoFocus onClick={() => close(false)}>{s.cancelText || 'Keep it'}</button>
              <button type="button" className={'btn' + (s.danger ? ' danger' : '')} onClick={() => close(true)}>{s.confirmText || 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}