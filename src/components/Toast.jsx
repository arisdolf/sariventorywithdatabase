export default function Toast({ msg }) {
  return msg ? <div key={msg} id="toast" style={{ display: 'block' }}>{msg}</div> : null
}
