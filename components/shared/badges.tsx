import { cn } from '@/lib/utils'
import { ZONE_META } from '@/lib/zone-meta'
import type { ActivityStatus, AnnouncementCategory, FeedbackStatus, ZoneType } from '@/lib/types'
import type { ReactNode } from 'react'

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        className,
      )}
    >
      {children}
    </span>
  )
}

const FEEDBACK_STYLES: Record<FeedbackStatus, string> = {
  Received: 'bg-muted text-foreground ring-1 ring-border',
  'Under Review': 'bg-warning/25 text-warning-foreground',
  'In Progress': 'bg-primary/10 text-primary',
  Resolved: 'bg-success/15 text-success',
}

export function FeedbackStatusBadge({ status }: { status: FeedbackStatus }) {
  return <Badge className={FEEDBACK_STYLES[status]}>{status}</Badge>
}

const ACTIVITY_STYLES: Record<ActivityStatus, string> = {
  Upcoming: 'bg-accent text-accent-foreground',
  Ongoing: 'bg-warning/25 text-warning-foreground',
  Completed: 'bg-muted text-muted-foreground',
}

export function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
  return (
    <Badge className={ACTIVITY_STYLES[status]}>
      {status === 'Ongoing' && <span className="size-1.5 rounded-full bg-warning-foreground" aria-hidden="true" />}
      {status}
    </Badge>
  )
}

const CATEGORY_STYLES: Record<AnnouncementCategory, string> = {
  'General Announcement': 'bg-primary/10 text-primary',
  'Construction Schedule': 'bg-accent text-accent-foreground',
  'Road Closure': 'bg-destructive/10 text-destructive',
  'Pedestrian Access': 'bg-secondary/15 text-accent-foreground',
  'Business Access': 'bg-warning/25 text-warning-foreground',
}

export function CategoryBadge({ category }: { category: AnnouncementCategory }) {
  return <Badge className={CATEGORY_STYLES[category]}>{category}</Badge>
}

export function ZoneTypeBadge({ type }: { type: ZoneType }) {
  const meta = ZONE_META[type]
  const Icon = meta.icon
  return (
    <Badge className={meta.badge}>
      <Icon className="size-3" aria-hidden="true" />
      {meta.label}
    </Badge>
  )
}

export function SampleTag({ className }: { className?: string }) {
  return (
    <Badge className={cn('border border-dashed border-muted-foreground/40 text-muted-foreground', className)}>
      Sample data
    </Badge>
  )
}
