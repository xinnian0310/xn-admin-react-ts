import '@/utils/silence-react-devtools'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { printConsoleBanner } from '@/utils/console-banner'
import './styles/app.css'
import './index.css'

printConsoleBanner()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
