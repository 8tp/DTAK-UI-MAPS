Absolutely. Below is a React Native + MapLibre Native–only runbook that creates vector tiles (z/x/y), stores them in S3, and serves them without CloudFront. This avoids PMTiles (which MapLibre Native doesn’t read directly) and sticks to what RN supports today.

⸻

Overview

You will:
	1.	Generate vector MBTiles → export to z/x/y .pbf tiles
	2.	Upload tiles + style + glyphs + sprites to S3
	3.	Configure CORS and (dev) public read
	4.	Point MapLibre RN at your S3 URLs

⸻

Prereqs (local)
	•	Java 17+ (for Planetiler)
	•	Node 18+ (for sprite/glyph tooling)
	•	Tools:
	•	Planetiler (fast OSM → MBTiles)
	•	Tippecanoe (provides tile-join to export z/x/y)
	•	node-fontnik (generate glyphs PBF)
	•	@mapbox/spritezero-cli (generate sprites)
	•	AWS CLI v2

If you prefer, you can swap Planetiler for the OpenMapTiles Docker toolchain; the export step is the same (MBTiles → z/x/y).

⸻

1) Generate vector tiles (MBTiles)

Use a regional OSM extract (e.g., from Geofabrik) and Planetiler:

# 1) Get your region extract (example bbox/zoom; adjust)
curl -L -o region.osm.pbf https://download.geofabrik.de/north-america/us/california-latest.osm.pbf

# 2) Run Planetiler (OpenMapTiles profile recommended)
# If you don’t have planetiler, grab the jar from releases first.
java -Xmx8g -jar planetiler.jar \
  --osm=region.osm.pbf \
  --mbtiles=out.mbtiles \
  --area=auto \
  --min-zoom=0 --max-zoom=14 \
  --download --force

You now have out.mbtiles (vector tiles, gzip-compressed internally).

⸻

2) Export MBTiles → z/x/y directory

MapLibre Native reads z/x/y. Export with tile-join:

# Exports a directory of gzipped .pbf tiles at tiles/{z}/{x}/{y}.pbf
tile-join -e tiles -f out.mbtiles

You’ll get:

tiles/
  0/0/0.pbf
  1/0/0.pbf
  ...


⸻

3) Generate sprites (images + JSON)

Create a simple sprite set for your style (add your PNG icons to icons/ at 1x and 2x sizes).

# Install spritezero cli once:
npm i -g @mapbox/spritezero-cli

# Generate sprite sheet and metadata
spritezero sprites/sprite icons/     # produces sprite.png + sprite.json
spritezero --retina sprites/sprite@2x icons/

Uploads to S3 later will live under sprites/.

⸻

4) Generate glyphs (font PBFs)

Pick the fonts you’ll reference in your style (e.g., “Noto Sans Regular/Italic/Bold”).

npm i -g node-fontnik

# Suppose you have TTFs in ./fonts/NotoSans-*.ttf
# Generate Mapbox-style PBF ranges for each face (256 glyph ranges per face)
mkdir -p glyphs/Noto%20Sans%20Regular
glyphs --font ./fonts/NotoSans-Regular.ttf --output glyphs/Noto%20Sans%20Regular

mkdir -p glyphs/Noto%20Sans%20Bold
glyphs --font ./fonts/NotoSans-Bold.ttf --output glyphs/Noto%20Sans%20Bold

# Repeat for any font faces used in your style

This creates:

glyphs/
  Noto%20Sans%20Regular/0-255.pbf
  Noto%20Sans%20Regular/256-511.pbf
  ...


⸻

5) Create a minimal Style JSON

Make a style.json that references your S3 endpoints. Keep it small for dev:

{
  "version": 8,
  "name": "dtak-dev-style",
  "glyphs": "https://YOUR_BUCKET.s3.YOUR_REGION.amazonaws.com/glyphs/{fontstack}/{range}.pbf",
  "sprite": "https://YOUR_BUCKET.s3.YOUR_REGION.amazonaws.com/sprites/sprite",
  "sources": {
    "basemap": {
      "type": "vector",
      "tiles": ["https://YOUR_BUCKET.s3.YOUR_REGION.amazonaws.com/tiles/{z}/{x}/{y}.pbf"],
      "minzoom": 0,
      "maxzoom": 14
    }
  },
  "layers": [
    { "id": "land", "type": "fill", "source": "basemap", "source-layer": "land", "paint": {"fill-color": "#e8f1f2"} },
    { "id": "water", "type": "fill", "source": "basemap", "source-layer": "water", "paint": {"fill-color": "#c6e2ff"} },
    { "id": "roads", "type": "line", "source": "basemap", "source-layer": "transportation", "paint": {"line-width": 0.5, "line-color": "#999"} },
    { "id": "place-labels", "type": "symbol", "source": "basemap", "source-layer": "place",
      "layout": {"text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": 12},
      "paint": {"text-color": "#334"} }
  ]
}

Ensure the source-layer names match your tiles’ schema (OpenMapTiles names shown above).

⸻

6) Create S3 bucket and upload

