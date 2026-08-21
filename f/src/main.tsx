import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import { AppProvider } from '@/lib/AppContext'
import { AuthProvider } from '@/lib/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <App />
          <Toaster position="bottom-right" toastOptions={{ style: { background: '#ECE7E1', color: '#4a4239', border: '1px solid #d6cfc6', borderRadius: '14px', fontFamily: 'Nunito Sans, sans-serif' } }} />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
