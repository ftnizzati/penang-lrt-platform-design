'use client'

import { ActivityStatusBadge } from '@/components/shared/badges'
import { Input } from '@/components/shared/form-fields'
import { EmptyState } from '@/components/shared/page-header'
import { formatDate, formatRange, periodStatus } from '@/lib/format'
import { useAppState } from '@/lib/store'
import type { Activity, ActivityStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CalendarX2, Clock, MapPin, Route } from 'lucide-react'
import { useMemo, useState } from 'react'

const TABS: (ActivityStatus | 'All')[] = ['All', 'Ongoing', 'Upcoming', 'Completed']

function monthKey(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })
}

function ActivityRow({ a }: { a: Activity }) {
  const status = periodStatus(a)
  const start = new Date(`${a.startDate}T00:00:00`)
  return (
    <li
      className={cn(
        'grid gap-4 rounded-xl border border-border bg-card p-5 shadow-xs sm:grid-cols-[4.5rem_1fr]',
        status === 'Ongoing' && 'border-l-4 border-l-warning',
        status === 'Completed' && 'opacity-75',
      )}
    >
      <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          {start.toLocaleDateString('en-MY', { month: 'short' })}
        </span>
        <span className="text-3xl font-bold leading-none tabular-nums text-primary">{start.getDate()}</span>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-foreground">{a.title}</h3>
          <ActivityStatusBadge status={status} />
        </div>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{a.description}</p>
        <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <dt className="sr-only">Dates and times</dt>
            <dd className="text-foreground">
              {formatRange(a.startDate, a.endDate)}
              <span className="block text-xs text-muted-foreground">{a.timeWindow}</span>
            </dd>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <dt className="sr-only">Location</dt>
            <dd className="text-foreground">{a.location}</dd>
          </div>
          <div className="flex items-start gap-2 sm:col-span-2">
            <Route className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <dt className="sr-only">Affected roads</dt>
            <dd className="text-foreground">
              <span className="font-medium">Affected roads: </span>
              {a.roads}
            </dd>
          </div>
        </dl>
      </div>
    </li>
  )
}

export function ScheduleView() {
  const activities = useAppState((s) => s.activities)
  const [tab, setTab] = useState<(typeof TABS)[number]>('All')
  const [query, setQuery] = useState('')

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: activities.length, Ongoing: 0, Upcoming: 0, Completed: 0 }
    activities.forEach((a) => c[periodStatus(a)]++)
    return c
  }, [activities])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = activities
      .filter((a) => tab === 'All' || periodStatus(a) === tab)
      .filter((a) => !q || [a.title, a.location, a.roads].some((t) => t.toLowerCase().includes(q)))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
    const map = new Map<string, Activity[]>()
    list.forEach((a) => {
      const k = monthKey(a.startDate)
      map.set(k, [...(map.get(k) ?? []), a])
    })
    return [...map.entries()]
  }, [activities, tab, query])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                tab === t && 'bg-card text-foreground shadow-xs',
              )}
            >
              {t} <span className="tabular-nums text-muted-foreground">({counts[t]})</span>
            </button>
          ))}
        </div>
        <div className="md:w-72">
          <label htmlFor="s-search" className="sr-only">
            Search activities
          </label>
          <Input
            id="s-search"
            type="search"
            placeholder="Search road or location"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {groups.length ? (
        <div className="flex flex-col gap-8">
          {groups.map(([month, items]) => (
            <section key={month} aria-label={month} className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{month}</h2>
              <ol className="flex flex-col gap-3">
                {items.map((a) => (
                  <ActivityRow key={a.id} a={a} />
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarX2 className="size-5" />}
          title="No activities found"
          description={`There are no ${tab === 'All' ? '' : tab.toLowerCase() + ' '}activities matching your search.`}
        />
      )}
      <p className="text-xs text-muted-foreground">Schedule last generated {formatDate(new Date().toISOString())}. Sample data only.</p>
    </div>
  )
}
