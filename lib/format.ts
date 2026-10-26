import type { Activity, ActivityStatus, Zone } from './types'

const LOCALE = 'en-MY'

export function formatDate(value: string) {
  const d = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value)
  return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatDate(value)
}

export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function periodStatus(item: Pick<Activity | Zone, 'startDate' | 'endDate'>): ActivityStatus {
  const today = todayISO()
  if (item.endDate < today) return 'Completed'
  if (item.startDate > today) return 'Upcoming'
  return 'Ongoing'
}

export function formatRange(start: string, end: string) {
  return start === end ? formatDate(start) : `${formatDate(start)} – ${formatDate(end)}`
}
