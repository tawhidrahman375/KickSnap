import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Problem from '@/components/landing/Problem'
import Numbers from '@/components/landing/Numbers'
import Features from '@/components/landing/Features'
import HowItWorks from '@/components/landing/HowItWorks'
import LiveDemo from '@/components/landing/LiveDemo'
import ExportQuality from '@/components/landing/ExportQuality'
import AnalyticsPreview from '@/components/landing/AnalyticsPreview'
import Pricing from '@/components/landing/Pricing'
import FAQ from '@/components/landing/FAQ'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Numbers />
        <Features />
        <HowItWorks />
        <LiveDemo />
        <ExportQuality />
        <AnalyticsPreview />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
