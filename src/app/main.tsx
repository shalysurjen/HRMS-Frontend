import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import "@fontsource/inter";
import "@fontsource/inter/700.css";
import '@/app/index.css';
import App from '@/app/App.tsx';
import { AuthProvider } from '@/shared/auth/AuthContext';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)