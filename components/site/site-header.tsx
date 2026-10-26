'use client'

import { Button, buttonVariants } from '@/components/ui/button'
import { isStaffRole, logout, useAppState, useCurrentUser, useHydrated } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Bell, LayoutDashboard, LogOut, Menu, TrainFront, UserRound, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/announcements', label: 'Announcements' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/map', label: 'Map' },
  { href: '/forum', label: 'Forum' },
  { href: '/feedback/new', label: 'Submit Feedback' },
  { href: '/feedback', label: 'My Feedback' },
]

export function Logo({ inverted }: { inverted?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Mutiara Line Community Portal home">
      <span
        className={cn(
          'flex size-9 items-center justify-center rounded-lg',
          inverted ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-primary text-primary-foreground',
        )}
      >
        <TrainFront className="size-5" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className={cn('text-sm font-bold', inverted ? 'text-sidebar-accent-foreground' : 'text-primary')}>
          Mutiara Line
        </span>
        <span className={cn('text-xs', inverted ? 'text-sidebar-foreground/70' : 'text-muted-foreground')}>
          Community Portal
        </span>
      </span>
    </Link>
  )
}

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  if (href === '/feedback') return pathname === '/feedback' || /^\/feedback\/MUT/.test(pathname)
  return pathname.startsWith(href)
}

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const hydrated = useHydrated()
  const user = useCurrentUser()
  const feedback = useAppState((s) => s.feedback)
  const [open, setOpen] = useState(false)

  const unread = useMemo(
    () => (user ? feedback.filter((f) => f.userId === user.id && f.unreadByUser).length : 0),
    [feedback, user],
  )

  const handleLogout = () => {
    logout()
    toast.success('You have been logged out.')
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-0.5 xl:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                isActive(pathname, item.href) && 'bg-accent text-accent-foreground hover:bg-accent',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          {hydrated && user ? (
            <>
              <Link
                href="/feedback"
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon-lg' }), 'relative')}
                aria-label={unread ? `${unread} feedback updates` : 'No new feedback updates'}
              >
                <Bell />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {unread}
                  </span>
                )}
              </Link>
              {isStaffRole(user.role) && (
                <Link
                  href="/admin"
                  className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'hidden sm:inline-flex')}
                >
                  <LayoutDashboard />
                  Admin
                </Link>
              )}
              <Link
                href="/profile"
                className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'hidden sm:inline-flex')}
              >
                <UserRound />
                <span className="max-w-28 truncate">{user.name.split(' ')[0]}</span>
              </Link>
              <Button variant="ghost" size="icon-lg" onClick={handleLogout} aria-label="Log out" className="hidden sm:inline-flex">
                <LogOut />
              </Button>
            </>
          ) : (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
                Log in
              </Link>
              <Link href="/register" className={buttonVariants({ size: 'lg' })}>
                Register
              </Link>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon-lg"
            className="xl:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-border bg-card px-4 py-3 xl:hidden">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                  className={cn(
                    'block rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted',
                    isActive(pathname, item.href) && 'bg-accent text-accent-foreground',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            {user ? (
              <>
                <Link href="/profile" onClick={() => setOpen(false)} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                  <UserRound />
                  Profile
                </Link>
                {isStaffRole(user.role) && (
                  <Link href="/admin" onClick={() => setOpen(false)} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                    <LayoutDashboard />
                    Admin
                  </Link>
                )}
                <Button variant="ghost" size="lg" onClick={() => { setOpen(false); handleLogout() }}>
                  <LogOut />
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                  Log in
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className={buttonVariants({ size: 'lg' })}>
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
