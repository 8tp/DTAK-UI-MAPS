Awesome—here’s a clear, copy-pasteable runbook to stand up Option A: static, dirt-cheap vector tiles using PMTiles on S3 + CloudFront. I’ll also note the tiny delta you’ll need if your client is React Native (MapLibre Native), since PMTiles’ browser protocol is not built into RN yet.

⸻

0) What you’ll end up with
	•	An S3 bucket holding one or more *.pmtiles files.
	•	A CloudFront distribution in front for HTTPS + caching.
	•	Clients fetch tiles via HTTP range requests directly from the .pmtiles file (zero server code).  ￼

⸻

1) Make (or get) your tiles

Pick one:

A) Use ready-made PMTiles
Download a Protomaps basemap build (planet or region-sized).  ￼

# Inspect a hosted build (example)
pmtiles show https://build.protomaps.com/2025-08-24.pmtiles

B) Build your own from OSM
	•	Fastest path: Planetiler → MBTiles… then convert to PMTiles.  ￼

# Example: cut a regional extract at z0–14
planetiler --osm=your.osm.pbf --mbtiles=out.mbtiles \
  --bounds=-123,36.8,-121,38.5 --min-zoom=0 --max-zoom=14
# Convert MBTiles → PMTiles
pmtiles convert out.mbtiles out.pmtiles

	•	Or generate PMTiles directly with Tippecanoe ≥2.17 for custom layers.  ￼

PMTiles is designed for S3 + CDN, zero maintenance, very low request count compared to z/x/y directories.  ￼

⸻

2) Create the S3 bucket
	1.	In S3, Create bucket (e.g., dtak-tiles-prod).
	2.	Block Public Access: ON (keep bucket private).
	3.	Upload your .pmtiles file (e.g., maps/region.pmtiles).
	•	Content-Type can be application/octet-stream. S3 supports Range requests automatically.  ￼

CORS (allow range requests via browsers/apps): in Permissions → CORS:

[
  {
    "AllowedHeaders": ["*","Range"],
    "AllowedMethods": ["GET","HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["Accept-Ranges","Content-Length","Content-Range"]
  }
]

(Restrict AllowedOrigins to your domains later.)

⸻

3) Put CloudFront in front (HTTPS + caching + OAC)
	1.	Create Distribution → Origin = your S3 bucket (not the website endpoint).
	2.	Origin access: Create an Origin Access Control (OAC) and attach it.
	3.	In S3 Bucket policy, allow only the CloudFront OAC principal (the console will suggest the JSON).
	4.	Default cache behavior:
	•	Allowed methods: GET, HEAD
	•	Viewer protocol: Redirect HTTP → HTTPS
	•	Caching: Long TTLs are fine (tiles are immutable).
	5.	(Optional) Set a custom domain in CloudFront + ACM cert + Route53 alias.
AWS’s “S3 + CloudFront static hosting” guide walks these knobs.  ￼

Resulting public URL example:

https://d111111abcdef8.cloudfront.net/maps/region.pmtiles


⸻

4) Wire up the client

4A) Web (MapLibre GL JS) — native PMTiles support

MapLibre GL JS supports PMTiles through a tiny protocol shim (no server).  ￼

<script type="module">
  import maplibregl from 'https://cdn.skypack.dev/maplibre-gl';
  import { Protocol } from 'https://unpkg.com/pmtiles@latest/dist/index.js';

  const protocol = new Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);

  const map = new maplibregl.Map({
    container: 'map',
    style: {
      "version": 8,
      "sources": {
        "basemap": {
          "type": "vector",
          "url": "pmtiles://https://YOUR_CLOUDFRONT/maps/region.pmtiles"
        }
      },
      "layers": [
        /* your style layers here */
      ]
    }
  });
</script>

4B) React Native (MapLibre Native) — read this carefully
	•	MapLibre React Native does not (yet) ship a built-in pmtiles:// protocol like the browser does. Use one of these patterns:  ￼
	1.	Host standard z/x/y tiles on S3/CloudFront instead of a single PMTiles file (slightly more requests, but simplest).
	•	Generate z/x/y from your source (e.g., Planetiler export, tippecanoe toolchain) and upload the folder tree; then reference "tiles": ["https://YOUR_CLOUDFRONT/tiles/{z}/{x}/{y}.mvt"] in your style.
	2.	Keep PMTiles on S3 and add a tiny proxy that translates /{z}/{x}/{y}.mvt → range reads inside the PMTiles (e.g., Lambda@Edge or a minimal API). That’s “serverless”, but no always-on server.
	•	If you’re open to a web-based map view, MapLibre GL JS inside a WebView can use the PMTiles protocol (trade-offs apply).

TL;DR for RN today: either publish z/x/y tiles statically or add a minimal edge proxy for .pmtiles. (Web clients can use pmtiles:// directly.)  ￼

⸻

5) (Optional) Publish z/x/y tiles instead of PMTiles

If you pick the RN-native path with z/x/y:
	•	Use your tiler to output a directory tree, then aws s3 sync to the bucket:

aws s3 sync ./tiles/ s3://dtak-tiles-prod/tiles/ --size-only

	•	Reference in your style:

{
  "type": "vector",
  "tiles": ["https://YOUR_CLOUDFRONT/tiles/{z}/{x}/{y}.mvt"],
  "minzoom": 0, "maxzoom": 14
}

Trade-off: more S3 requests vs. the single-file PMTiles approach.  ￼

⸻

6) Cost/leak protection tips
	•	Immutable filenames (include a version/epoch in region.v1.pmtiles) so CloudFront can cache “forever” safely.
	•	If hosting planet-scale .pmtiles, consider preventing direct public downloads (range-only access) to avoid one-shot 70+ GB egress surprises. (General PMTiles hosting caution.)  ￼
	•	Start with regional extracts (state/country) to keep files 1–10 GB.
	•	Set CloudFront Cache-Control: long max-age, and ensure the S3 object has ETag (default) for efficient validation.

