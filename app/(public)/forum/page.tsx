import { ForumList } from '@/components/forum/forum-list'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Community Forum' }

export default function ForumPage() {
  return <ForumList />
}
