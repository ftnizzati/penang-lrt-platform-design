'use client'

import { Field, Input, Select, Textarea } from '@/components/shared/form-fields'
import { Modal } from '@/components/shared/modal'
import { EmptyState, PageHeader } from '@/components/shared/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { relativeTime } from '@/lib/format'
import { createPost, isStaffRole, useAppState, useCurrentUser } from '@/lib/store'
import { FORUM_CATEGORIES, type ForumCategory } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Flag, MessageCircle, MessagesSquare, PenSquare, ShieldCheck, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

function NewPostForm({ onDone }: { onDone: (id: string) => void }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<ForumCategory | ''>('')
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (title.trim().length < 8) next.title = 'Title must be at least 8 characters.'
    if (!category) next.category = 'Please choose a category.'
    if (body.trim().length < 20) next.body = 'Please write at least 20 characters.'
    setErrors(next)
    if (Object.keys(next).length) return
    try {
      const id = createPost({ title: title.trim(), category: category as ForumCategory, body: body.trim() })
      toast.success('Your discussion has been posted.')
      onDone(id)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field id="p-title" label="Title" required error={errors.title}>
        <Input id="p-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field id="p-cat" label="Category" required error={errors.category}>
        <Select id="p-cat" value={category} onChange={(e) => setCategory(e.target.value as ForumCategory)}>
          <option value="">Select a category</option>
          {FORUM_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </Field>
      <Field
        id="p-body"
        label="Message"
        required
        error={errors.body}
        hint="Be respectful. For private complaints, use Submit Feedback instead."
      >
        <Textarea id="p-body" rows={6} value={body} maxLength={2000} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="submit" size="lg">
          Post discussion
        </Button>
      </div>
    </form>
  )
}

export function ForumList() {
  const router = useRouter()
  const forum = useAppState((s) => s.forum)
  const user = useCurrentUser()
  const staff = isStaffRole(user?.role)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ForumCategory | 'all'>('all')
  const [open, setOpen] = useState(false)

  const posts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return forum
      .filter((p) => staff || !p.hidden)
      .filter((p) => category === 'all' || p.category === category)
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q))
      .map((p) => {
        const visibleReplies = p.replies.filter((r) => staff || !r.hidden)
        const last = visibleReplies.at(-1)?.createdAt ?? p.createdAt
        return { ...p, replyCount: visibleReplies.length, last, hasOfficial: visibleReplies.some((r) => r.official) }
      })
      .sort((a, b) => b.last.localeCompare(a.last))
  }, [forum, query, category, staff])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Community"
        title="Community forum"
        description="Discuss the works with neighbours, commuters and local businesses. Project staff replies are marked as official."
        actions={
          user ? (
            <Button size="lg" onClick={() => setOpen(true)}>
              <PenSquare />
              New discussion
            </Button>
          ) : (
            <Link href="/login?next=/forum" className={buttonVariants({ size: 'lg' })}>
              Log in to post
            </Link>
          )
        }
      />

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/60 p-4 text-sm">
        <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-muted-foreground">
          <strong className="font-semibold text-foreground">Public discussion, not official information.</strong> Posts
          reflect the views of community members. For confirmed closures and schedules, see{' '}
          <Link href="/announcements" className="font-medium text-secondary underline">
            official announcements
          </Link>
          .
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
          {(['all', ...FORUM_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                category === c && 'border-primary bg-primary text-primary-foreground hover:text-primary-foreground',
              )}
            >
              {c === 'all' ? 'All topics' : c}
            </button>
          ))}
        </div>
        <div className="md:w-72">
          <label htmlFor="f-search" className="sr-only">
            Search discussions
          </label>
          <Input
            id="f-search"
            type="search"
            placeholder="Search discussions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {posts.length ? (
        <ul className="flex flex-col gap-3">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/forum/${p.id}`}
                className={cn(
                  'flex flex-col gap-2 rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-secondary/50 sm:flex-row sm:items-center sm:justify-between',
                  p.hidden && 'opacity-60',
                )}
              >
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                      {p.category}
                    </span>
                    {p.hasOfficial && (
                      <span className="inline-flex items-center gap-1 font-medium text-secondary">
                        <ShieldCheck className="size-3.5" aria-hidden="true" />
                        Staff replied
                      </span>
                    )}
                    {staff && p.reported && (
                      <span className="inline-flex items-center gap-1 font-medium text-destructive">
                        <Flag className="size-3" aria-hidden="true" />
                        Reported
                      </span>
                    )}
                    {staff && p.hidden && <span className="font-medium text-muted-foreground">Hidden</span>}
                  </div>
                  <h2 className="text-pretty font-semibold text-foreground">{p.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    Started by {p.authorName} · {relativeTime(p.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="size-4" aria-hidden="true" />
                    <span className="tabular-nums">{p.replyCount}</span>
                    <span className="sr-only">replies</span>
                  </span>
                  <span>Active {relativeTime(p.last)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<MessagesSquare className="size-5" />}
          title="No discussions found"
          description="Try another topic or keyword, or start a new discussion."
        />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Start a discussion" description="Visible to all visitors.">
        {open && (
          <NewPostForm
            onDone={(id) => {
              setOpen(false)
              router.push(`/forum/${id}`)
            }}
          />
        )}
      </Modal>
    </div>
  )
}
