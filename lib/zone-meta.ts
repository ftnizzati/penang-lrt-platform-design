import { Construction, Footprints, Store, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ZoneType } from './types'

export const ZONE_META: Record<
  ZoneType,
  { label: string; color: string; icon: LucideIcon; badge: string }
> = {
  construction: {
    label: 'Construction zone',
    color: '#1e3a6e',
    icon: Construction,
    badge: 'bg-primary/10 text-primary',
  },
  'road-closure': {
    label: 'Road closure',
    color: '#c62f2f',
    icon: TriangleAlert,
    badge: 'bg-destructive/10 text-destructive',
  },
  pedestrian: {
    label: 'Pedestrian access',
    color: '#0f8a86',
    icon: Footprints,
    badge: 'bg-accent text-accent-foreground',
  },
  business: {
    label: 'Business access',
    color: '#c27a06',
    icon: Store,
    badge: 'bg-warning/25 text-warning-foreground',
  },
}
