const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export async function api(path, method = 'GET', body) {
  const token = localStorage.getItem('token')
  const r = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token && { Authorization: 'Bearer ' + token }),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const j = await r.json().catch(() => ({}))
   if (r.status === 401 && !['/login', '/register', '/rejoin', '/verify-email', '/resend-code', '/forgot-password', '/reset-password'].includes(path)) {
    localStorage.removeItem('token'); localStorage.removeItem('user')
    window.dispatchEvent(new Event('logout'))
  }
   if (!r.ok) { const e = new Error(j.message || 'Request failed'); e.data = j; throw e }
  return j
}