import { Info } from 'lucide-react'
import Link from 'next/link'

export function SampleBanner() {
  return (
    <div className="bg-primary text-primary-foreground">
      <p className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-1.5 text-xs md:px-6">
        <Info className="size-3.5 shrink-0" aria-hidden="true" />
        <span>
          <strong className="font-semibold">Academic prototype.</strong> All announcements, closures, locations and
          feedback shown are sample data, not official project information.
        </span>
      </p>
    </div>
  )
}

const LINKS = [
  {
    heading: 'Information',
    items: [
      { href: '/announcements', label: 'Announcements' },
      { href: '/schedule', label: 'Construction schedule' },
      { href: '/map', label: 'Interactive map' },
    ],
  },
  {
    heading: 'Community',
    items: [
      { href: '/forum', label: 'Community forum' },
      { href: '/feedback/new', label: 'Submit feedback' },
      { href: '/feedback', label: 'Track submissions' },
    ],
  },
  {
    heading: 'Account',
    items: [
      { href: '/login', label: 'Log in' },
      { href: '/register', label: 'Register' },
      { href: '/profile', label: 'My profile' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
        <div className="flex flex-col gap-2">
          <p className="font-bold text-primary">Mutiara Line Community Portal</p>
          <p className="text-sm text-muted-foreground">
            A prototype platform for construction information and community feedback for the Penang LRT Mutiara Line.
          </p>
        </div>
        {LINKS.map((group) => (
          <div key={group.heading} className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-foreground">{group.heading}</p>
            <ul className="flex flex-col gap-1.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted-foreground md:px-6">
          University software development assignment. Not affiliated with any government agency or project delivery
          partner. Data is stored only in this browser.
        </p>
      </div>
    </footer>
  )
}
