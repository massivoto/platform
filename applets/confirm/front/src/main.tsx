/**
 * Entry point for the Confirm applet frontend.
 *
 * Requirements:
 * - R-CONFIRM-41: Create React app with Vite
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
