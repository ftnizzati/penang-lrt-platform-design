'use client'

import { useSyncExternalStore } from 'react'
import { createSeed, STORE_VERSION } from './sample-data'
import type {
  Activity,
  Announcement,
  AppState,
  Feedback,
  FeedbackCategory,
  FeedbackStatus,
  ForumCategory,
  PublicUser,
  Role,
  TimelineEvent,
  User,
  Zone,
} from './types'

const STORAGE_KEY = 'mutiara-portal-state'

let state: AppState | null = null
let serverSeed: AppState | null = null
const listeners = new Set<() => void>()

function readStorage(): AppState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppState
    return parsed.version === STORE_VERSION ? parsed : null
  } catch {
    return null
  }
}

function getState(): AppState {
  if (!state) state = readStorage() ?? createSeed()
  return state
}

function getServerState(): AppState {
  if (!serverSeed) serverSeed = createSeed()
  return serverSeed
}

function emit() {
  listeners.forEach((l) => l())
}

export class StorageFullError extends Error {}

function setState(updater: (s: AppState) => AppState) {
  const next = updater(getState())
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    throw new StorageFullError('Browser storage is full. Try a smaller photo or reset the demo data.')
  }
  state = next
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      state = readStorage() ?? createSeed()
      emit()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** Select a stable slice of state. Selectors must not create new objects/arrays. */
export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getState()),
    () => selector(getServerState()),
  )
}

const noopSubscribe = () => () => {}
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}

export function toPublicUser(u: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = u
  return rest
}

export function useCurrentUser(): User | null {
  return useAppState((s) => s.users.find((u) => u.id === s.currentUserId && u.active) ?? null)
}

