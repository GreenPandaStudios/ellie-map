import { useDeferredValue, useEffect, useState } from 'react';
import type { LatLngBoundsExpression } from 'leaflet';
import { CircleMarker, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { PinEntry } from '../features/pins/pinsSlice';
import { configureLeafletIcon } from '../lib/leafletIcon';
import {
  getWisconsinLocationSubtitle,
  loadWisconsinLocationDataset,
  searchWisconsinLocations,
  type WisconsinLocation,
  type WisconsinLocationDataset,
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
  const [locationDataset, setLocationDataset] = useState<WisconsinLocationDataset | null>(null);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationLoadError, setLocationLoadError] = useState('');
  const deferredSearchValue = useDeferredValue(searchValue);

  const searchResults = locationDataset ? searchWisconsinLocations(locationDataset.locations, deferredSearchValue) : [];
  const hasSearchQuery = searchValue.trim().length > 0;
  const showSearchResults = isSearchOpen && (searchResults.length > 0 || hasSearchQuery || Boolean(locationLoadError));

  const helperText = locationDataset
    ? `Search ${locationDataset.counts.total.toLocaleString()} Wisconsin locations from the official GNIS and DNR indexes.`
    : isLoadingLocations
      ? 'Loading the official Wisconsin place index...'
      : 'Search every current Wisconsin location in the official GNIS and DNR indexes.';

  function ensureLocationDataset() {
    if (locationDataset || isLoadingLocations) {
      return;
    }

    setIsLoadingLocations(true);
    setLocationLoadError('');

    void loadWisconsinLocationDataset()
      .then((dataset) => {
        setLocationDataset(dataset);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'The Wisconsin location index could not be loaded.';
        setLocationLoadError(message);
      })
      .finally(() => {
        setIsLoadingLocations(false);
      });
  }

  function handlePlaceSelect(location: WisconsinLocation) {
    setSearchValue(location.name);
    setSearchTarget({ ...location });
    setIsSearchOpen(false);
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    ensureLocationDataset();

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
                ensureLocationDataset();
              }}
              onFocus={() => {
                setIsSearchOpen(true);
                ensureLocationDataset();
              }}
              onBlur={() => setIsSearchOpen(false)}
            />
            <button
              className="primary-button map-search-submit"
              type="submit"
              disabled={isLoadingLocations || Boolean(locationLoadError) || searchResults.length === 0}
            >
              Go
            </button>
            {searchValue || searchTarget ? (
              <button className="ghost-button map-search-clear" type="button" onClick={handleSearchClear}>
                Clear
              </button>
            ) : null}
          </div>
          <p className="map-search-helper">{helperText}</p>
          {showSearchResults ? (
            <div className="map-search-results" role="listbox" aria-label="Wisconsin location search results">
              {isLoadingLocations && !locationDataset ? (
                <p className="map-search-empty">Loading official Wisconsin location data...</p>
              ) : locationLoadError ? (
                <p className="map-search-empty map-search-error">{locationLoadError}</p>
              ) : searchResults.length > 0 ? (
                searchResults.map((location) => (
                  <button
                    key={location.id}
                    className="map-search-result"
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handlePlaceSelect(location)}
                  >
                    <span className={`map-search-source map-search-source-${location.source.toLowerCase()}`}>{location.source}</span>
                    <span className="map-search-result-copy">
                      <strong>{location.name}</strong>
                      <span>{getWisconsinLocationSubtitle(location)}</span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="map-search-empty">No matching Wisconsin location found.</p>
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
