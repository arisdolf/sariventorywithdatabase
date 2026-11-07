import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const Ctx = createContext(() => Promise.resolve(false))

// const ask = useConfirm();  if (await ask({ title, message, confirmText, danger })) { ... }
export const useConfirm = () => useContext(Ctx)

export function ConfirmProvider({ children }) {
  const [s, setS] = useState(null)
  const ask = useCallback(o => new Promise(res => setS({ ...o, res })), [])
  const close = v => { s.res(v); setS(null) }

  useEffect(() => {
    if (!s) return
    const k = e => { if (e.key === 'Escape') { s.res(false); setS(null) } }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [s])

  return (
    <Ctx.Provider value={ask}>
      {children}
      {s && (
        <div className="ov cf-ov" onClick={() => close(false)}>
          <div className="card confirm" role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <div className={'cf-icon' + (s.danger ? ' danger' : '')}>
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17.5v.01" />
              </svg>
            </div>
            <h3>{s.title || 'Are you sure?'}</h3>
            {s.message && <p>{s.message}</p>}
            <div className="cf-btns">
              <button type="button" className="btn ghost" autoFocus onClick={() => close(false)}>{s.cancelText || 'Cancel'}</button>
              <button type="button" className={'btn' + (s.danger ? ' danger' : '')} onClick={() => close(true)}>{s.confirmText || 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}