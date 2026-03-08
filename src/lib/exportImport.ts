import type { PinEntry } from '../features/pins/pinsSlice';

const EXPORT_VERSION = 1;

interface PinsExportPayload {
  version: number;
  exportedAt: string;
  pins: PinEntry[];
}

function isPhotoRecord(value: unknown): value is PinEntry['photos'][number] {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const photo = value as Record<string, unknown>;
  return (
    typeof photo.id === 'string' &&
    typeof photo.name === 'string' &&
    typeof photo.dataUrl === 'string' &&
    photo.dataUrl.startsWith('data:image/')
  );
}

function isPinEntry(value: unknown): value is PinEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const pin = value as Record<string, unknown>;
  return (
    typeof pin.id === 'string' &&
    typeof pin.lat === 'number' &&
    Number.isFinite(pin.lat) &&
    typeof pin.lng === 'number' &&
    Number.isFinite(pin.lng) &&
    typeof pin.title === 'string' &&
    typeof pin.notes === 'string' &&
    Array.isArray(pin.photos) &&
    pin.photos.every(isPhotoRecord) &&
    typeof pin.createdAt === 'string' &&
    typeof pin.updatedAt === 'string'
  );
}

export function buildExportPayload(pins: PinEntry[]): PinsExportPayload {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    pins,
  };
}

export function downloadPins(pins: PinEntry[]) {
  const payload = buildExportPayload(pins);
  const fileName = `wisconsin-memory-map-${payload.exportedAt.slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseImportedPins(fileContents: string): PinEntry[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(fileContents);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('The import file format is not supported.');
  }

  const payload = parsed as Record<string, unknown>;

  if (payload.version !== EXPORT_VERSION) {
    throw new Error('This export version is not supported by the current app.');
  }

  if (!Array.isArray(payload.pins) || !payload.pins.every(isPinEntry)) {
    throw new Error('The import file does not contain a valid pin collection.');
  }

  return payload.pins;
}
