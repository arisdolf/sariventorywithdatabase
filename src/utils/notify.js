export const supported = () => typeof window !== 'undefined' && 'Notification' in window

// Must be called from a click, or browsers ignore it
export async function ask() {
  if (!supported()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export async function show(title, body) {
  if (!supported() || Notification.permission !== 'granted') return false
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(title, { body, icon: '/favicon.svg', badge: '/favicon.svg' })
      return true
    }
    new Notification(title, { body, icon: '/favicon.svg' })
    return true
  } catch { return false }
}