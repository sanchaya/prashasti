# ಪ್ರಶಸ್ತಿ ಸಂಚಯ — Prashasti Sanchaya

A static, multi-award, bilingual (Kannada-first) site cataloguing recipients of Karnataka's and
Kannadigas' major civilian and literary honours. Part of the Sanchaya family of projects.

Live at **https://prashasti.sanchaya.net** (GitHub Pages).

## Quick start

```bash
git clone https://github.com/sanchaya/prashasti.git
cd prashasti
python3 -m http.server 8912
# open http://localhost:8912
```

No build step, no framework, no dependencies. Browsers block `fetch()` on `file://` URLs, so
you need *some* static file server — `python3 -m http.server` is the simplest, any will do.

## Repo layout

```
index.html               Markup + data-i18n translation attributes (award sidebar + map card with in-map timeline)
sources.html             Public Sources & citations page (every source, grouped by award)
css/style.css            Single stylesheet, CSS custom properties (big-map 2-column grid; award nav collapses to single column ≤1000px)
js/
  i18n.js                KN/EN dictionaries + Sanchi18n helper (translation, field labels)
  app.js                 Core app: award switching (sidebar), filtering, browse, in-map timeline, stats, #admin routing
  sources.js             Sources & citations page renderer
  map.js                 SanchiMap — Leaflet map (Karnataka district choropleth + outside-Karnataka markers)
  representation.js      Representation & completeness section (Rajyotsava only)
  wikidraft.js           Wikipedia draft-stub generator for recipients without an article
data/
  awards.json            Registry — one entry per award (all 23 active; 19 with data files, 4 placeholders)
  awards/<id>.json       One recipient array per award
  sources.json           Citation registry — one entry per source page, keyed by source_id
  district_counts.json   District-level aggregation for the map (incl. other_locations)
  karnataka-districts.geojson / karnataka-state.geojson   Map boundary layers
  representation.json    Precomputed gender/completeness stats (Rajyotsava only)
  quickstatements_*.tsv  Per-award Wikidata QuickStatements batches (with S854 source URLs)
scripts/
  geocode_locations.py   WIP geocoding pipeline (Wikidata P19/P551 → district counts per award)
```

## Deploy (GitHub Pages)

```bash
git push origin main
```

Settings → Pages: source = `main` branch, root folder. Custom domain is read from the `CNAME`
file (`prashasti.sanchaya.net`); DNS is a `CNAME` record for `prashasti` pointing at the org's
`github.io` target.

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — architecture, award registry + per-recipient schema, extending
- [docs/DATA.md](docs/DATA.md) — active datasets, data provenance, Wikidata/QuickStatements workflow, map data notes

## License

Recipient data is derived from Wikipedia text and offered under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Site code (HTML/CSS/JS) is
public domain.
