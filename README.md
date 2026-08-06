# ಪ್ರಶಸ್ತಿ ಸಂಚಯ — Prashasti Sanchaya

A static, multi-award, bilingual (English/Kannada) site cataloguing recipients of Karnataka's
and Kannadigas' major civilian and literary honours. Built to sit alongside
[fonts.sanchaya.net](https://fonts.sanchaya.net) as part of the same family of Sanchaya
projects — same visual language, same "gaps are labelled, not hidden" ethos.

**Suggested subdomain: `prashasti.sanchaya.net`**. Branding isn't hardcoded to one award — see
**Architecture** below — so this is genuinely a multi-award platform, not a single-purpose site
that happens to have a dropdown.

**Live demo:** *(fill in once deployed — see Publishing below)*

---

## Quick start

```bash
git clone https://github.com/sanchaya/prashasti.git
cd prashasti
python3 -m http.server 8000
# open http://localhost:8000
```

No build step, no framework, no `npm install`. Browsers block `fetch()` on `file://` URLs, so
you do need *some* local server — `python3 -m http.server` is the simplest option, but any
static file server works.

---

## Architecture

```
index.html              All markup, incl. data-i18n attributes for translation
css/style.css            Single stylesheet, CSS custom properties for theming
js/
  i18n.js                 EN/KN dictionaries + Sanchi18n helper (translation, field-name lookup)
  app.js                  Core app: award switching, filtering, browse list, timeline, provenance
  map.js                  SanchiMap — Leaflet district map, award-aware (only loads if the
                           award's registry entry has has_location_data: true)
  representation.js       Renders the Representation & Completeness section (Rajyotsava-only
                           right now — see has_representation_data below)
  wikidraft.js             Wikipedia draft-stub generator for recipients with no article yet
data/
  awards.json              THE REGISTRY — one entry per award, active or planned (see below)
  awards/<id>.json          One recipient array per active award
  district_counts.json      District-level aggregation for the map (Rajyotsava only)
  representation.json       Precomputed gender/completeness stats (Rajyotsava only)
  quickstatements_*.tsv     Per-award Wikidata QuickStatements batches (generated, not live)
  missing_award_list.json   Human-readable version of the Rajyotsava Wikidata gap list
```

Everything is client-side. `app.js` fetches `data/awards.json` on load, finds the first
`"status": "active"` entry, loads its `data_file`, and renders. Switching awards in the nav
re-fetches and re-renders in place — no page reload.

### The award registry (`data/awards.json`)

Each entry looks like this:

```json
{
  "id": "karnataka-ratna",
  "status": "active",
  "data_file": "data/awards/karnataka-ratna.json",
  "name_en": "Karnataka Ratna",
  "name_kn": "ಕರ್ನಾಟಕ ರತ್ನ",
  "desc_en": "Karnataka's highest civilian honour, conferred since 1992.",
  "desc_kn": "...",
  "recipients": 11,
  "year_range": "1992–2025",
  "level": "state",
  "wikidata_qid": "Q3630879",
  "has_location_data": false,
  "has_representation_data": false,
  "quickstatements_file": "data/quickstatements_karnataka_ratna.tsv",
  "hero_en": "Karnataka's highest civilian honour — instituted in 1992...",
  "hero_kn": "..."
}
```

- `status: "active"` awards are clickable in the nav switcher and have a real `data_file`.
- `status: "planned"` awards show up greyed-out with a "Coming soon" pill — this is
  deliberate, to show the platform's shape before every award is built out. Currently planned:
  Pampa Award, Attimabbe Award, Nadoja Award, Sahitya Akademi (Kannada), Kempegowda Award.
- `has_location_data` / `has_representation_data` gate whether the Map and Representation
  sections render at all for that award. Both are `true` only for Rajyotsava Prashasti right
  now, since district and demographic data haven't been compiled for the smaller awards yet
  (see **Extending this project** below for what that would take).
- `hero_en` / `hero_kn` are the one-line blurbs under the H1 — falls back to `desc_en`/`desc_kn`
  if absent. **Don't** let these fall back silently for a new award without checking the
  copy makes sense; a generic description reading as a hero line can sound off.

### Per-recipient schema (`data/awards/<id>.json`)

```json
{
  "year": 1992,
  "name": "Kuvempu",
  "field": "Literature",
  "location": null,
  "wikipedia_url": "https://en.wikipedia.org/wiki/Kuvempu",
  "wikidata_qid": "Q3351108",
  "has_wikidata_statement": false,
  "source": "en+kn Wikipedia, cross-checked"
}
```

`has_wikidata_statement` is `true`/`false` if we checked Wikidata for the `award received`
(P166) statement pointing at this specific award, or `null` if we never checked (this matters —
`null` and `false` are rendered differently; don't conflate them when adding new data).

---

## The four datasets currently active

| Award | Recipients | Years | Level | Notes |
|---|---|---|---|---|
| **Rajyotsava Prashasti** | 2,102 | 1966–2025 | State (2nd highest) | The original build. Has map + representation data. |
| **Karnataka Ratna** | 11 | 1992–2025 | State (highest) | 9 of 11 are missing the Wikidata statement — genuinely under-documented. |
| **Jnanpith Award (Kannada)** | 8 | 1967–2010 | National | Fully documented on Wikidata already — nothing to contribute there. |
| **Bharat Ratna (Kannadigas)** | 3 | 1955–2014 | National (highest of all) | Same — fully documented. |

All four were cross-checked against **both English and Kannada Wikipedia**. That cross-check
caught a real discrepancy once: English Wikipedia's Karnataka Ratna table included a 2025
addition (B. Saroja Devi) that Kannada Wikipedia's version didn't have yet. Neither language is
reliably more current — check both, every time, for any award you add.

---

## Extending this project

**To add a new award** (e.g. Pampa Award, already a "planned" placeholder):

1. Research and pull recipient data — check both English and Kannada Wikipedia; cross-reference
   Wikidata for QIDs and the `award received` (P166) statement, same pattern as the four above.
2. Write `data/awards/<id>.json` in the schema above.
3. Flip its `data/awards.json` entry from `"planned"` to `"active"`, add `data_file`, and fill
   in `hero_en`/`hero_kn`.
4. If you have district-level location data for it, add a `district_counts.json`-style file,
   point to it via `district_data_file` in the registry entry, and set `has_location_data: true`.
5. Representation/completeness analysis (gender via Wikidata P21, data completeness bars) is
   currently hand-rolled per award in `representation.js` / `app.js` rather than fully
   generalized — extending it to a second award means either generalizing that code path or
   accepting it stays Rajyotsava-only for now. Worth doing properly rather than copy-pasting.
6. If any recipients are missing the Wikidata statement, generate a `quickstatements_*.tsv`
   batch (see the Wikidata section below) and reference it via `quickstatements_file`.

**To add a new UI language:** add a language block to `DICT` in `js/i18n.js`, add a
`<button class="lang-btn" data-lang="xx">` to the nav in `index.html`, and add `xx` field-name
entries to `FIELD_KN`-style lookup if you want field categories translated too (otherwise they
fall back to English, which is safe but not ideal).

---

## The map

"Where they're from" (Rajyotsava only, currently) plots recipients by home district on a light
Leaflet/OpenStreetMap base, circle size proportional to count. District attribution only
survives in Wikipedia's coverage of later award years, so the map represents 442 of 2,102
recipients — a sample, not the full roll, and the page says so. District names were normalized
from messy source variants (Bangalore/Bengaluru, Kalaburgi/Kalaburagi, South Kannada/Dakshina
Kannada, etc.); a handful of unusual entries didn't match a known district and were dropped
rather than guessed at.

## Representation & data completeness

Also Rajyotsava-only right now. Covers: what fraction of records have a field/district/
Wikipedia/Wikidata link at all (most of the roll doesn't — that's the headline finding, not any
single demographic gap); gender by decade, pulled from Wikidata's P21 property for the 14.7% of
recipients with a Wikidata item (**not** inferred from names — deliberately, since name-based
inference is unreliable and risks encoding stereotypes); and what's sitting in Wikidata ready to
pull in (photos, occupation, birthplace, death status). Caste, community, and religion are
excluded by design — Wikipedia/Wikidata rarely record them, and this project won't guess.

## Wikipedia draft generator

For recipients without a Wikipedia article — most of the Rajyotsava roll, none of the other
three — `js/wikidraft.js` generates a wikitext stub (infobox, intro sentence, category tags,
`{{citation needed}}` placeholders) from the structured data on file. This is template output,
not AI-written biography prose: Wikipedia's own norms are wary of auto-generated bios, so the
draft is deliberately a skeleton for a human to source and expand, not a finished article.

## Contributing to Wikidata

Each active award's Wikidata coverage is computed live in the browser from
`has_wikidata_statement` in its data file, and the "Fill the gaps" section adapts its own
copy accordingly — full credit-batch UI for awards with gaps, a plain "fully documented,
nothing to add" message for ones without (Jnanpith, Bharat Ratna).

Where there's a QuickStatements batch (`data/quickstatements_batch.tsv` for Rajyotsava,
`data/quickstatements_karnataka_ratna.tsv` for Karnataka Ratna), each line adds an
`award received` (P166) statement with the award year as a qualifier:

```
qid	P166	qal585
Q3351108	P166	Q3630879	P585	+1992-11-01T00:00:00Z/11
...
```

To submit: log in to **your own** Wikidata account, open
[quickstatements.toolforge.org](https://quickstatements.toolforge.org/), authorise it via
Wikidata's own OAuth screen (your credentials never pass through this project or through
Claude), paste the batch under "Import commands (v1)", review the preview, and run it.

## Where the Rajyotsava data comes from

The original request was to pull this from
[kannadasiri.karnataka.gov.in](https://kannadasiri.karnataka.gov.in/203/rajyotsavsa), but that
site disallows automated access (`robots.txt`). Built instead from Wikipedia's own record —
decade list pages for 1966–2000, individual `Rajyotsava Awards (year)` pages for 2003–2022, and
contemporaneous news coverage for 2023 and 2025 (no dedicated Wikipedia page exists yet for
either). Full gap-by-gap breakdown is on the site itself, under "About the data," and worth
reading before treating any year as complete — 1977–1980 and 2009 the award simply wasn't
given; 1992–2002, 2017–2018, and 2024 are genuine documentation gaps, not zero-recipient years.

## Publishing to GitHub Pages

This repo is already git-initialized with a `CNAME` file for `prashasti.sanchaya.net`.

```bash
git push -u origin main
```

Then in **Settings → Pages**: source = `main` branch, root folder. Add the custom domain
(reads from `CNAME` automatically) and enable "Enforce HTTPS" once GitHub's certificate is
issued. DNS side: a `CNAME` record for `prashasti` pointing at the org's `github.io` target.

## License

Recipient data is derived from Wikipedia text and offered under the same terms,
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Site code (HTML/CSS/JS) is
public domain — do whatever you like with it.
