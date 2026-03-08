export type WisconsinLocationKind = 'city' | 'state-park';

interface WisconsinLocationDefinition {
  id: string;
  name: string;
  kind: WisconsinLocationKind;
  region: string;
  lat: number;
  lng: number;
  zoom: number;
  aliases?: string[];
}

export interface WisconsinLocation extends WisconsinLocationDefinition {
  searchText: string;
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function buildSearchText(location: WisconsinLocationDefinition) {
  return normalizeSearchText(
    [
      location.name,
      location.kind === 'city' ? 'city' : 'state park',
      location.region,
      ...(location.aliases ?? []),
    ].join(' '),
  );
}

const locationDefinitions = [
  {
    id: 'milwaukee',
    name: 'Milwaukee',
    kind: 'city',
    region: 'Lake Michigan shoreline',
    lat: 43.0389,
    lng: -87.9065,
    zoom: 12,
  },
  {
    id: 'madison',
    name: 'Madison',
    kind: 'city',
    region: 'Dane County lakes',
    lat: 43.0731,
    lng: -89.4012,
    zoom: 12,
  },
  {
    id: 'green-bay',
    name: 'Green Bay',
    kind: 'city',
    region: 'Fox River and the bay',
    lat: 44.5133,
    lng: -88.0133,
    zoom: 12,
  },
  {
    id: 'appleton',
    name: 'Appleton',
    kind: 'city',
    region: 'Fox Cities',
    lat: 44.2619,
    lng: -88.4154,
    zoom: 12,
  },
  {
    id: 'eau-claire',
    name: 'Eau Claire',
    kind: 'city',
    region: 'Chippewa Valley',
    lat: 44.8113,
    lng: -91.4985,
    zoom: 12,
  },
  {
    id: 'la-crosse',
    name: 'La Crosse',
    kind: 'city',
    region: 'Mississippi River bluffs',
    lat: 43.8138,
    lng: -91.2519,
    zoom: 12,
  },
  {
    id: 'wausau',
    name: 'Wausau',
    kind: 'city',
    region: 'Central Wisconsin',
    lat: 44.9591,
    lng: -89.6301,
    zoom: 12,
  },
  {
    id: 'kenosha',
    name: 'Kenosha',
    kind: 'city',
    region: 'Southeast lakefront',
    lat: 42.5847,
    lng: -87.8212,
    zoom: 12,
  },
  {
    id: 'racine',
    name: 'Racine',
    kind: 'city',
    region: 'Lake Michigan shoreline',
    lat: 42.7261,
    lng: -87.7829,
    zoom: 12,
  },
  {
    id: 'sheboygan',
    name: 'Sheboygan',
    kind: 'city',
    region: 'Lake Michigan shoreline',
    lat: 43.7508,
    lng: -87.7145,
    zoom: 12,
  },
  {
    id: 'oshkosh',
    name: 'Oshkosh',
    kind: 'city',
    region: 'Lake Winnebago',
    lat: 44.0247,
    lng: -88.5426,
    zoom: 12,
  },
  {
    id: 'stevens-point',
    name: 'Stevens Point',
    kind: 'city',
    region: 'Central Wisconsin river corridor',
    lat: 44.5236,
    lng: -89.5746,
    zoom: 12,
  },
  {
    id: 'superior',
    name: 'Superior',
    kind: 'city',
    region: 'Head of Lake Superior',
    lat: 46.7208,
    lng: -92.1041,
    zoom: 12,
  },
  {
    id: 'sturgeon-bay',
    name: 'Sturgeon Bay',
    kind: 'city',
    region: 'Door County',
    lat: 44.8342,
    lng: -87.377,
    zoom: 12,
  },
  {
    id: 'wisconsin-dells',
    name: 'Wisconsin Dells',
    kind: 'city',
    region: 'Dells of the Wisconsin River',
    lat: 43.6275,
    lng: -89.7709,
    zoom: 12,
    aliases: ['dells'],
  },
  {
    id: 'baraboo',
    name: 'Baraboo',
    kind: 'city',
    region: 'Baraboo Range',
    lat: 43.4711,
    lng: -89.7443,
    zoom: 12,
  },
  {
    id: 'bayfield',
    name: 'Bayfield',
    kind: 'city',
    region: 'Apostle Islands gateway',
    lat: 46.8108,
    lng: -90.8182,
    zoom: 13,
  },
  {
    id: 'hayward',
    name: 'Hayward',
    kind: 'city',
    region: 'Northwoods lakes',
    lat: 46.013,
    lng: -91.4846,
    zoom: 12,
  },
  {
    id: 'minocqua',
    name: 'Minocqua',
    kind: 'city',
    region: 'Northwoods chain of lakes',
    lat: 45.8711,
    lng: -89.7085,
    zoom: 13,
  },
  {
    id: 'lake-geneva',
    name: 'Lake Geneva',
    kind: 'city',
    region: 'Walworth County lake country',
    lat: 42.5917,
    lng: -88.4334,
    zoom: 12,
  },
  {
    id: 'devils-lake',
    name: "Devil's Lake State Park",
    kind: 'state-park',
    region: 'Baraboo Range',
    lat: 43.4182,
    lng: -89.731,
    zoom: 13,
    aliases: ['devils lake'],
  },
  {
    id: 'peninsula',
    name: 'Peninsula State Park',
    kind: 'state-park',
    region: 'Door County',
    lat: 45.156,
    lng: -87.247,
    zoom: 13,
  },
  {
    id: 'governor-dodge',
    name: 'Governor Dodge State Park',
    kind: 'state-park',
    region: 'Dodgeville area',
    lat: 43.0507,
    lng: -90.1181,
    zoom: 13,
  },
  {
    id: 'mirror-lake',
    name: 'Mirror Lake State Park',
    kind: 'state-park',
    region: 'Wisconsin Dells area',
    lat: 43.5707,
    lng: -89.7975,
    zoom: 13,
  },
  {
    id: 'high-cliff',
    name: 'High Cliff State Park',
    kind: 'state-park',
    region: 'Lake Winnebago',
    lat: 44.1605,
    lng: -88.293,
    zoom: 13,
  },
  {
    id: 'pattison',
    name: 'Pattison State Park',
    kind: 'state-park',
    region: 'Superior area',
    lat: 46.5413,
    lng: -92.1621,
    zoom: 13,
  },
  {
    id: 'copper-falls',
    name: 'Copper Falls State Park',
    kind: 'state-park',
    region: 'Mellen and Ashland County',
    lat: 46.4968,
    lng: -90.7276,
    zoom: 13,
  },
  {
    id: 'amnicon-falls',
    name: 'Amnicon Falls State Park',
    kind: 'state-park',
    region: 'South shore near Superior',
    lat: 46.4902,
    lng: -91.9796,
    zoom: 13,
  },
  {
    id: 'wildcat-mountain',
    name: 'Wildcat Mountain State Park',
    kind: 'state-park',
    region: 'Kickapoo Valley',
    lat: 43.7517,
    lng: -90.6265,
    zoom: 13,
  },
  {
    id: 'harrington-beach',
    name: 'Harrington Beach State Park',
    kind: 'state-park',
    region: 'Lake Michigan north of Milwaukee',
    lat: 43.3799,
    lng: -87.9315,
    zoom: 13,
  },
  {
    id: 'kohler-andrae',
    name: 'Kohler-Andrae State Park',
    kind: 'state-park',
    region: 'Lake Michigan dunes',
    lat: 43.6672,
    lng: -87.7347,
    zoom: 13,
  },
  {
    id: 'blue-mound',
    name: 'Blue Mound State Park',
    kind: 'state-park',
    region: 'Driftless Area ridge',
    lat: 43.017,
    lng: -89.8567,
    zoom: 13,
  },
  {
    id: 'newport',
    name: 'Newport State Park',
    kind: 'state-park',
    region: 'Door County dark sky coast',
    lat: 45.2346,
    lng: -86.9913,
    zoom: 13,
  },
  {
    id: 'big-foot-beach',
    name: 'Big Foot Beach State Park',
    kind: 'state-park',
    region: 'Lake Geneva',
    lat: 42.5781,
    lng: -88.4256,
    zoom: 13,
  },
  {
    id: 'interstate',
    name: 'Interstate State Park',
    kind: 'state-park',
    region: 'St. Croix River',
    lat: 45.3955,
    lng: -92.6463,
    zoom: 13,
  },
  {
    id: 'willow-river',
    name: 'Willow River State Park',
    kind: 'state-park',
    region: 'Hudson area',
    lat: 44.9874,
    lng: -92.7644,
    zoom: 13,
  },
  {
    id: 'hartman-creek',
    name: 'Hartman Creek State Park',
    kind: 'state-park',
    region: 'Waupaca chain of lakes',
    lat: 44.3358,
    lng: -89.3037,
    zoom: 13,
  },
  {
    id: 'rib-mountain',
    name: 'Rib Mountain State Park',
    kind: 'state-park',
    region: 'Wausau area',
    lat: 44.9316,
    lng: -89.6838,
    zoom: 13,
  },
  {
    id: 'wyalusing',
    name: 'Wyalusing State Park',
    kind: 'state-park',
    region: 'Mississippi and Wisconsin rivers',
    lat: 43.0586,
    lng: -91.0705,
    zoom: 13,
  },
  {
    id: 'perrot',
    name: 'Perrot State Park',
    kind: 'state-park',
    region: 'Trempealeau and Mississippi rivers',
    lat: 44.1512,
    lng: -91.8214,
    zoom: 13,
  },
  {
    id: 'governor-nelson',
    name: 'Governor Nelson State Park',
    kind: 'state-park',
    region: 'Madison area lake shore',
    lat: 43.132,
    lng: -89.4648,
    zoom: 13,
  },
  {
    id: 'potawatomi',
    name: 'Potawatomi State Park',
    kind: 'state-park',
    region: 'Sturgeon Bay and Door County',
    lat: 44.8451,
    lng: -87.4067,
    zoom: 13,
  },
  {
    id: 'roche-a-cri',
    name: 'Roche-A-Cri State Park',
    kind: 'state-park',
    region: 'Adams County sandstone mound',
    lat: 44.137,
    lng: -89.928,
    zoom: 13,
    aliases: ['roche a cri'],
  },
  {
    id: 'rock-island',
    name: 'Rock Island State Park',
    kind: 'state-park',
    region: 'Door County island',
    lat: 45.0539,
    lng: -86.7667,
    zoom: 13,
  },
] satisfies WisconsinLocationDefinition[];

export const wisconsinLocations: WisconsinLocation[] = locationDefinitions.map((location) => ({
  ...location,
  searchText: buildSearchText(location),
}));

export function getWisconsinLocationKindLabel(kind: WisconsinLocationKind) {
  return kind === 'city' ? 'City' : 'State Park';
}

function getSearchScore(location: WisconsinLocation, query: string) {
  const normalizedName = normalizeSearchText(location.name);

  if (normalizedName === query) {
    return 0;
  }

  if (normalizedName.startsWith(query)) {
    return 1;
  }

  const searchIndex = location.searchText.indexOf(query);
  if (searchIndex >= 0) {
    return 10 + searchIndex;
  }

  const queryTerms = query.split(' ');
  if (queryTerms.every((term) => location.searchText.includes(term))) {
    return 100 + queryTerms.length;
  }

  return null;
}

export function searchWisconsinLocations(query: string, limit = 8) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  return wisconsinLocations
    .map((location) => ({
      location,
      score: getSearchScore(location, normalizedQuery),
    }))
    .filter((item): item is { location: WisconsinLocation; score: number } => item.score !== null)
    .sort((left, right) => left.score - right.score || left.location.name.localeCompare(right.location.name))
    .slice(0, limit)
    .map((item) => item.location);
}
