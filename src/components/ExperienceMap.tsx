import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import type { PinEntry } from '../features/pins/pinsSlice';
import { configureLeafletIcon } from '../lib/leafletIcon';

configureLeafletIcon();

const wisconsinBounds: LatLngBoundsExpression = [
  [42.45, -92.95],
  [47.35, -86.65],
];

interface ExperienceMapProps {
  entries: PinEntry[];
  selectedPinId: string | null;
  onMapClick: (coords: { lat: number; lng: number }) => void;
  onPinSelect: (pinId: string) => void;
}

function MapClickHandler({ onMapClick }: Pick<ExperienceMapProps, 'onMapClick'>) {
  useMapEvents({
    click(event) {
      onMapClick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}

export function ExperienceMap({
  entries,
  selectedPinId,
  onMapClick,
  onPinSelect,
}: ExperienceMapProps) {
  return (
    <div className="map-shell">
      <MapContainer bounds={wisconsinBounds} className="map" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={onMapClick} />
        {entries.map((entry) => (
          <Marker
            key={entry.id}
            position={[entry.lat, entry.lng]}
            zIndexOffset={entry.id === selectedPinId ? 500 : 0}
            eventHandlers={{
              click: () => onPinSelect(entry.id),
            }}
          />
        ))}
      </MapContainer>
      <div className="map-overlay">
        <span>Click anywhere in Wisconsin to create a pin and open its full-screen post.</span>
      </div>
    </div>
  );
}
