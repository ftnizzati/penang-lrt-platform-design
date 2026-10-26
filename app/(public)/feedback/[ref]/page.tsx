import { FeedbackDetail } from '@/components/feedback/feedback-detail'
import { RequireAuth } from '@/components/shared/require-auth'

export default async function FeedbackDetailPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  return (
    <RequireAuth>
      <FeedbackDetail feedbackRef={decodeURIComponent(ref)} />
    </RequireAuth>
  )
}
