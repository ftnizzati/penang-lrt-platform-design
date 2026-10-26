import { ScheduleView } from '@/components/schedule/schedule-view'
import { PageHeader } from '@/components/shared/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Construction Schedule' }

export default function SchedulePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Planned works"
        title="Construction schedule"
        description="Planned construction activities with dates, working hours and affected roads. Status is calculated from today's date."
      />
      <ScheduleView />
    </div>
  )
}
