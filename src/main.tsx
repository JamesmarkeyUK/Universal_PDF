import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { usePdfStore } from './stores/pdfStore'
import { useAnnotationStore } from './stores/annotationStore'
import { useSignatureStore } from './stores/signatureStore'
import './index.css'

if (import.meta.env.DEV) {
  ;(window as unknown as { __stores: unknown }).__stores = {
    pdf: usePdfStore,
    ann: useAnnotationStore,
    sig: useSignatureStore
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
