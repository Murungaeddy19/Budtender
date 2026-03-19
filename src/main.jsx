import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Budtender from './budtender'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Budtender />
  </StrictMode>
)