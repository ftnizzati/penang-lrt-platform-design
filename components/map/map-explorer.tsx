'use client'

import { ActivityStatusBadge, SampleTag } from '@/components/shared/badges'
import { Input } from '@/components/shared/form-fields'
import { Button } from '@/components/ui/button'
import { periodStatus } from '@/lib/format'
import { useAppState } from '@/lib/store'
import { ZONE_TYPES, type ZoneType } from '@/lib/types'
import { ZONE_META } from '@/lib/zone-meta'
import { cn } from '@/lib/utils'
import { LocateFixed, Search } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'

const MapCanvas = dynamic(() => import('./map-canvas'), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center bg-muted text-sm text-muted-foreground" role="status">
      Loading map…
    </div>
  ),
})

export function MapExplorer() {
  const zones = useAppState((s) => s.zones)
  const announcements = useAppState((s) => s.announcements)
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState<Record<ZoneType, boolean>>({
    construction: true,
    'road-closure': true,
    pedestrian: true,
    business: true,
  })
  const [hideCompleted, setHideCompleted] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return zones
      .filter((z) => visible[z.type])
      .filter((z) => !hideCompleted || periodStatus(z) !== 'Completed')
      .filter(
        (z) =>
          !q ||
          [z.name, z.area, z.description, z.alternativeRoute ?? ''].some((t) => t.toLowerCase().includes(q)),
      )
  }, [zones, visible, hideCompleted, query])

  const counts = useMemo(() => {
    const c = { construction: 0, 'road-closure': 0, pedestrian: 0, business: 0 } as Record<ZoneType, number>
    zones.forEach((z) => c[z.type]++)
    return c
  }, [zones])

  return (
    <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
      <aside className="flex flex-col gap-4 lg:max-h-[calc(100svh-12rem)] lg:min-h-[36rem]" aria-label="Map filters">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="relative">
            <label htmlFor="map-search" className="sr-only">
              Search roads, neighbourhoods or locations
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="map-search"
              type="search"
              placeholder="Search road or neighbourhood"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-foreground">Show on map</legend>
            {ZONE_TYPES.map((t) => {
              const meta = ZONE_META[t]
              const Icon = meta.icon
              return (
                <label
                  key={t}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={visible[t]}
                    onChange={(e) => setVisible((v) => ({ ...v, [t]: e.target.checked }))}
                    className="size-4 accent-primary"
                  />
                  <span
                    className="flex size-6 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: meta.color }}
                    aria-hidden="true"
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="flex-1 text-foreground">{meta.label}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{counts[t]}</span>
                </label>
              )
            })}
            <label className="mt-1 flex cursor-pointer items-center gap-3 border-t border-border px-1 pt-3 text-sm">
              <input
                type="checkbox"
                checked={hideCompleted}
                onChange={(e) => setHideCompleted(e.target.checked)}
                className="size-4 accent-primary"
              />
              <span className="text-foreground">Hide completed works</span>
            </label>
          </fieldset>

          <div className="flex items-center justify-between gap-2">
            <SampleTag />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedId(null)
                setResetKey((k) => k + 1)
              }}
            >
              <LocateFixed />
              Reset view
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card shadow-xs">
          <p className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground" aria-live="polite">
            {filtered.length} location{filtered.length === 1 ? '' : 's'}
          </p>
          {filtered.length ? (
            <ul className="max-h-80 flex-1 overflow-y-auto lg:max-h-none">
              {filtered.map((z) => {
                const meta = ZONE_META[z.type]
                return (
                  <li key={z.id} className="border-b border-border last:border-0">
                    <button
                      type="button"
                      onClick={() => setSelectedId(z.id)}
                      aria-pressed={selectedId === z.id}
                      className={cn(
                        'flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none',
                        selectedId === z.id && 'bg-accent hover:bg-accent',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: meta.color }}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium text-foreground">{z.name}</span>
                      </span>
                      <span className="flex items-center gap-2 pl-4.5">
                        <span className="text-xs text-muted-foreground">{meta.label} · {z.area}</span>
                        <ActivityStatusBadge status={periodStatus(z)} />
                      </span>
                      {z.alternativeRoute && (
                        <span className="pl-4.5 text-xs text-foreground">
                          <span className="font-medium">Alt. route: </span>
                          {z.alternativeRoute}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No locations match your search or filters.
            </p>
          )}
        </div>
      </aside>

      <div className="relative order-first h-[60svh] min-h-96 overflow-hidden rounded-xl border border-border shadow-xs lg:order-none lg:h-auto lg:min-h-[36rem]">
        <MapCanvas
          zones={filtered}
          announcements={announcements}
          selectedId={selectedId}
          onSelect={setSelectedId}
          resetKey={resetKey}
        />
        <div className="pointer-events-none absolute right-3 bottom-6 z-[400] rounded-lg border border-border bg-card/95 p-3 shadow-sm">
          <p className="mb-1.5 text-xs font-semibold text-foreground">Legend</p>
          <ul className="flex flex-col gap-1">
            {ZONE_TYPES.map((t) => (
              <li key={t} className="flex items-center gap-2 text-xs text-foreground">
                <span className="size-3 rounded-full" style={{ backgroundColor: ZONE_META[t].color }} aria-hidden="true" />
                {ZONE_META[t].label}
              </li>
            ))}
            <li className="flex items-center gap-2 text-xs text-foreground">
              <span className="h-0 w-3 border-t-2 border-dashed border-primary" aria-hidden="true" />
              Indicative alignment
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
