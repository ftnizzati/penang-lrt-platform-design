import { MyFeedbackList } from '@/components/feedback/my-feedback-list'
import { PageHeader } from '@/components/shared/page-header'
import { RequireAuth } from '@/components/shared/require-auth'
import { buttonVariants } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'My Feedback' }

export default function MyFeedbackPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Track submission"
        title="My feedback"
        description="Track the status of your submissions and read official responses from the project team."
        actions={
          <Link href="/feedback/new" className={buttonVariants({ size: 'lg' })}>
            <Plus />
            New feedback
          </Link>
        }
      />
      <RequireAuth>
        <MyFeedbackList />
      </RequireAuth>
    </div>
  )
}
