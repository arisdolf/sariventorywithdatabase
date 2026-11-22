// Live region always exists so screen readers announce new messages (polite, never steals focus).
// The message can be closed; App.jsx clears it after 10 s.
export default function Toast({ msg, onClose }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {msg && (
        <div key={msg} id="toast" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>{msg}</span>
          <button type="button" className="link" onClick={onClose} aria-label="Dismiss message"
            style={{ color: 'inherit', fontSize: 18, lineHeight: 1, minWidth: 28, minHeight: 28 }}>×</button>
        </div>
      )}
    </div>
  )
}