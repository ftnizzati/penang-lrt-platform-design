'use client'

import { AnnouncementCard } from '@/components/announcements/announcement-card'
import { ActivityStatusBadge, SampleTag } from '@/components/shared/badges'
import { Card } from '@/components/shared/form-fields'
import { buttonVariants } from '@/components/ui/button'
import { formatRange, periodStatus } from '@/lib/format'
import { useAppState } from '@/lib/store'
import { ZONE_META } from '@/lib/zone-meta'
import type { Zone, ZoneType } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  CalendarClock,
  Clock,
  Construction,
  MapPinned,
  MessageSquareText,
  MessagesSquare,
  TriangleAlert,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, type ReactNode } from 'react'

function SectionHeading({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline">
        {linkLabel}
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  tone,
  href,
}: {
  label: string
  value: number
  icon: ReactNode
  tone: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-secondary/50"
    >
      <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg', tone)}>{icon}</span>
      <span className="flex flex-col">
        <span className="text-2xl font-bold tabular-nums text-foreground">{value}</span>
        <span className="text-sm text-muted-foreground group-hover:text-foreground">{label}</span>
      </span>
    </Link>
  )
}

function ZoneList({ zones, empty }: { zones: Zone[]; empty: string }) {
  if (!zones.length) return <p className="text-sm text-muted-foreground">{empty}</p>
  return (
    <ul className="flex flex-col divide-y divide-border">
      {zones.map((z) => {
        const status = periodStatus(z)
        return (
          <li key={z.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-foreground">{z.name}</p>
              <ActivityStatusBadge status={status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {z.area} · {formatRange(z.startDate, z.endDate)}
            </p>
            {z.alternativeRoute && (
              <p className="text-xs text-foreground">
                <span className="font-medium">Alternative: </span>
                {z.alternativeRoute}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function AlertPanel({ type, zones, empty }: { type: ZoneType; zones: Zone[]; empty: string }) {
  const meta = ZONE_META[type]
  const Icon = meta.icon
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2">
        <span
          className="flex size-8 items-center justify-center rounded-md text-white"
          style={{ backgroundColor: meta.color }}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <h3 className="font-semibold text-foreground">
          {type === 'road-closure'
            ? 'Road closures'
            : type === 'pedestrian'
              ? 'Pedestrian access alerts'
              : 'Business access updates'}
        </h3>
      </div>
      <ZoneList zones={zones} empty={empty} />
    </Card>
  )
}

export function HomeDashboard() {
  const announcements = useAppState((s) => s.announcements)
  const activities = useAppState((s) => s.activities)
  const zones = useAppState((s) => s.zones)

  const data = useMemo(() => {
    const published = announcements
      .filter((a) => a.status === 'Published')
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    const notDone = zones.filter((z) => periodStatus(z) !== 'Completed')
    const byType = (t: ZoneType) =>
      notDone.filter((z) => z.type === t).sort((a, b) => a.startDate.localeCompare(b.startDate))
    const scheduled = activities
      .filter((a) => periodStatus(a) !== 'Completed')
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
    return {
      urgent: published.filter((a) => a.urgent),
      latest: published.slice(0, 4),
      activeConstruction: zones.filter((z) => z.type === 'construction' && periodStatus(z) === 'Ongoing').length,
      currentClosures: zones.filter((z) => z.type === 'road-closure' && periodStatus(z) === 'Ongoing').length,
      upcomingCount: activities.filter((a) => periodStatus(a) === 'Upcoming').length,
      scheduled: scheduled.slice(0, 5),
      closures: byType('road-closure'),
      pedestrian: byType('pedestrian'),
      business: byType('business'),
    }
  }, [announcements, activities, zones])

  return (
    <div className="flex flex-col gap-10">
      <section className="grid gap-6 rounded-2xl border border-border bg-card p-6 shadow-xs md:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Penang LRT Mutiara Line</p>
            <SampleTag />
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Construction updates and community feedback, in one place
          </h1>
          <p className="max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Check road closures, pedestrian detours and business access around the Mutiara Line works, then tell the
            project team what is affecting you. Every report receives a reference number you can track.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/map" className={buttonVariants({ size: 'lg' })}>
              <MapPinned />
              Open construction map
            </Link>
            <Link href="/feedback/new" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              <MessageSquareText />
              Submit feedback
            </Link>
            <Link href="/forum" className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
              <MessagesSquare />
              Community forum
            </Link>
          </div>
        </div>
        <div className="grid gap-3">
          <StatCard
            label="Active construction zones"
            value={data.activeConstruction}
            icon={<Construction className="size-5" />}
            tone="bg-primary/10 text-primary"
            href="/map"
          />
          <StatCard
            label="Current road closures"
            value={data.currentClosures}
            icon={<TriangleAlert className="size-5" />}
            tone="bg-destructive/10 text-destructive"
            href="/map"
          />
          <StatCard
            label="Upcoming activities"
            value={data.upcomingCount}
            icon={<CalendarClock className="size-5" />}
            tone="bg-accent text-accent-foreground"
            href="/schedule"
          />
        </div>
      </section>

      {data.urgent.length > 0 && (
        <section aria-labelledby="urgent-heading" className="rounded-xl border border-warning bg-warning/15 p-5">
          <h2 id="urgent-heading" className="flex items-center gap-2 font-semibold text-warning-foreground">
            <TriangleAlert className="size-4" aria-hidden="true" />
            Urgent notices
          </h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {data.urgent.map((a) => (
              <li key={a.id} className="text-sm text-foreground">
                <Link href={`/announcements?q=${encodeURIComponent(a.title)}`} className="font-medium hover:underline">
                  {a.title}
                </Link>
                <span className="text-muted-foreground"> — {a.location}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="latest-heading" className="flex flex-col gap-4">
          <SectionHeading title="Latest announcements" href="/announcements" linkLabel="All announcements" />
          <div className="grid gap-4 md:grid-cols-2">
            {data.latest.map((a) => (
              <AnnouncementCard key={a.id} a={a} compact />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading title="Upcoming activities" href="/schedule" linkLabel="Full schedule" />
          <Card className="p-5">
            {data.scheduled.length ? (
              <ol className="flex flex-col gap-4">
                {data.scheduled.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Clock className="size-4" aria-hidden="true" />
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{a.title}</p>
                        <ActivityStatusBadge status={periodStatus(a)} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatRange(a.startDate, a.endDate)} · {a.timeWindow}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.location}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No scheduled activities.</p>
            )}
          </Card>
        </section>
      </div>

      <section className="flex flex-col gap-4">
        <SectionHeading title="Access and closure alerts" href="/map" linkLabel="View on map" />
        <div className="grid gap-4 lg:grid-cols-3">
          <AlertPanel type="road-closure" zones={data.closures} empty="No current or upcoming road closures." />
          <AlertPanel type="pedestrian" zones={data.pedestrian} empty="No pedestrian access changes." />
          <AlertPanel type="business" zones={data.business} empty="No business access changes." />
        </div>
      </section>
    </div>
  )
}
