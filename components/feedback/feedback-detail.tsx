'use client'

import { FeedbackStatusBadge } from '@/components/shared/badges'
import { Card } from '@/components/shared/form-fields'
import { EmptyState } from '@/components/shared/page-header'
import { buttonVariants } from '@/components/ui/button'
import { formatDate, formatDateTime } from '@/lib/format'
import { markFeedbackRead, useAppState, useCurrentUser } from '@/lib/store'
import { ArrowLeft, FileQuestion } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { FeedbackTimeline, StatusProgress } from './feedback-timeline'

export function FeedbackDetail({ feedbackRef }: { feedbackRef: string }) {
  const user = useCurrentUser()
  const fb = useAppState((s) => s.feedback.find((f) => f.ref === feedbackRef))
  const isOwner = !!fb && fb.userId === user?.id

  useEffect(() => {
    if (isOwner) markFeedbackRead(feedbackRef)
  }, [isOwner, feedbackRef, fb?.unreadByUser])

  if (!fb || !isOwner) {
    return (
      <div className="py-6">
        <EmptyState
          icon={<FileQuestion className="size-5" />}
          title="Submission not found"
          description="We couldn't find a submission with this reference number in your account."
          action={
            <Link href="/feedback" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              Back to my feedback
            </Link>
          }
        />
      </div>
    )
  }

  const details = [
    { label: 'Category', value: fb.category },
    { label: 'Location', value: fb.location },
    { label: 'Date of issue', value: formatDate(fb.incidentDate) },
    { label: 'Submitted', value: formatDateTime(fb.submittedAt) },
  ]

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        href="/feedback"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        My feedback
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-primary">{fb.ref}</span>
          <FeedbackStatusBadge status={fb.status} />
        </div>
        <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">{fb.title}</h1>
      </header>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Progress</h2>
        <StatusProgress status={fb.status} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-sm font-semibold text-foreground">Submission details</h2>
          <dl className="grid grid-cols-2 gap-4">
            {details.map((d) => (
              <div key={d.label} className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">{d.label}</dt>
                <dd className="text-sm font-medium text-foreground">{d.value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-1">
            <h3 className="text-xs text-muted-foreground">Description</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{fb.description}</p>
          </div>
          {fb.photo && (
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs text-muted-foreground">Photo evidence</h3>
              {/* eslint-disable-next-line @next/next/no-img-element -- locally stored data URL */}
              <img src={fb.photo} alt={`Evidence for ${fb.ref}`} className="max-h-72 w-fit rounded-lg border border-border" />
            </div>
          )}
          <p className="border-t border-border pt-3 text-xs text-muted-foreground">
            This submission is private to you and authorised project staff.
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="mb-5 text-sm font-semibold text-foreground">Status history & responses</h2>
          <FeedbackTimeline events={fb.timeline} hideInternal />
        </Card>
      </div>
    </div>
  )
}
