'use client'

import { buttonVariants } from '@/components/ui/button'
import { isStaffRole, useCurrentUser } from '@/lib/store'
import type { Role } from '@/lib/types'
import { LockKeyhole, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { EmptyState } from './page-header'

export function RequireAuth({ children, roles }: { children: ReactNode; roles?: 'staff' | Role[] }) {
  const user = useCurrentUser()
  const pathname = usePathname()

  if (!user) {
    return (
      <div className="py-10">
        <EmptyState
          icon={<LockKeyhole className="size-5" />}
          title="Please log in to continue"
          description="This page contains account-specific information and requires you to be logged in."
          action={
            <div className="flex gap-2">
              <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={buttonVariants({ size: 'lg' })}>
                Log in
              </Link>
              <Link href="/register" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                Create account
              </Link>
            </div>
          }
        />
      </div>
    )
  }

  const allowed =
    !roles || (roles === 'staff' ? isStaffRole(user.role) : (roles as Role[]).includes(user.role))

  if (!allowed) {
    return (
      <div className="py-10">
        <EmptyState
          icon={<ShieldAlert className="size-5" />}
          title="Access restricted"
          description="Your account does not have permission to view this page."
          action={
            <Link href="/" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              Back to home
            </Link>
          }
        />
      </div>
    )
  }

  return <>{children}</>
}
