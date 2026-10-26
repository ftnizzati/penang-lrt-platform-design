'use client'

import { useHydrated } from '@/lib/store'
import type { ReactNode } from 'react'
import { PageSkeleton } from './page-header'

/** Data lives in browser storage, so render data-driven UI only after hydration. */
export function HydrationGate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const hydrated = useHydrated()
  return hydrated ? <>{children}</> : <>{fallback ?? <PageSkeleton />}</>
}
