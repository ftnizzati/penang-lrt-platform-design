import { FeedbackForm } from '@/components/feedback/feedback-form'
import { PageHeader } from '@/components/shared/page-header'
import { RequireAuth } from '@/components/shared/require-auth'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Submit Feedback' }

export default function NewFeedbackPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        eyebrow="Feedback & complaints"
        title="Submit feedback"
        description="Report a problem or ask the project team a question. Your submission is private — only you and authorised project staff can see it."
      />
      <RequireAuth>
        <FeedbackForm />
      </RequireAuth>
    </div>
  )
}
