import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import { applyTheme, getStoredTheme } from './utils/theme.js'

// Applied before the first paint so there's no flash of the wrong theme.
applyTheme(getStoredTheme())

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

function Root() {
  // Only mount the provider when a client ID is configured, so the app
  // still runs (minus the Google button) without it set up in dev.
  if (!googleClientId) return <App />
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