Create a dev bucket (e.g., dtak-tiles-dev) and upload everything:

aws s3api create-bucket --bucket dtak-tiles-dev --region YOUR_REGION --create-bucket-configuration LocationConstraint=YOUR_REGION

# Upload tiles with correct metadata (compressed protobuf)
aws s3 sync ./tiles s3://dtak-tiles-dev/tiles/ \
  --content-type application/x-protobuf \
  --content-encoding gzip

# Upload style
aws s3 cp style.json s3://dtak-tiles-dev/style.json \
  --content-type application/json

# Upload sprites
aws s3 cp sprites/sprite.png s3://dtak-tiles-dev/sprites/sprite.png --content-type image/png
aws s3 cp sprites/sprite.json s3://dtak-tiles-dev/sprites/sprite.json --content-type application/json
aws s3 cp sprites/sprite@2x.png s3://dtak-tiles-dev/sprites/sprite@2x.png --content-type image/png
aws s3 cp sprites/sprite@2x.json s3://dtak-tiles-dev/sprites/sprite@2x.json --content-type application/json

# Upload glyphs (PBFs)
aws s3 sync ./glyphs s3://dtak-tiles-dev/glyphs/ \
  --content-type application/x-protobuf

Why the metadata?
	•	Tiles are gzipped PBF: set Content-Type: application/x-protobuf (or application/vnd.mapbox-vector-tile) and Content-Encoding: gzip.
	•	Glyph PBFs aren’t gzipped by default (skip Content-Encoding unless you gzip them).

⸻

7) Enable CORS (dev)

In S3 → Bucket → Permissions → CORS, paste:

[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["Accept-Ranges", "Content-Length", "Content-Range", "ETag"],
    "MaxAgeSeconds": 3000
  }
]

(For tighter dev, replace * with your app’s origin; RN uses native HTTP, so * is fine here.)

⸻

8) Make objects readable (dev)

For quick dev, add a bucket policy granting public read to the prefixes you just uploaded (or use pre-signed URLs if you prefer private dev):

{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "DevPublicRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": ["s3:GetObject"],
    "Resource": [
      "arn:aws:s3:::dtak-tiles-dev/style.json",
      "arn:aws:s3:::dtak-tiles-dev/tiles/*",
      "arn:aws:s3:::dtak-tiles-dev/glyphs/*",
      "arn:aws:s3:::dtak-tiles-dev/sprites/*"
    ]
  }]
}

In prod, drop public read and front with CloudFront or use signed URLs.

⸻

9) Wire up React Native (MapLibre Native)

Install and initialize MapLibre for RN:

# Example package (adjust if you use a different RN binding)
npm i @maplibre/maplibre-react-native
cd ios && pod install && cd ..

In your RN component:

import MapLibreGL from '@maplibre/maplibre-react-native';
import { View } from 'react-native';

MapLibreGL.setAccessToken(null); // not needed for self-hosted
MapLibreGL.setConnected(true);   // allow network

const STYLE_URL = 'https://dtak-tiles-dev.s3.YOUR_REGION.amazonaws.com/style.json';

export default function MapScreen() {
  return (
    <View style={{ flex: 1 }}>
      <MapLibreGL.MapView style={{ flex: 1 }} styleURL={STYLE_URL}>
        <MapLibreGL.Camera
          zoomLevel={10}
          centerCoordinate={[-122.4194, 37.7749]}
        />
      </MapLibreGL.MapView>
    </View>
  );
}

Gotchas:
	•	If labels don’t show, your glyphs or font names in the style likely don’t match. Ensure text-font names correspond to your glyphs/{fontstack}/… directories (URL-encoded spaces).
	•	If icons don’t show, validate the sprite URL base and that both sprite.png and sprite.json (and @2x variants) are present.

⸻

10) Sanity checks
	•	Curl a tile:
curl -I https://dtak-tiles-dev.s3.YOUR_REGION.amazonaws.com/tiles/5/5/12.pbf
Should return 200 with Content-Type: application/x-protobuf and (for tiles) Content-Encoding: gzip.
	•	Open the style URL in a browser:
https://dtak-tiles-dev.s3.YOUR_REGION.amazonaws.com/style.json
Ensure the referenced paths resolve.
	•	Run the app; you should see a basemap.

⸻

11) Optional improvements (still S3-only)
	•	Versioned paths: e.g., tiles/v1/... to let clients cache safely.
	•	Pre-signed URLs: keep bucket private during dev.
	•	Multiple regions: publish tiles/ca/…, tiles/ga/… and switch sources by AOI.

⸻

Quick “cut & paste” checklist
	•	Generate out.mbtiles (Planetiler)
	•	tile-join -e tiles -f out.mbtiles
	•	Generate sprites/* and glyphs/*
	•	Upload: tiles/, sprites/, glyphs/, style.json with correct metadata
	•	S3 CORS + (dev) public-read policy
	•	RN MapLibre points to S3 style.json

If you want, I can also give you a ready-made style.json aligned to the OpenMapTiles schema you just produced (so you can drop it in and see map features immediately).