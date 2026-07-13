import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { marked } from 'marked'
import { ArrowLeft } from 'lucide-react'
import Logo from '@/components/Logo'
import Footer from '@/components/landing/Footer'

import privacyRaw from '../../legal/privacy-policy.md?raw'
import termsRaw from '../../legal/terms-of-service.md?raw'
import cookiesRaw from '../../legal/cookie-policy.md?raw'

const DOCS = {
  privacy: { raw: privacyRaw, title: 'Privacy Policy' },
  terms: { raw: termsRaw, title: 'Terms of Service' },
  cookies: { raw: cookiesRaw, title: 'Cookie Policy' },
}

// Rewrite the cross-links between the source .md files to their live routes.
const LINK_MAP = {
  './privacy-policy.md': '/privacy',
  './terms-of-service.md': '/terms',
  './cookie-policy.md': '/cookies',
}

function renderMarkdown(raw) {
  // Strip the internal dev comment at the top (DRAFT / placeholder notes).
  let md = raw.replace(/^<!--[\s\S]*?-->\s*/, '')
  for (const [from, to] of Object.entries(LINK_MAP)) {
    md = md.split(from).join(to)
  }
  let html = marked.parse(md, { async: false })
  // Open external links in a new tab.
  html = html.replace(
    /<a href="(https?:[^"]+)"/g,
    '<a target="_blank" rel="noopener noreferrer" href="$1"',
  )
  return html
}

export default function LegalPage({ doc }) {
  const entry = DOCS[doc]
  const html = useMemo(() => (entry ? renderMarkdown(entry.raw) : ''), [entry])

  useEffect(() => {
    window.scrollTo(0, 0)
    if (entry) document.title = `${entry.title} — KickSnap`
  }, [entry])

  if (!entry) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background">
        <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
          Document not found
        </p>
        <Link to="/" className="text-kick underline">
          Back to home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b-2 border-border">
        <div className="mx-auto flex h-20 max-w-3xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-8" />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <article
          className="legal-prose"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>

      <Footer />
    </div>
  )
}
