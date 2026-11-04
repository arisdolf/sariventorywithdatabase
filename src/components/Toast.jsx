export default function Toast({ msg }) {
  return msg ? <div id="toast" style={{ display: 'block' }}>{msg}</div> : null
}
