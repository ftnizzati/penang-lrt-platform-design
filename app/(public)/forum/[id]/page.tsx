import { ForumThread } from '@/components/forum/forum-thread'

export default async function ForumThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ForumThread id={id} />
}
