import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const originIcon = L.divIcon({
  className: 'map-picker-marker map-picker-origin',
  html: '<span>A</span>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

const destIcon = L.divIcon({
  className: 'map-picker-marker map-picker-dest',
  html: '<span>B</span>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

interface MapPickerProps {
  origin: { lat: number; lng: number } | null
  destination: { lat: number; lng: number } | null
  onOriginClick: (lat: number, lng: number) => void
  onDestClick: (lat: number, lng: number) => void
  mode: 'origin' | 'destination'
  center: [number, number]
  zoom?: number
}

/**
 * Mapa con Leaflet puro (ref + useEffect) para evitar "Map container is already initialized"
 * con React 18 Strict Mode. react-leaflet inicializa en el ref y falla en el doble montaje.
 */
export default function MapPicker({
  origin,
  destination,
  onOriginClick,
  onDestClick,
  mode,
  center,
  zoom = 13,
}: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const originMarkerRef = useRef<L.Marker | null>(null)
  const destMarkerRef = useRef<L.Marker | null>(null)
  const callbacksRef = useRef({ mode, onOriginClick, onDestClick })
  callbacksRef.current = { mode, onOriginClick, onDestClick }

  // Crear mapa una vez que el div existe; limpieza en unmount.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Si el contenedor ya tiene un mapa (p. ej. por reutilización de DOM), no volver a crear.
    if ((el as unknown as { _leaflet_id?: number })._leaflet_id != null) return

    const map = L.map(el, { scrollWheelZoom: true }).setView(center, zoom)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { mode: m, onOriginClick: o, onDestClick: d } = callbacksRef.current
      if (m === 'origin') o(e.latlng.lat, e.latlng.lng)
      else d(e.latlng.lat, e.latlng.lng)
    })

    return () => {
      map.remove()
      mapRef.current = null
      originMarkerRef.current = null
      destMarkerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- solo crear/destruir una vez

  // Actualizar vista, marcadores y centro cuando cambian las props.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.setView(center, zoom)

    if (originMarkerRef.current) {
      map.removeLayer(originMarkerRef.current)
      originMarkerRef.current = null
    }
    if (origin) {
      const m = L.marker([origin.lat, origin.lng], { icon: originIcon }).addTo(map)
      m.bindPopup('Origen')
      originMarkerRef.current = m
    }

    if (destMarkerRef.current) {
      map.removeLayer(destMarkerRef.current)
      destMarkerRef.current = null
    }
    if (destination) {
      const m = L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(map)
      m.bindPopup('Destino')
      destMarkerRef.current = m
    }
  }, [center, zoom, origin, destination])

  return (
    <div className="map-picker-wrap">
      <div ref={containerRef} className="map-picker" />
      <p className="map-picker-hint">
        {mode === 'origin' ? 'Haz clic en el mapa para marcar el origen' : 'Haz clic en el mapa para marcar el destino'}
      </p>
    </div>
  )
}
