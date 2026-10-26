export type Role = 'community' | 'staff' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  role: Role
  phone?: string
  area?: string
  active: boolean
  createdAt: string
}

export type PublicUser = Omit<User, 'passwordHash'>

export const ANNOUNCEMENT_CATEGORIES = [
  'General Announcement',
  'Construction Schedule',
  'Road Closure',
  'Pedestrian Access',
  'Business Access',
] as const
export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number]

export interface Announcement {
  id: string
  title: string
  category: AnnouncementCategory
  location: string
  affectedArea: string
  description: string
  publishedAt: string
  updatedAt: string
  status: 'Published' | 'Draft'
  urgent: boolean
}

export interface Activity {
  id: string
  title: string
  location: string
  roads: string
  startDate: string
  endDate: string
  timeWindow: string
  description: string
}

export type ActivityStatus = 'Upcoming' | 'Ongoing' | 'Completed'

export const ZONE_TYPES = ['construction', 'road-closure', 'pedestrian', 'business'] as const
export type ZoneType = (typeof ZONE_TYPES)[number]

export interface Zone {
  id: string
  name: string
  type: ZoneType
  area: string
  lat: number
  lng: number
  description: string
  startDate: string
  endDate: string
  alternativeRoute?: string
  announcementIds: string[]
}

export const FORUM_CATEGORIES = [
  'Traffic & Routes',
  'Noise & Environment',
  'Local Businesses',
  'Safety',
  'General Discussion',
] as const
export type ForumCategory = (typeof FORUM_CATEGORIES)[number]

export interface ForumReply {
  id: string
  authorId: string
  authorName: string
  body: string
  createdAt: string
  official: boolean
  reported: boolean
  hidden: boolean
}

export interface ForumPost {
  id: string
  title: string
  category: ForumCategory
  authorId: string
  authorName: string
  body: string
  createdAt: string
  replies: ForumReply[]
  reported: boolean
  hidden: boolean
}

export const FEEDBACK_CATEGORIES = [
  'Road Closure',
  'Pedestrian Access',
  'Construction Noise',
  'Safety Concern',
  'Business Access',
  'Construction Schedule',
  'General Inquiry',
  'Other',
] as const
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]

export const FEEDBACK_STATUSES = ['Received', 'Under Review', 'In Progress', 'Resolved'] as const
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]

export interface TimelineEvent {
  id: string
  type: 'submitted' | 'status' | 'response' | 'assigned'
  at: string
  by: string
  status?: FeedbackStatus
  message?: string
}

export interface Feedback {
  ref: string
  userId: string
  userName: string
  title: string
  category: FeedbackCategory
  location: string
  description: string
  photo?: string
  incidentDate: string
  submittedAt: string
  status: FeedbackStatus
  assignedTo?: string
  timeline: TimelineEvent[]
  unreadByUser: boolean
}

export interface AppState {
  version: number
  users: User[]
  announcements: Announcement[]
  activities: Activity[]
  zones: Zone[]
  forum: ForumPost[]
  feedback: Feedback[]
  feedbackSeq: number
  currentUserId: string | null
}
