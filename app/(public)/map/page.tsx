import { MapExplorer } from '@/components/map/map-explorer'
import { PageHeader } from '@/components/shared/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Construction Map' }

export default function MapPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Interactive map"
        title="Construction map"
        description="See which streets and neighbourhoods are affected. Select a marker for details, dates and alternative routes. The dashed line is an indicative sample alignment only."
      />
      <MapExplorer />
    </div>
  )
}
