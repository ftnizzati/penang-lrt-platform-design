import { AnnouncementsBrowser } from '@/components/announcements/announcements-browser'
import { PageHeader } from '@/components/shared/page-header'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = { title: 'Announcements' }

export default function AnnouncementsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Official updates"
        title="Construction announcements"
        description="Official notices from the project team on works, road closures, pedestrian detours and business access. Urgent notices are highlighted in amber."
      />
      <Suspense>
        <AnnouncementsBrowser />
      </Suspense>
    </div>
  )
}
