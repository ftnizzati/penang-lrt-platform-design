import { HydrationGate } from '@/components/shared/hydration-gate'
import { SampleBanner, SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <SampleBanner />
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6 md:py-10">
        <HydrationGate>{children}</HydrationGate>
      </main>
      <SiteFooter />
    </div>
  )
}
