interface WisconsinLocationDataRecord {
  id: string;
  name: string;
  kind: string;
  source: 'GNIS' | 'DNR';
  county: string | null;
  lat: number;
  lng: number;
  zoom: number;
  infoUrl?: string;
}

interface WisconsinLocationFile {
  generatedAt: string;
  counts: {
    gnis: number;
    dnr: number;
    total: number;
  };
  locations: WisconsinLocationDataRecord[];
}

export interface WisconsinLocation extends WisconsinLocationDataRecord {
  normalizedName: string;
  searchText: string;
}

export interface WisconsinLocationDataset {
  generatedAt: string;
  counts: {
    gnis: number;
    dnr: number;
    total: number;
  };
  locations: WisconsinLocation[];
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function buildSearchText(location: WisconsinLocationDataRecord) {
  return normalizeSearchText([location.name, location.kind, location.county, location.source].filter(Boolean).join(' '));
}

let datasetPromise: Promise<WisconsinLocationDataset> | null = null;

export async function loadWisconsinLocationDataset() {
  if (!datasetPromise) {
    datasetPromise = import('../data/wisconsinLocations.json').then((module) => {
      const file = module.default as WisconsinLocationFile;

      return {
        generatedAt: file.generatedAt,
        counts: file.counts,
        locations: file.locations.map((location) => ({
          ...location,
          normalizedName: normalizeSearchText(location.name),
          searchText: buildSearchText(location),
        })),
      };
    });
  }

  return datasetPromise;
}

export function getWisconsinLocationSubtitle(location: WisconsinLocation) {
  if (location.source === 'DNR') {
    return `${location.kind} · Wisconsin DNR`;
  }

  return location.county ? `${location.kind} · ${location.county} County` : location.kind;
}

function getSearchScore(location: WisconsinLocation, normalizedQuery: string) {
  if (location.normalizedName === normalizedQuery) {
    return 0;
  }

  if (location.normalizedName.startsWith(normalizedQuery)) {
    return 10;
  }

  const nameMatchIndex = location.normalizedName.indexOf(normalizedQuery);
  if (nameMatchIndex >= 0) {
    return 25 + nameMatchIndex;
  }

  const searchMatchIndex = location.searchText.indexOf(normalizedQuery);
  if (searchMatchIndex >= 0) {
    return 60 + searchMatchIndex;
  }

  const terms = normalizedQuery.split(' ');
  if (terms.every((term) => location.searchText.includes(term))) {
    return 120 + terms.length;
  }

  return null;
}

export function searchWisconsinLocations(locations: WisconsinLocation[], query: string, limit = 12) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  const matches: Array<{ location: WisconsinLocation; score: number }> = [];

  for (const location of locations) {
    const score = getSearchScore(location, normalizedQuery);
    if (score === null) {
      continue;
    }

    const match = { location, score };
    let insertAt = matches.findIndex(
      (item) => item.score > match.score || (item.score === match.score && item.location.name.localeCompare(match.location.name) > 0),
    );

    if (insertAt === -1) {
      insertAt = matches.length;
    }

    matches.splice(insertAt, 0, match);

    if (matches.length > limit) {
      matches.pop();
    }
  }

  return matches.map((item) => item.location);
}
