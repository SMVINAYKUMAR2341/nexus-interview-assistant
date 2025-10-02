import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Test if React is rendering at all
console.log('main.jsx loaded')

try {
  const root = document.getElementById('root')
  console.log('Root element:', root)
  
  ReactDOM.createRoot(root).render(
    <App />
  )
  console.log('React app rendered')
} catch (error) {
  console.error('Error rendering app:', error)
  document.body.innerHTML = '<h1>Error: ' + error.message + '</h1>'
}