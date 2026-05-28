  // src/main.jsx
  import { StrictMode } from 'react'
  import { createRoot } from 'react-dom/client'
  import { BrowserRouter } from 'react-router-dom'
  import { ToastContainer } from 'react-toastify'
  import 'react-toastify/dist/ReactToastify.css'
  import { ThemeProvider, CssBaseline } from '@mui/material'
  import { createTheme } from '@mui/material/styles'
  import { GoogleOAuthProvider } from '@react-oauth/google'
  import { AuthProvider } from './contexts/AuthContext'
  import App from './App'

  const theme = createTheme({
    palette: {
      primary: { main: '#1976d2' },
      success: { main: '#2e7d32' }
    }
  })

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      {/* Google OAuth provider — bọc ngoài cùng */}
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <AuthProvider>
              <App />
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                closeOnClick
                pauseOnHover
              />
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </StrictMode>
  )