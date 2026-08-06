# ಪ್ರಶಸ್ತಿ ಸಂಚಯ — Prashasti Sanchaya

An explorable, static site cataloguing recipients of the **Karnataka Rajyotsava Award**
(Rajyotsava Prashasti), the state's second-highest civilian honour, from its founding in
1966 through 2025. Styled to sit alongside [fonts.sanchaya.net](https://fonts.sanchaya.net)
as part of the same family of projects.

**Suggested subdomain: `prashasti.sanchaya.net`** — ಪ್ರಶಸ್ತಿ ("award/honour") leaves room to
add other Karnataka state honours later under the same roof, the way `fonts.sanchaya.net`
houses many font families. If you'd rather scope it to just this one award,
`rajyotsava.sanchaya.net` is the more literal alternative — the branding in `index.html` and
`css/style.css` doesn't hardcode either, so renaming is just a text change in the `<nav>` and
`<footer>`.

**[Live demo →](#)** *(update this link once you've deployed it — see below)*

## What's here

- `index.html` / `css/style.css` / `js/app.js` — a single-page, client-side site. No build
  step, no framework, no server. Open `index.html` through a local server (or GitHub Pages)
  and it fetches `data/rajyotsava_data.json` and renders everything in the browser.
- `data/rajyotsava_data.json` — **2,102 recipient records** across 40 documented ceremony
  years, each with `year`, `name`, `field`, `location` (where known), `wikipedia_url` (where
  a matching Wikipedia article was found), and `wikidata_qid` (where that article resolves to
  a Wikidata item).
- `data/quickstatements_batch.tsv` — a ready-to-run [QuickStatements](https://quickstatements.toolforge.org/)
  batch. See **Contributing to Wikidata** below.
- `data/missing_award_list.json` — the same list in a more human-readable form, for review
  before you submit anything.
- `data/district_counts.json` — recipient counts by home district (442 of 2,102 records have
  a district attached), used to drive the map.

## The map

"Where they're from" plots recipients by home district on a light Leaflet/OpenStreetMap base,
with circle size proportional to count. District attribution only survives in Wikipedia's
coverage of later award years, so the map represents 442 recipients — a sample, not the full
roll — and says so on the page. District names were normalized from the source data's messy
variants (Bangalore/Bengaluru, Kalaburgi/Kalaburagi, South Kannada/Dakshina Kannada, etc.); a
handful of unusual entries (single-name locations like "Hanumanthapura") didn't match a
district and were dropped rather than guessed at.

## Multi-award, multilingual, Wikipedia drafts

- **Multiple awards.** `data/awards.json` is a registry of awards; `data/awards/` holds one
  JSON file per award. Right now only Rajyotsava Prashasti is `"status": "active"` — Kempegowda
  Award, Nadoja, and BBMP's Kannada Rajyotsava are listed as `"status": "planned"` placeholders
  in the nav's award switcher, just to show the shape. To add a real one: drop a new file in
  `data/awards/`, add an entry to `data/awards.json` with `"status": "active"`, and extend
  `app.js` so the switcher can actually load a different dataset on click (right now it only
  displays the list — wiring up the switch is the next step once there's a second real dataset).
- **English / Kannada toggle.** `js/i18n.js` holds both dictionaries and a `Sanchi18n` helper.
  UI chrome (nav, hero, section text, buttons, legends, provenance notes) is fully translated.
  Recipient *data* (names) stays as-is — these are proper nouns. Field categories (Literature,
  Music, Folklore, etc.) are translated for the ~40 most common values via a lookup table in
  `i18n.js`; less common or compound field labels (e.g. "Yakshagana/Theatre") fall back to
  English rather than risk a bad machine translation. Add more entries to `FIELD_KN` in
  `i18n.js` to extend coverage.
- **Wikipedia draft generator.** The "Draft a Wikipedia article" section (`js/wikidraft.js`)
  lets you search recipients who don't have a Wikipedia article yet, and generates a starting
  wikitext stub (infobox, intro sentence, category tags, `{{citation needed}}` placeholders)
  from the structured data we have. This is template-generated, not AI-written prose —
  Wikipedia's own norms are wary of auto-generated biographies, so the draft is deliberately a
  skeleton you flesh out with real sources, not a finished article. Every recipient row without
  a Wikipedia badge has a "+ draft article" pill that jumps straight to this section with that
  person pre-loaded.

## Where the data comes from

The original request was to pull this from
[kannadasiri.karnataka.gov.in](https://kannadasiri.karnataka.gov.in/203/rajyotsavsa), but that
site disallows automated access (`robots.txt`). Instead, this project draws on **Wikipedia's**
own record of the awards:

- `List of Rajyotsava Award recipients (1966–1970)`, `(1971–1976)`, `(1981–1990)`,
  `(1991–2000)` — Wikipedia's decade-by-decade tables.
- `Rajyotsava Awards (2003)` through `(2022)` — Wikipedia's individual year pages, where they
  exist.
- 2023 and 2025 — no dedicated Wikipedia page exists yet, so these were sourced from
  contemporaneous news coverage (Business Standard for 2023, Coastal Digest for 2025) and
  cross-checked for internal consistency.

**Known gaps**, documented in the site's own "Where this data comes from" section and worth
repeating here:

| Years | Status |
|---|---|
| 1977–1980, 2009 | The award was **not conferred** those years — not a data gap. |
| 1992–2002 | Wikipedia's own record is thin to nonexistent for most of this stretch. |
| 2017–2018 | No dedicated Wikipedia page was found. |
| 2024 | 69 recipients were announced, but no clean structured English-language list was
found in the time available — not yet included as individual rows. |

If you want a *complete* register, the next step is either OCR'ing the Karnataka government's
own archived PDF list (linked from several Wikipedia citations, via the Wayback Machine) or
manually transcribing the 2024 winners list from Kannada-language coverage.

## Running it locally

Browsers block `fetch()` on `file://` URLs, so don't just double-click `index.html`. From this
folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Publishing to GitHub Pages

This repo is ready to push as-is:

```bash
git init
git add .
git commit -m "Rajyotsava Prashasti ledger"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Then in the repo's **Settings → Pages**, set the source to the `main` branch, root folder. The
site will be live at `https://<your-username>.github.io/<repo-name>/` a minute or two later.

## Contributing to Wikidata

Wikipedia already links 342 of these recipients to their own biography articles; 311 of those
resolve to a Wikidata item. Of those 311, only 5 currently record *this specific award* as a
fact (`award received (P166)` → `Rajyotsava Prashasti (Q7286513)`). The other **306** are
missing that one statement — a small, well-defined, genuinely useful gap to fill.

`data/quickstatements_batch.tsv` contains one line per person:

```
qid	P166	qal585
Q3347911	P166	Q7286513	P585	+1966-11-01T00:00:00Z/11
...
```

Each line adds "award received: Rajyotsava Prashasti" with the award year as a qualifier. To
submit it:

1. Log in to **your own** account at [wikidata.org](https://www.wikidata.org/wiki/Special:UserLogin)
   (create one first if you don't have one — it's free and takes a minute).
2. Open [quickstatements.toolforge.org](https://quickstatements.toolforge.org/) and authorise
   it via Wikidata's OAuth screen. This is a one-click consent flow between your browser and
   Wikidata directly — no password or token ever passes through this project or through
   Claude.
3. Paste the contents of `quickstatements_batch.tsv` into "Import commands (v1)", review the
   preview QuickStatements generates, and run the batch.

Worth skimming `missing_award_list.json` first — it's the same 306 names in plain JSON, useful
for spot-checking a few entries before you commit to the batch.

## License

The recipient data is derived from Wikipedia text and is offered under the same terms,
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Site code (HTML/CSS/JS) is
public domain / do whatever you like with it.
