'use client'

import 'leaflet/dist/leaflet.css'

import { formatRange, periodStatus } from '@/lib/format'
import { MAP_CENTER, MAP_ZOOM, SAMPLE_ALIGNMENT } from '@/lib/sample-data'
import type { Announcement, Zone } from '@/lib/types'
import { ZONE_META } from '@/lib/zone-meta'
import L from 'leaflet'
import Link from 'next/link'
import { useEffect, useMemo, useRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'

function makeIcon(zone: Zone, selected: boolean) {
  const meta = ZONE_META[zone.type]
  const Icon = meta.icon
  const svg = renderToStaticMarkup(<Icon size={16} color="#ffffff" strokeWidth={2.25} />)
  const size = selected ? 40 : 32
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${meta.color};border:3px solid #fff;border-radius:9999px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(15,23,42,.35)">${svg}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

function Controller({ selected, resetKey }: { selected: Zone | null; resetKey: number }) {
  const map = useMap()
  useEffect(() => {
    if (selected) map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 15), { duration: 0.6 })
  }, [selected, map])
  useEffect(() => {
    if (resetKey) map.flyTo(MAP_CENTER, MAP_ZOOM, { duration: 0.6 })
  }, [resetKey, map])
  return null
}

export default function MapCanvas({
  zones,
  announcements,
  selectedId,
  onSelect,
  resetKey,
}: {
  zones: Zone[]
  announcements: Announcement[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  resetKey: number
}) {
  const markerRefs = useRef<Record<string, L.Marker | null>>({})
  const selected = zones.find((z) => z.id === selectedId) ?? null

  useEffect(() => {
    if (selectedId) {
      const t = setTimeout(() => markerRefs.current[selectedId]?.openPopup(), 650)
      return () => clearTimeout(t)
    }
  }, [selectedId])

  const announcementById = useMemo(
    () => new Map(announcements.filter((a) => a.status === 'Published').map((a) => [a.id, a])),
    [announcements],
  )

  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      scrollWheelZoom
      className="size-full"
      aria-label="Interactive map of sample construction locations along the Mutiara Line"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline
        positions={SAMPLE_ALIGNMENT}
        pathOptions={{ color: '#1e3a6e', weight: 4, opacity: 0.55, dashArray: '8 8' }}
      />
      {zones.map((z) => {
        const meta = ZONE_META[z.type]
        const related = z.announcementIds.map((id) => announcementById.get(id)).filter(Boolean) as Announcement[]
        return (
          <Marker
            key={z.id}
            position={[z.lat, z.lng]}
            icon={makeIcon(z, z.id === selectedId)}
            title={z.name}
            alt={`${meta.label}: ${z.name}`}
            ref={(m) => {
              markerRefs.current[z.id] = m
            }}
            eventHandlers={{ click: () => onSelect(z.id) }}
          >
            <Popup maxWidth={300}>
              <div className="flex flex-col gap-1.5 font-sans">
                <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: meta.color }}>
                  {meta.label} · {periodStatus(z)}
                </span>
                <strong className="text-sm leading-snug text-foreground">{z.name}</strong>
                <span className="text-xs text-muted-foreground">{z.area}</span>
                <span className="text-xs text-foreground">{z.description}</span>
                <span className="text-xs text-foreground">
                  <b>Dates:</b> {formatRange(z.startDate, z.endDate)}
                </span>
                {z.alternativeRoute && (
                  <span className="text-xs text-foreground">
                    <b>Alternative route:</b> {z.alternativeRoute}
                  </span>
                )}
                {related.length > 0 && (
                  <span className="flex flex-col gap-0.5 border-t border-border pt-1.5 text-xs">
                    <b className="text-foreground">Related announcements</b>
                    {related.map((a) => (
                      <Link key={a.id} href={`/announcements?q=${encodeURIComponent(a.title)}`}>
                        {a.title}
                      </Link>
                    ))}
                  </span>
                )}
                <span className="text-[10px] italic text-muted-foreground">Sample data — not official information</span>
              </div>
            </Popup>
          </Marker>
        )
      })}
      <Controller selected={selected} resetKey={resetKey} />
    </MapContainer>
  )
}
