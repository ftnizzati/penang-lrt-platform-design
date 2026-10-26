import { CategoryBadge } from '@/components/shared/badges'
import { formatDate } from '@/lib/format'
import type { Announcement } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CalendarDays, MapPin, Megaphone, TriangleAlert } from 'lucide-react'

export function AnnouncementCard({ a, compact }: { a: Announcement; compact?: boolean }) {
  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-xs',
        a.urgent ? 'border-warning border-l-4' : 'border-border',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {a.urgent && (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-xs font-bold text-warning-foreground">
            <TriangleAlert className="size-3" aria-hidden="true" />
            Urgent
          </span>
        )}
        <CategoryBadge category={a.category} />
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
          <Megaphone className="size-3" aria-hidden="true" />
          Official
        </span>
      </div>
      <h3 className="text-pretty font-semibold leading-snug text-foreground">{a.title}</h3>
      {!compact && <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{a.description}</p>}
      <dl className="mt-auto grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
        <div className="flex items-start gap-1.5">
          <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Location</dt>
          <dd>{a.location}</dd>
        </div>
        <div className="flex items-start gap-1.5">
          <CalendarDays className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <dt className="sr-only">Published</dt>
          <dd>
            <time dateTime={a.publishedAt}>{formatDate(a.publishedAt)}</time>
          </dd>
        </div>
        {!compact && (
          <div className="sm:col-span-2">
            <dt className="inline font-medium text-foreground">Affected area: </dt>
            <dd className="inline">{a.affectedArea}</dd>
          </div>
        )}
      </dl>
    </article>
  )
}