⸻

7) Quick validation checklist
	•	S3 object responds to GET with Accept-Ranges: bytes.
	•	CloudFront distribution is Deployed and returns 206 Partial Content for range requests.
	•	Web demo using MapLibre GL JS + pmtiles:// renders correctly.  ￼
	•	RN path: either tiles render from your tiles/{z}/{x}/{y}.mvt URLs, or your edge proxy serves them.

⸻

References
	•	PMTiles concepts & docs (single-file tiles; HTTP Range; S3/CDN friendly).  ￼
	•	PMTiles + MapLibre GL JS example (protocol).  ￼
	•	PMTiles “Getting started” & CLI.  ￼
	•	Planetiler (generate tiles fast); OpenMapTiles profile.  ￼
	•	MapLibre React Native docs.  ￼
	•	AWS S3 + CloudFront static hosting guidance.  ￼

⸻

If you want, I can also drop in a Terraform (S3 + OAC CloudFront + sensible CORS/TTL) and a minimal TileJSON style you can reuse for RN (z/x/y) and web (pmtiles).




Can we do this without cloudfront directly from an S3 bucket for dev purposes?




Yep—totally doable for dev. You can serve tiles directly from S3 (no CloudFront) as long as you (a) use the S3 REST endpoint for HTTPS and (b) enable CORS + Range support. Here’s a tight step-by-step for both PMTiles and z/x/y tiles.

⸻

Option A — PMTiles from S3 (web clients)

1) Create a private S3 bucket & upload your tiles
	•	Bucket: e.g., dtak-tiles-dev
	•	Upload maps/region.pmtiles
	•	S3 supports HTTP Range GETs, which PMTiles needs.  ￼

2) Enable CORS (so browsers can make range requests)

Bucket → Permissions → CORS:

[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET","HEAD"],
    "AllowedHeaders": ["*","Range"],
    "ExposeHeaders": ["Accept-Ranges","Content-Length","Content-Range"],
    "MaxAgeSeconds": 3000
  }
]

(Tighten AllowedOrigins later to your dev app URL(s).)  ￼

3) Make the file publicly readable (dev-only)

Bucket → Permissions → Bucket policy (replace bucket name/region/prefix):

{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "DevPublicReadTiles",
    "Effect": "Allow",
    "Principal": "*",
    "Action": ["s3:GetObject"],
    "Resource": "arn:aws:s3:::dtak-tiles-dev/maps/*"
  }]
}

Or keep it private and use pre-signed URLs during development.

4) Use the REST endpoint (HTTPS), not the website endpoint
	•	Use: https://dtak-tiles-dev.s3.<region>.amazonaws.com/maps/region.pmtiles
	•	Avoid the website endpoint for this—S3 website hosting is HTTP-only; the REST endpoint is HTTPS.  ￼

5) Wire up MapLibre GL JS with the PMTiles protocol

<script type="module">
  import maplibregl from 'https://cdn.skypack.dev/maplibre-gl';
  import { Protocol, PMTiles } from 'https://unpkg.com/pmtiles@latest/dist/index.js';

  const protocol = new Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);

  const url = 'https://dtak-tiles-dev.s3.<region>.amazonaws.com/maps/region.pmtiles';
  const p = new PMTiles(url);
  protocol.add(p); // share instance

  new maplibregl.Map({
    container: 'map',
    style: {
      "version": 8,
      "sources": {
        "basemap": { "type": "vector", "url": `pmtiles://${url}` }
      },
      "layers": [ /* your layers here */ ]
    }
  });
</script>

(MapLibre + PMTiles protocol example is standard.)  ￼

6) Quick sanity checks
	•	curl -I -H "Range: bytes=0-1023" https://.../region.pmtiles returns 206 Partial Content and Accept-Ranges: bytes. (S3 supports range GETs.)  ￼
	•	The map loads in your dev app’s browser.

PMTiles is explicitly designed to sit on S3/compatible storage with Range + CORS.  ￼

⸻

Option B — z/x/y vector tiles (works in React Native today)

React Native MapLibre doesn’t yet ship the PMTiles protocol natively. For RN development without CloudFront, publish z/x/y tiles to S3 and point your style at them.

1) Upload tiles

aws s3 sync ./tiles/ s3://dtak-tiles-dev/tiles/ --size-only

2) CORS (same as above)

Use the same CORS JSON (Range not strictly needed for z/x/y, but harmless).

3) Public read (dev-only) or pre-signed URLs

Use the same bucket policy pattern as above, but for tiles/*.

4) Style source in RN (and web too)

{
  "type": "vector",
  "tiles": ["https://dtak-tiles-dev.s3.<region>.amazonaws.com/tiles/{z}/{x}/{y}.mvt"],
  "minzoom": 0,
  "maxzoom": 14
}


⸻

Notes & gotchas (dev)
	•	HTTPS: use the S3 REST URL shown above; the S3 website URL is HTTP only.  ￼
	•	Public access: safe for throwaway dev buckets, but prefer pre-signed URLs when possible.
	•	Costs: direct S3 is fine for dev; for prod you’ll likely want CloudFront for TLS with custom domains + caching + lower request latency.
	•	PMTiles + RN: for a pure RN client, either (a) use z/x/y during dev, (b) render MapLibre GL JS inside a WebView, or (c) add a tiny edge proxy later. (Web already works with PMTiles.)  ￼

If you want, I can paste a ready-made bucket policy, CORS, and a tiny TileJSON style you can drop in for either PMTiles (web) or z/x/y (RN).