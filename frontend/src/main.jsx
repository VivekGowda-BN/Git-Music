import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './studio/studio.css'
import './studio/workspace.css'
import './studio/community.css'
import './studio/home.css'
import './studio/opportunities.css'
import App from './studio/Studio.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
