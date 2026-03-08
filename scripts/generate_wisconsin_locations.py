#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import math
import sqlite3
import tempfile
import zipfile
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

GNIS_GPKG_ZIP_URL = (
    "https://prd-tnm.s3.amazonaws.com/StagedProducts/GeographicNames/FullModel/Gazetteer_WI_GPKG.zip"
)
DNR_PROPERTIES_URL = (
    "https://dnrmaps.wi.gov/arcgis2/rest/services/PR_Recreation/"
    "PR_WSPS_Property_Info_WTM_Ext/MapServer/0/query"
    "?where=1%3D1"
    "&outFields=PROP_NAME%2CPROP_TYPE%2CINFO_URL"
    "&returnGeometry=true"
    "&outSR=4326"
    "&f=pjson"
)

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_PATH = ROOT / "src" / "data" / "wisconsinLocations.json"


@dataclass(frozen=True)
class LocationRecord:
    id: str
    name: str
    kind: str
    source: str
    county: str | None
    lat: float
    lng: float
    zoom: int
    info_url: str | None = None

    def to_dict(self) -> dict[str, object]:
        data: dict[str, object] = {
            "id": self.id,
            "name": self.name,
            "kind": self.kind,
            "source": self.source,
            "county": self.county,
            "lat": round(self.lat, 6),
            "lng": round(self.lng, 6),
            "zoom": self.zoom,
        }
        if self.info_url:
            data["infoUrl"] = self.info_url
        return data


def download_bytes(url: str) -> bytes:
    request = Request(
        url,
        headers={
            "User-Agent": "ellie-map location generator",
            "Accept": "application/json, application/octet-stream;q=0.9, */*;q=0.8",
        },
    )
    with urlopen(request, timeout=120) as response:
        return response.read()


def resolve_gpkg_path(provided_path: str | None) -> tuple[Path, tempfile.TemporaryDirectory[str] | None]:
    if provided_path:
        return Path(provided_path), None

    temp_dir = tempfile.TemporaryDirectory()
    zip_path = Path(temp_dir.name) / "Gazetteer_WI_GPKG.zip"
    gpkg_path = Path(temp_dir.name) / "Gazetteer_WI_GPKG.gpkg"
    zip_path.write_bytes(download_bytes(GNIS_GPKG_ZIP_URL))

    with zipfile.ZipFile(zip_path) as archive:
        archive.extract("Gazetteer_WI_GPKG.gpkg", path=temp_dir.name)

    return gpkg_path, temp_dir


def clean_county_name(value: str | None) -> str | None:
    if not value:
        return None
    return value.replace(" County", "").strip() or None


def get_gnis_zoom(name: str, feature_class: str) -> int:
    if feature_class == "Civil":
        return 10 if "County" in name else 11
    if feature_class in {"Populated Place", "Census"}:
        return 12
    if feature_class in {"Lake", "Reservoir", "Bay", "Island", "Area"}:
        return 12
    if feature_class in {"Stream", "Rapids", "Falls", "Spring", "Canal", "Channel", "Gut", "Bend"}:
        return 13
    if feature_class in {"Valley", "Ridge", "Summit", "Gap", "Cliff", "Slope", "Cape", "Arch", "Plain"}:
        return 13
    if feature_class in {"Crossing", "Levee", "Pillar"}:
        return 14
    return 12


def load_gnis_locations(gpkg_path: Path) -> list[LocationRecord]:
    connection = sqlite3.connect(gpkg_path)
    cursor = connection.cursor()
    rows = cursor.execute(
        """
        SELECT
          feature_id,
          feature_name,
          feature_class,
          county_name,
          prim_lat_dec,
          prim_long_dec
        FROM DomesticNames
        WHERE prim_lat_dec IS NOT NULL
          AND prim_long_dec IS NOT NULL
        ORDER BY feature_name, feature_class, county_name, feature_id
        """
    ).fetchall()
    connection.close()

    return [
        LocationRecord(
            id=f"gnis-{feature_id}",
            name=feature_name,
            kind=feature_class,
            source="GNIS",
            county=clean_county_name(county_name),
            lat=prim_lat_dec,
            lng=prim_long_dec,
            zoom=get_gnis_zoom(feature_name, feature_class),
        )
        for feature_id, feature_name, feature_class, county_name, prim_lat_dec, prim_long_dec in rows
    ]


def get_dnr_kind_label(prop_type: str) -> str:
    return {
        "SP": "State Park",
        "SF": "State Forest",
        "SRA": "State Recreation Area",
        "RRA": "River and Resource Area",
    }.get(prop_type, prop_type)


