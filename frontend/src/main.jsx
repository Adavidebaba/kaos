import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

import { UploadProvider } from './context/UploadContext';
import { PocketProvider } from './context/PocketContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UploadProvider>
      <PocketProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PocketProvider>
    </UploadProvider>
  </StrictMode>,
)
