import { FeedbackStatusBadge } from '@/components/shared/badges'
import { formatDateTime } from '@/lib/format'
import { FEEDBACK_STATUSES, type Feedback, type TimelineEvent } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Check, CircleDot, MessageSquareText, Send, UserCheck } from 'lucide-react'

const EVENT_ICON: Record<TimelineEvent['type'], typeof Send> = {
  submitted: Send,
  status: CircleDot,
  response: MessageSquareText,
  assigned: UserCheck,
}

function eventLabel(e: TimelineEvent) {
  switch (e.type) {
    case 'submitted':
      return 'Feedback submitted'
    case 'status':
      return `Status changed to ${e.status}`
    case 'response':
      return 'Official response from project team'
    case 'assigned':
      return e.message ?? 'Assignment updated'
  }
}

export function StatusProgress({ status }: { status: Feedback['status'] }) {
  const current = FEEDBACK_STATUSES.indexOf(status)
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label={`Progress: ${status}`}>
      {FEEDBACK_STATUSES.map((s, i) => {
        const done = i <= current
        return (
          <li key={s} className="flex flex-col gap-2" aria-current={i === current ? 'step' : undefined}>
            <span className={cn('h-1.5 rounded-full', done ? 'bg-secondary' : 'bg-muted')} aria-hidden="true" />
            <span
              className={cn(
                'flex items-center gap-1 text-xs',
                done ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {i < current && <Check className="size-3 text-secondary" aria-hidden="true" />}
              {s}
              <span className="sr-only">{done ? ' (reached)' : ' (pending)'}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function FeedbackTimeline({ events, hideInternal }: { events: TimelineEvent[]; hideInternal?: boolean }) {
  const list = [...events]
    .filter((e) => !hideInternal || e.type !== 'assigned')
    .sort((a, b) => a.at.localeCompare(b.at))
  return (
    <ol className="flex flex-col">
      {list.map((e, i) => {
        const Icon = EVENT_ICON[e.type]
        const isResponse = e.type === 'response'
        return (
          <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
            {i < list.length - 1 && (
              <span className="absolute top-8 bottom-0 left-4 w-px -translate-x-1/2 bg-border" aria-hidden="true" />
            )}
            <span
              className={cn(
                'relative flex size-8 shrink-0 items-center justify-center rounded-full border',
                isResponse
                  ? 'border-secondary bg-secondary text-secondary-foreground'
                  : 'border-border bg-card text-muted-foreground',
              )}
              aria-hidden="true"
            >
              <Icon className="size-4" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{eventLabel(e)}</span>
                {e.status && e.type !== 'status' && <FeedbackStatusBadge status={e.status} />}
              </div>
              <p className="text-xs text-muted-foreground">
                <time dateTime={e.at}>{formatDateTime(e.at)}</time> · {e.by}
              </p>
              {isResponse && e.message && (
                <p className="mt-1 whitespace-pre-line rounded-lg border border-secondary/30 bg-secondary/5 p-3 text-sm leading-relaxed text-foreground">
                  {e.message}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function latestResponse(f: Feedback) {
  return [...f.timeline].reverse().find((e) => e.type === 'response')
}