def get_dnr_zoom(prop_type: str) -> int:
    return 11 if prop_type in {"SF", "RRA"} else 12


def iter_polygon_points(geometry: dict[str, object]) -> list[tuple[float, float]]:
    points: list[tuple[float, float]] = []
    for ring in geometry.get("rings", []):
        for lng, lat in ring:
            points.append((float(lng), float(lat)))
    return points


def get_geometry_center(geometry: dict[str, object]) -> tuple[float, float]:
    points = iter_polygon_points(geometry)
    if not points:
        raise ValueError("Expected polygon geometry with at least one coordinate")

    min_lng = min(point[0] for point in points)
    max_lng = max(point[0] for point in points)
    min_lat = min(point[1] for point in points)
    max_lat = max(point[1] for point in points)
    return ((min_lat + max_lat) / 2, (min_lng + max_lng) / 2)


def load_dnr_locations() -> list[LocationRecord]:
    payload = json.loads(download_bytes(DNR_PROPERTIES_URL))
    features = payload.get("features", [])
    grouped_features: dict[tuple[str, str, str | None], list[tuple[float, float]]] = defaultdict(list)

    for feature in features:
        attributes = feature["attributes"]
        geometry = feature["geometry"]
        prop_name = str(attributes["PROP_NAME"]).strip()
        prop_type = str(attributes["PROP_TYPE"]).strip()
        info_url = str(attributes["INFO_URL"]).strip() if attributes.get("INFO_URL") else None

        grouped_features[(prop_name, prop_type, info_url)].extend(iter_polygon_points(geometry))

    locations: list[LocationRecord] = []

    for (prop_name, prop_type, info_url), points in grouped_features.items():
        min_lng = min(point[0] for point in points)
        max_lng = max(point[0] for point in points)
        min_lat = min(point[1] for point in points)
        max_lat = max(point[1] for point in points)
        lat = (min_lat + max_lat) / 2
        lng = (min_lng + max_lng) / 2

        locations.append(
            LocationRecord(
                id=f"dnr-{prop_name.lower().replace(' ', '-')}",
                name=prop_name,
                kind=get_dnr_kind_label(prop_type),
                source="DNR",
                county=None,
                lat=lat,
                lng=lng,
                zoom=get_dnr_zoom(prop_type),
                info_url=info_url,
            )
        )

    locations.sort(key=lambda location: (location.name, location.kind, location.id))
    return locations


def validate_locations(locations: list[LocationRecord]) -> None:
    seen_ids: set[str] = set()
    for location in locations:
        if location.id in seen_ids:
            raise ValueError(f"Duplicate location id found: {location.id}")
        seen_ids.add(location.id)

        if not (-90 <= location.lat <= 90 and -180 <= location.lng <= 180):
            raise ValueError(f"Invalid coordinates for {location.id}: {location.lat}, {location.lng}")

        if math.isnan(location.lat) or math.isnan(location.lng):
            raise ValueError(f"NaN coordinates for {location.id}")


def build_payload(locations: list[LocationRecord], gnis_count: int, dnr_count: int) -> dict[str, object]:
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sources": {
            "gnis": GNIS_GPKG_ZIP_URL,
            "dnr": DNR_PROPERTIES_URL,
        },
        "counts": {
            "gnis": gnis_count,
            "dnr": dnr_count,
            "total": len(locations),
        },
        "locations": [location.to_dict() for location in locations],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate the Wisconsin search location dataset.")
    parser.add_argument("--gpkg", help="Path to a local Gazetteer_WI_GPKG.gpkg file.")
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT_PATH),
        help=f"Output JSON path. Defaults to {DEFAULT_OUTPUT_PATH}.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    gpkg_path, temp_dir = resolve_gpkg_path(args.gpkg)

    try:
        gnis_locations = load_gnis_locations(gpkg_path)
        dnr_locations = load_dnr_locations()
        combined_locations = [*gnis_locations, *dnr_locations]
        validate_locations(combined_locations)

        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(
                build_payload(combined_locations, gnis_count=len(gnis_locations), dnr_count=len(dnr_locations)),
                separators=(",", ":"),
            )
            + "\n",
            encoding="utf-8",
        )

        print(
            f"Wrote {len(combined_locations)} Wisconsin locations "
            f"({len(gnis_locations)} GNIS, {len(dnr_locations)} DNR) to {output_path}"
        )
    finally:
        if temp_dir is not None:
            temp_dir.cleanup()


if __name__ == "__main__":
    main()
