import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ThemeWrapper } from '@dans-dv/theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeWrapper>
      <App />
    </ThemeWrapper>
  </StrictMode>,
)
