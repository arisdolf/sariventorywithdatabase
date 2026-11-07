import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ConfirmProvider } from './components/Confirm'
import './styles/index.css'

createRoot(document.getElementById('root')).render(
  <ConfirmProvider><App /></ConfirmProvider>
)
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})