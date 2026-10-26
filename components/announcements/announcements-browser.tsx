'use client'

import { Field, Input, Select } from '@/components/shared/form-fields'
import { EmptyState } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { useAppState } from '@/lib/store'
import { ANNOUNCEMENT_CATEGORIES } from '@/lib/types'
import { SearchX } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { AnnouncementCard } from './announcement-card'

type Sort = 'newest' | 'oldest' | 'urgent'

export function AnnouncementsBrowser() {
  const params = useSearchParams()
  const announcements = useAppState((s) => s.announcements)
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [category, setCategory] = useState(params.get('category') ?? 'all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sort, setSort] = useState<Sort>('newest')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return announcements
      .filter((a) => a.status === 'Published')
      .filter((a) => category === 'all' || a.category === category)
      .filter((a) => !from || a.publishedAt.slice(0, 10) >= from)
      .filter((a) => !to || a.publishedAt.slice(0, 10) <= to)
      .filter(
        (a) =>
          !q ||
          [a.title, a.location, a.affectedArea, a.description].some((t) => t.toLowerCase().includes(q)),
      )
      .sort((a, b) => {
        if (sort === 'urgent' && a.urgent !== b.urgent) return a.urgent ? -1 : 1
        return sort === 'oldest'
          ? a.publishedAt.localeCompare(b.publishedAt)
          : b.publishedAt.localeCompare(a.publishedAt)
      })
  }, [announcements, query, category, from, to, sort])

  const hasFilters = query || category !== 'all' || from || to
  const reset = () => {
    setQuery('')
    setCategory('all')
    setFrom('')
    setTo('')
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-[2fr_1.3fr_1fr_1fr_1fr]"
      >
        <Field id="a-search" label="Search">
          <Input
            id="a-search"
            type="search"
            placeholder="Road, area or keyword"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
        <Field id="a-category" label="Category">
          <Select id="a-category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {ANNOUNCEMENT_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field id="a-from" label="Published from">
          <Input id="a-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field id="a-to" label="Published to">
          <Input id="a-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Field id="a-sort" label="Sort by">
          <Select id="a-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="urgent">Urgent first</option>
          </Select>
        </Field>
      </form>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing <span className="font-semibold text-foreground">{results.length}</span> announcement
          {results.length === 1 ? '' : 's'}
        </p>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={reset}>
            Clear filters
          </Button>
        )}
      </div>

      {results.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((a) => (
            <AnnouncementCard key={a.id} a={a} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<SearchX className="size-5" />}
          title="No announcements match your filters"
          description="Try a different keyword, category or date range."
          action={
            <Button variant="outline" size="lg" onClick={reset}>
              Clear filters
            </Button>
          }
        />
      )}
    </div>
  )
}
