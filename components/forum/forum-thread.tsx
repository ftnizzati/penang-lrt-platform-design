'use client'

import { Field, Textarea } from '@/components/shared/form-fields'
import { EmptyState } from '@/components/shared/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { formatDateTime } from '@/lib/format'
import { addReply, isStaffRole, moderatePost, reportPost, useAppState, useCurrentUser } from '@/lib/store'
import type { ForumReply } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ArrowLeft, EyeOff, Eye, Flag, MessageSquareOff, ShieldCheck, Trash2, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

function run(fn: () => void, msg: string) {
  try {
    fn()
    toast.success(msg)
  } catch (e) {
    toast.error((e as Error).message)
  }
}

function ModTools({
  hidden,
  reported,
  onAction,
}: {
  hidden: boolean
  reported: boolean
  onAction: (a: 'hide' | 'show' | 'dismiss' | 'delete') => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md bg-muted p-1">
      <span className="px-1.5 text-xs font-medium text-muted-foreground">Moderation:</span>
      {reported && (
        <Button variant="ghost" size="xs" onClick={() => onAction('dismiss')}>
          <Check />
          Dismiss report
        </Button>
      )}
      {hidden ? (
        <Button variant="ghost" size="xs" onClick={() => onAction('show')}>
          <Eye />
          Restore
        </Button>
      ) : (
        <Button variant="ghost" size="xs" onClick={() => onAction('hide')}>
          <EyeOff />
          Hide
        </Button>
      )}
      <Button variant="ghost" size="xs" className="text-destructive" onClick={() => onAction('delete')}>
        <Trash2 />
        Delete
      </Button>
    </div>
  )
}

function Message({
  author,
  at,
  official,
  hidden,
  children,
  footer,
}: {
  author: string
  at: string
  official?: boolean
  hidden?: boolean
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-xs',
        official ? 'border-secondary/60 border-l-4 border-l-secondary' : 'border-border',
        hidden && 'opacity-60',
      )}
    >
      <header className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-foreground">{author}</span>
        {official && (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
            <ShieldCheck className="size-3" aria-hidden="true" />
            Official project staff
          </span>
        )}
        {hidden && <span className="text-xs font-medium text-muted-foreground">(hidden from public)</span>}
        <time dateTime={at} className="text-xs text-muted-foreground">
          {formatDateTime(at)}
        </time>
      </header>
      <div className="whitespace-pre-line text-pretty text-sm leading-relaxed text-foreground">{children}</div>
      {footer}
    </article>
  )
}

export function ForumThread({ id }: { id: string }) {
  const router = useRouter()
  const post = useAppState((s) => s.forum.find((p) => p.id === id))
  const user = useCurrentUser()
  const staff = isStaffRole(user?.role)
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')

  if (!post || (post.hidden && !staff)) {
    return (
      <EmptyState
        icon={<MessageSquareOff className="size-5" />}
        title="Discussion not found"
        description="It may have been removed by a moderator."
        action={
          <Link href="/forum" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Back to forum
          </Link>
        }
      />
    )
  }

  const replies = post.replies.filter((r) => staff || !r.hidden)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (reply.trim().length < 3) {
      setError('Reply must be at least 3 characters.')
      return
    }
    setError('')
    run(() => addReply(post.id, reply.trim()), 'Reply posted.')
    setReply('')
  }

  const reportFooter = (r?: ForumReply) => {
    const target = r ?? post
    if (!user) return null
    const isOwn = (r ? r.authorId : post.authorId) === user.id
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        {!staff && !isOwn ? (
          target.reported ? (
            <span className="text-xs text-muted-foreground">Reported — thank you, a moderator will review.</span>
          ) : (
            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground"
              onClick={() => run(() => reportPost(post.id, r?.id), 'Reported to moderators.')}
            >
              <Flag />
              Report
            </Button>
          )
        ) : (
          <span />
        )}
        {staff && (
          <ModTools
            hidden={target.hidden}
            reported={target.reported}
            onAction={(a) => {
              run(() => moderatePost(post.id, a, r?.id), a === 'delete' ? 'Removed.' : 'Moderation updated.')
              if (a === 'delete' && !r) router.push('/forum')
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/forum" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to forum
      </Link>
      <div className="flex flex-col gap-2">
        <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {post.category}
        </span>
        <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">{post.title}</h1>
        {staff && post.reported && (
          <p className="inline-flex items-center gap-1 text-sm font-medium text-destructive">
            <Flag className="size-3.5" aria-hidden="true" />
            This post has been reported by a community member.
          </p>
        )}
      </div>

      <Message author={post.authorName} at={post.createdAt} hidden={post.hidden} footer={reportFooter()}>
        {post.body}
      </Message>

      <section aria-labelledby="replies-heading" className="flex flex-col gap-3">
        <h2 id="replies-heading" className="text-sm font-semibold text-muted-foreground">
          {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
        </h2>
        {replies.map((r) => (
          <Message
            key={r.id}
            author={r.authorName}
            at={r.createdAt}
            official={r.official}
            hidden={r.hidden}
            footer={reportFooter(r)}
          >
            {staff && r.reported && (
              <span className="mb-2 flex items-center gap-1 text-xs font-medium text-destructive">
                <Flag className="size-3" aria-hidden="true" /> Reported
              </span>
            )}
            {r.body}
          </Message>
        ))}
      </section>

      {user ? (
        <form onSubmit={submit} noValidate className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-xs">
          <Field
            id="reply"
            label={staff ? 'Reply as official project staff' : 'Your reply'}
            error={error}
          >
            <Textarea id="reply" rows={4} value={reply} maxLength={2000} onChange={(e) => setReply(e.target.value)} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" size="lg">
              Post reply
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-5 text-center text-sm text-muted-foreground">
          <Link href={`/login?next=/forum/${post.id}`} className="font-medium text-secondary underline">
            Log in
          </Link>{' '}
          to join the discussion.
        </div>
      )}
    </div>
  )
}
