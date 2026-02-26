import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'  // <--- IMPORTANT: Ensure this says './App.jsx'
import './index.css'         // <--- IMPORTANT: Ensure this says './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)