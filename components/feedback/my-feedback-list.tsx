'use client'

import { FeedbackStatusBadge } from '@/components/shared/badges'
import { Input, Select } from '@/components/shared/form-fields'
import { EmptyState } from '@/components/shared/page-header'
import { buttonVariants } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { useAppState, useCurrentUser } from '@/lib/store'
import { FEEDBACK_STATUSES, type FeedbackStatus } from '@/lib/types'
import { ChevronRight, Inbox, MapPin, MessageSquareText } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { latestResponse } from './feedback-timeline'

export function MyFeedbackList() {
  const user = useCurrentUser()
  const all = useAppState((s) => s.feedback)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<FeedbackStatus | 'all'>('all')

  const mine = useMemo(
    () => all.filter((f) => f.userId === user?.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [all, user?.id],
  )
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return mine
      .filter((f) => status === 'all' || f.status === status)
      .filter((f) => !q || [f.ref, f.title, f.location].some((t) => t.toLowerCase().includes(q)))
  }, [mine, query, status])

  const unread = mine.filter((f) => f.unreadByUser).length

  if (!mine.length) {
    return (
      <EmptyState
        icon={<Inbox className="size-5" />}
        title="No submissions yet"
        description="When you submit feedback, you can track its progress here."
        action={
          <Link href="/feedback/new" className={buttonVariants({ size: 'lg' })}>
            Submit feedback
          </Link>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Total', value: mine.length },
          { label: 'Open', value: mine.filter((f) => f.status !== 'Resolved').length },
          { label: 'Resolved', value: mine.filter((f) => f.status === 'Resolved').length },
          { label: 'New updates', value: unread, highlight: unread > 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <dt className="text-xs font-medium text-muted-foreground">{s.label}</dt>
            <dd className={s.highlight ? 'text-2xl font-bold text-warning' : 'text-2xl font-bold text-foreground'}>
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="mf-search" className="sr-only">
          Search by reference, title or location
        </label>
        <Input
          id="mf-search"
          type="search"
          placeholder="Search by reference number, title or location"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label htmlFor="mf-status" className="sr-only">
          Filter by status
        </label>
        <Select
          id="mf-status"
          className="sm:w-48"
          value={status}
          onChange={(e) => setStatus(e.target.value as FeedbackStatus | 'all')}
        >
          <option value="all">All statuses</option>
          {FEEDBACK_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </div>

      {list.length ? (
        <ul className="flex flex-col gap-3">
          {list.map((f) => {
            const resp = latestResponse(f)
            return (
              <li key={f.ref}>
                <Link
                  href={`/feedback/${f.ref}`}
                  className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-secondary/50"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">{f.ref}</span>
                      <FeedbackStatusBadge status={f.status} />
                      {f.unreadByUser && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-xs font-semibold text-warning-foreground">
                          <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                          New update
                        </span>
                      )}
                    </div>
                    <h2 className="text-pretty font-semibold text-foreground">{f.title}</h2>
                    <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{f.category}</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" aria-hidden="true" />
                        {f.location}
                      </span>
                      <span>Submitted {formatDate(f.submittedAt)}</span>
                    </p>
                    {resp?.message && (
                      <p className="line-clamp-2 flex gap-2 rounded-lg bg-secondary/5 p-2.5 text-sm text-foreground">
                        <MessageSquareText className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden="true" />
                        <span>
                          <span className="font-medium">Official response: </span>
                          {resp.message}
                        </span>
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState title="No matching submissions" description="Try a different search or status filter." />
      )}
    </div>
  )
}
