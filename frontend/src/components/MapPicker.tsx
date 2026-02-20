import { useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
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

function MapClickHandler({
  mode,
  onOriginClick,
  onDestClick,
}: {
  mode: 'origin' | 'destination'
  onOriginClick: (lat: number, lng: number) => void
  onDestClick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng
      if (mode === 'origin') onOriginClick(lat, lng)
      else onDestClick(lat, lng)
    },
  })
  return null
}

export default function MapPicker({
  origin,
  destination,
  onOriginClick,
  onDestClick,
  mode,
  center,
  zoom = 13,
}: MapPickerProps) {
  const handleOrigin = useCallback((lat: number, lng: number) => onOriginClick(lat, lng), [onOriginClick])
  const handleDest = useCallback((lat: number, lng: number) => onDestClick(lat, lng), [onDestClick])

  return (
    <div className="map-picker-wrap">
      <MapContainer center={center} zoom={zoom} className="map-picker" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler mode={mode} onOriginClick={handleOrigin} onDestClick={handleDest} />
        {origin && (
          <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
            <Popup>Origen</Popup>
          </Marker>
        )}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
            <Popup>Destino</Popup>
          </Marker>
        )}
      </MapContainer>
      <p className="map-picker-hint">
        {mode === 'origin' ? 'Haz clic en el mapa para marcar el origen' : 'Haz clic en el mapa para marcar el destino'}
      </p>
    </div>
  )
}
