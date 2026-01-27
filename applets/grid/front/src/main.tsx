/**
 * Entry point for the Grid applet frontend.
 *
 * Requirements:
 * - R-GRID-41: Create React app with Vite
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
