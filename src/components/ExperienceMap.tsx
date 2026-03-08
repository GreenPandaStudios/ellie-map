import { useEffect, useState } from 'react';
import type { LatLngBoundsExpression } from 'leaflet';
import { CircleMarker, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { PinEntry } from '../features/pins/pinsSlice';
import { configureLeafletIcon } from '../lib/leafletIcon';
import {
  getWisconsinLocationKindLabel,
  searchWisconsinLocations,
  wisconsinLocations,
  type WisconsinLocation,
} from '../lib/wisconsinLocations';

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

const wisconsinCityCount = wisconsinLocations.filter((location) => location.kind === 'city').length;
const wisconsinStateParkCount = wisconsinLocations.length - wisconsinCityCount;

function MapClickHandler({ onMapClick }: Pick<ExperienceMapProps, 'onMapClick'>) {
  useMapEvents({
    click(event) {
      onMapClick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}

function MapSearchFocusController({ target }: { target: WisconsinLocation | null }) {
  const map = useMap();

  useEffect(() => {
    if (!target) {
      return;
    }

    map.flyTo([target.lat, target.lng], target.zoom, {
      duration: 1.2,
    });
  }, [map, target]);

  if (!target) {
    return null;
  }

  return (
    <CircleMarker
      center={[target.lat, target.lng]}
      radius={11}
      interactive={false}
      pathOptions={{
        color: '#17523a',
        weight: 3,
        fillColor: '#f0b445',
        fillOpacity: 0.42,
      }}
    />
  );
}

export function ExperienceMap({
  entries,
  selectedPinId,
  onMapClick,
  onPinSelect,
}: ExperienceMapProps) {
  const [searchValue, setSearchValue] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTarget, setSearchTarget] = useState<WisconsinLocation | null>(null);

  const searchResults = searchWisconsinLocations(searchValue);
  const showSearchResults = isSearchOpen && (searchResults.length > 0 || searchValue.trim().length > 0);

  function handlePlaceSelect(location: WisconsinLocation) {
    setSearchValue(location.name);
    setSearchTarget({ ...location });
    setIsSearchOpen(false);
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (searchResults[0]) {
      handlePlaceSelect(searchResults[0]);
    }
  }

  function handleSearchClear() {
    setSearchValue('');
    setSearchTarget(null);
    setIsSearchOpen(false);
  }

  return (
    <div className="map-shell">
      <MapContainer bounds={wisconsinBounds} className="map" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={onMapClick} />
        <MapSearchFocusController target={searchTarget} />
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
      <div className="map-search-card">
        <form className="map-search-form" onSubmit={handleSearchSubmit}>
          <label className="map-search-label" htmlFor="wisconsin-place-search">
            Jump to a Wisconsin city or state park
          </label>
          <div className="map-search-row">
            <input
              id="wisconsin-place-search"
              className="map-search-input"
              type="search"
              value={searchValue}
              placeholder="Search Madison, Devil's Lake, Bayfield..."
              autoComplete="off"
              onChange={(event) => {
                setSearchValue(event.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onBlur={() => setIsSearchOpen(false)}
            />
            <button className="primary-button map-search-submit" type="submit" disabled={searchResults.length === 0}>
              Go
            </button>
            {searchValue || searchTarget ? (
              <button className="ghost-button map-search-clear" type="button" onClick={handleSearchClear}>
                Clear
              </button>
            ) : null}
          </div>
          <p className="map-search-helper">
            Search {wisconsinCityCount} cities and {wisconsinStateParkCount} state parks without leaving the map.
          </p>
          {showSearchResults ? (
            <div className="map-search-results" role="listbox" aria-label="Wisconsin location search results">
              {searchResults.length > 0 ? (
                searchResults.map((location) => (
                  <button
                    key={location.id}
                    className="map-search-result"
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handlePlaceSelect(location)}
                  >
                    <span className={`map-search-kind map-search-kind-${location.kind}`}>{getWisconsinLocationKindLabel(location.kind)}</span>
                    <span className="map-search-result-copy">
                      <strong>{location.name}</strong>
                      <span>{location.region}</span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="map-search-empty">No matching Wisconsin city or state park found.</p>
              )}
            </div>
          ) : null}
        </form>
      </div>
      <div className="map-overlay">
        <span>Click anywhere in Wisconsin to create a pin and open its full-screen post.</span>
      </div>
    </div>
  );
}