export function isStaffRole(role?: Role) {
  return role === 'staff' || role === 'admin'
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`
}

function now() {
  return new Date().toISOString()
}

function currentUser(): User | null {
  const s = getState()
  return s.users.find((u) => u.id === s.currentUserId && u.active) ?? null
}

function requireUser(): User {
  const u = currentUser()
  if (!u) throw new Error('You must be logged in to do that.')
  return u
}

function requireStaff(): User {
  const u = requireUser()
  if (!isStaffRole(u.role)) throw new Error('You are not authorised to perform this action.')
  return u
}

function requireAdmin(): User {
  const u = requireUser()
  if (u.role !== 'admin') throw new Error('Only administrators can manage accounts.')
  return u
}

async function hashPassword(email: string, password: string) {
  const data = new TextEncoder().encode(`mutiara:${email.toLowerCase()}:${password}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/* ---------------- Auth ---------------- */

export async function login(email: string, password: string) {
  const normalized = email.trim().toLowerCase()
  const user = getState().users.find((u) => u.email === normalized)
  const hash = await hashPassword(normalized, password)
  if (!user || user.passwordHash !== hash) throw new Error('Incorrect email or password.')
  if (!user.active) throw new Error('This account has been deactivated. Please contact the project team.')
  setState((s) => ({ ...s, currentUserId: user.id }))
  return user
}

export function logout() {
  setState((s) => ({ ...s, currentUserId: null }))
}

export async function register(input: {
  name: string
  email: string
  password: string
  phone?: string
  area?: string
}) {
  const email = input.email.trim().toLowerCase()
  if (getState().users.some((u) => u.email === email)) {
    throw new Error('An account with this email already exists.')
  }
  const user: User = {
    id: uid('u'),
    name: input.name.trim(),
    email,
    passwordHash: await hashPassword(email, input.password),
    role: 'community',
    phone: input.phone?.trim() || undefined,
    area: input.area?.trim() || undefined,
    active: true,
    createdAt: now(),
  }
  setState((s) => ({ ...s, users: [...s.users, user], currentUserId: user.id }))
  return user
}

export function updateProfile(patch: { name: string; phone?: string; area?: string }) {
  const me = requireUser()
  setState((s) => ({
    ...s,
    users: s.users.map((u) => (u.id === me.id ? { ...u, ...patch } : u)),
  }))
}

export async function changePassword(current: string, next: string) {
  const me = requireUser()
  if ((await hashPassword(me.email, current)) !== me.passwordHash) {
    throw new Error('Current password is incorrect.')
  }
  const passwordHash = await hashPassword(me.email, next)
  setState((s) => ({ ...s, users: s.users.map((u) => (u.id === me.id ? { ...u, passwordHash } : u)) }))
}

/* ---------------- Announcements ---------------- */

export type AnnouncementInput = Omit<Announcement, 'id' | 'publishedAt' | 'updatedAt'> & { id?: string }

export function saveAnnouncement(input: AnnouncementInput) {
  requireStaff()
  setState((s) => {
    if (input.id) {
      return {
        ...s,
        announcements: s.announcements.map((a) =>
          a.id === input.id
            ? {
                ...a,
                ...input,
                id: a.id,
                updatedAt: now(),
                publishedAt: a.status === 'Draft' && input.status === 'Published' ? now() : a.publishedAt,
              }
            : a,
        ),
      }
    }
    const a: Announcement = { ...input, id: uid('an'), publishedAt: now(), updatedAt: now() }
    return { ...s, announcements: [a, ...s.announcements] }
  })
}

export function toggleAnnouncementStatus(id: string) {
  requireStaff()
  setState((s) => ({
    ...s,
    announcements: s.announcements.map((a) =>
      a.id === id
        ? {
            ...a,
            status: a.status === 'Published' ? 'Draft' : 'Published',
            publishedAt: a.status === 'Draft' ? now() : a.publishedAt,
            updatedAt: now(),
          }
        : a,
    ),
  }))
}

export function deleteAnnouncement(id: string) {
  requireStaff()
  setState((s) => ({
    ...s,
    announcements: s.announcements.filter((a) => a.id !== id),
    zones: s.zones.map((z) => ({ ...z, announcementIds: z.announcementIds.filter((x) => x !== id) })),
  }))
}

/* ---------------- Activities & zones ---------------- */

export function saveActivity(input: Omit<Activity, 'id'> & { id?: string }) {
  requireStaff()
  setState((s) =>
    input.id
      ? { ...s, activities: s.activities.map((a) => (a.id === input.id ? { ...a, ...input, id: a.id } : a)) }
      : { ...s, activities: [...s.activities, { ...input, id: uid('ac') }] },
  )
}

export function deleteActivity(id: string) {
  requireStaff()
  setState((s) => ({ ...s, activities: s.activities.filter((a) => a.id !== id) }))
}

export function saveZone(input: Omit<Zone, 'id'> & { id?: string }) {
  requireStaff()
  setState((s) =>
    input.id
      ? { ...s, zones: s.zones.map((z) => (z.id === input.id ? { ...z, ...input, id: z.id } : z)) }
      : { ...s, zones: [...s.zones, { ...input, id: uid('z') }] },
  )
}

export function deleteZone(id: string) {
  requireStaff()
  setState((s) => ({ ...s, zones: s.zones.filter((z) => z.id !== id) }))
}

/* ---------------- Forum ---------------- */

export function createPost(input: { title: string; category: ForumCategory; body: string }) {
  const me = requireUser()
  const id = uid('f')
  setState((s) => ({
    ...s,
    forum: [
      {
        id,
        ...input,
        authorId: me.id,
        authorName: me.name,
        createdAt: now(),
        replies: [],
        reported: false,
        hidden: false,
      },
      ...s.forum,
    ],
  }))
  return id
}

export function addReply(postId: string, body: string) {
  const me = requireUser()
  setState((s) => ({
    ...s,
    forum: s.forum.map((p) =>
      p.id === postId
        ? {
            ...p,
            replies: [
              ...p.replies,
              {
                id: uid('r'),
                authorId: me.id,
                authorName: me.name,
                body,
                createdAt: now(),
                official: isStaffRole(me.role),
                reported: false,
                hidden: false,
              },
            ],
          }
        : p,
    ),
  }))
}

export function reportPost(postId: string, replyId?: string) {
  requireUser()
  setState((s) => ({
    ...s,
    forum: s.forum.map((p) => {
      if (p.id !== postId) return p
      if (!replyId) return { ...p, reported: true }
      return { ...p, replies: p.replies.map((r) => (r.id === replyId ? { ...r, reported: true } : r)) }
    }),
  }))
}

export function moderatePost(postId: string, action: 'hide' | 'show' | 'dismiss' | 'delete', replyId?: string) {
  requireStaff()
  setState((s) => {
    if (action === 'delete' && !replyId) return { ...s, forum: s.forum.filter((p) => p.id !== postId) }
    return {
      ...s,
      forum: s.forum.map((p) => {
        if (p.id !== postId) return p
        const apply = <T extends { hidden: boolean; reported: boolean }>(x: T): T =>
          action === 'hide'
            ? { ...x, hidden: true, reported: false }
            : action === 'show'
              ? { ...x, hidden: false }
              : { ...x, reported: false }
        if (!replyId) return apply(p)
        if (action === 'delete') return { ...p, replies: p.replies.filter((r) => r.id !== replyId) }
        return { ...p, replies: p.replies.map((r) => (r.id === replyId ? apply(r) : r)) }
      }),
    }
  })
}

/* ---------------- Feedback ---------------- */

export function submitFeedback(input: {
  title: string
  category: FeedbackCategory
  location: string
  description: string
  incidentDate: string
  photo?: string
}) {
  const me = requireUser()
  const s0 = getState()
  const seq = s0.feedbackSeq + 1
  const ref = `MUT-${new Date().getFullYear()}-${seq}`
  const submittedAt = now()
  const fb: Feedback = {
    ref,
    userId: me.id,
    userName: me.name,
    ...input,
    submittedAt,
    status: 'Received',
    unreadByUser: false,
    timeline: [{ id: uid('t'), type: 'submitted', at: submittedAt, by: me.name, status: 'Received' }],
  }
  setState((s) => ({ ...s, feedbackSeq: seq, feedback: [fb, ...s.feedback] }))
  return ref
}

function pushEvent(ref: string, event: Omit<TimelineEvent, 'id' | 'at'>, patch: Partial<Feedback> = {}) {
  setState((s) => ({
    ...s,
    feedback: s.feedback.map((f) =>
      f.ref === ref
        ? {
            ...f,
            ...patch,
            unreadByUser: event.type === 'assigned' ? f.unreadByUser : true,
            timeline: [...f.timeline, { ...event, id: uid('t'), at: now() }],
          }
        : f,
    ),
  }))
}

export function updateFeedbackStatus(ref: string, status: FeedbackStatus) {
  const me = requireStaff()
  pushEvent(ref, { type: 'status', by: me.name, status }, { status })
}

export function assignFeedback(ref: string, staffId: string) {
  const me = requireStaff()
  const staff = getState().users.find((u) => u.id === staffId)
  pushEvent(
    ref,
    { type: 'assigned', by: me.name, message: staff ? `Assigned to ${staff.name}` : 'Unassigned' },
    { assignedTo: staff?.id },
  )
}

export function respondToFeedback(ref: string, message: string, status?: FeedbackStatus) {
  const me = requireStaff()
  pushEvent(ref, { type: 'response', by: me.name, message, status }, status ? { status } : {})
}

export function markFeedbackRead(ref: string) {
  const me = currentUser()
  const fb = getState().feedback.find((f) => f.ref === ref)
  if (!me || !fb || fb.userId !== me.id || !fb.unreadByUser) return
  setState((s) => ({
    ...s,
    feedback: s.feedback.map((f) => (f.ref === ref ? { ...f, unreadByUser: false } : f)),
  }))
}

/* ---------------- User management ---------------- */

export async function createStaffAccount(input: { name: string; email: string; password: string; role: Role; area?: string }) {
  requireAdmin()
  const email = input.email.trim().toLowerCase()
  if (getState().users.some((u) => u.email === email)) throw new Error('An account with this email already exists.')
  const user: User = {
    id: uid('s'),
    name: input.name.trim(),
    email,
    passwordHash: await hashPassword(email, input.password),
    role: input.role,
    area: input.area?.trim() || undefined,
    active: true,
    createdAt: now(),
  }
  setState((s) => ({ ...s, users: [...s.users, user] }))
}

export function updateUserAccount(id: string, patch: { role?: Role; active?: boolean }) {
  const me = requireAdmin()
  if (id === me.id) throw new Error('You cannot change your own role or status.')
  setState((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }))
}

export function resetDemoData() {
  setState(() => createSeed())
}
