import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Landing from '@/pages/Landing'
import LegalPage from '@/pages/LegalPage'
import Dashboard from '@/pages/Dashboard'
import NotFound from '@/pages/NotFound'

// Editor pulls in the WebCodecs/mediabunny pipeline — code-split it so the
// landing page's initial bundle stays lean.
const Editor = lazy(() => import('@/pages/Editor'))

// Per-route <title>. Only the legal pages set their own before this; every other
// route inherited the landing title, so /dashboard read as the marketing page in
// the tab bar and in browser history.
const TITLES = {
  '/': 'KickSnap — The clip editor built for Kick clippers',
  '/editor': 'Editor — KickSnap',
  '/dashboard': 'Dashboard — KickSnap',
}

/**
 * React Router keeps the scroll position across navigations, so jumping from a
 * scrolled landing page to /dashboard landed you mid-page. Reset on every real
 * navigation, but leave hash links (#pricing) alone so they can anchor.
 */
function RouteEffects() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])

  useEffect(() => {
    const title = TITLES[pathname]
    if (title) document.title = title
  }, [pathname])

  return null
}

function App() {
  return (
    <>
      <RouteEffects />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App
