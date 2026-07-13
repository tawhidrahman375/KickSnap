import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Landing from '@/pages/Landing'
import LegalPage from '@/pages/LegalPage'
import Dashboard from '@/pages/Dashboard'

// Editor pulls in the WebCodecs/mediabunny pipeline — code-split it so the
// landing page's initial bundle stays lean.
const Editor = lazy(() => import('@/pages/Editor'))

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/editor"
        element={
          <Suspense fallback={<div className="min-h-svh bg-background" />}>
            <Editor />
          </Suspense>
        }
      />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/privacy" element={<LegalPage doc="privacy" />} />
      <Route path="/terms" element={<LegalPage doc="terms" />} />
      <Route path="/cookies" element={<LegalPage doc="cookies" />} />
    </Routes>
  )
}

export default App
