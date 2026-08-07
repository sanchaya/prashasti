# Autopilot state — rajyotsava-site (Prashasti Sanchaya)

## Last run
2026-08-07 — first run (no prior state file existed; this seeded it).

## Project shape
Static, no-build, vanilla-JS site. No `package.json`, no bundler. "Verify"
means: `node --check` on every `js/*.js` file, `python3 -m json.tool` (or
`json.load`) on every `data/**/*.json` file, and a cross-check that
`data/awards.json` entries (`data_file`, `district_data_file`, `recipients`
counts) actually match what's on disk. There is no automated test suite and
no CI — that's a standing gap, noted below, not something to silently work
around.

## Conventions observed
- Award registry pattern: `data/awards.json` (metadata) + `data/awards/<id>.json`
  (recipient records) + `data/sources.json` (citation registry, keyed by
  `source_id`). Every recipient record with real provenance carries a
  `source_id` that must resolve in `data/sources.json` — this was checked and
  is currently 100% clean (0 dangling references across all award files).
- District names go through `DISTRICT_ALIAS` + `normalize()` in `js/map.js`
  before ever being compared or plotted — don't compare raw location strings
  directly elsewhere.
- Bilingual strings live in `js/i18n.js` (`DICT` for UI strings, `FIELD_KN`
  for field-category translation). Field-category strings across award data
  were canonicalized in an earlier session (203 → 169 distinct values) —
  don't reintroduce EN/KN duplicate field values when adding new award data;
  check `FIELD_KN` first.
- Git: this sandbox's mounted `.git` directory blocks `unlink` on lock files
  but allows `mv`. Every git operation needs `mv .git/index.lock
  ".git/index.lock.stale.$(date +%s)"` (and same for `HEAD.lock`) run first,
  or you'll see "Operation not permitted" — these are otherwise-harmless
  warnings during add/commit/push, not fatal, but clear the stale lock first
  regardless.

## What this run scanned
- JS syntax (`node --check`) on all 6 files in `js/` — clean.
- JSON validity on every file under `data/` — clean.
- `data/awards.json` cross-referenced against disk: all 23 `data_file` /
  `district_data_file` paths exist; all `recipients` counts match actual
  record counts in their files — clean.
- `data/sources.json`: 38 sources, all unique `source_id`s, zero dangling
  `source_id` references from any award record — clean.
- Grepped for leaked credentials (`ghp_` tokens from earlier session PAT
  usage), TODO/FIXME/XXX comments, stray `console.log` — none found.
- Unicode/mojibake replacement-character scan across award JSON — clean.
- Working tree vs. remote: clean, in sync as of commit `89ca930`.

## Changed this run (Tier A — applied directly)
- `docs/DATA.md`: added a short "Map data notes" paragraph documenting the
  new per-award `district_data_file` mechanism (this was added in the same
  session, just before autopilot ran, so docs would've drifted immediately
  without this). No code changes made by autopilot itself this run — the
  scan came back clean.

## Open proposals — needs your call (Tier B)
1. **No automated test/verification harness.** Verification today is manual
   (`node --check` + JSON validation + the cross-reference script above, all
   ad hoc). Recommend at minimum a small `scripts/verify.sh` or `npm`-free
   Python script that runs those same checks in one command, so it's
   reproducible instead of re-derived each session. Not applied — didn't
   want to introduce a new file/convention without confirming you want it.
2. **9 `fetch()` calls across `js/*.js`, only ~4 wrapped in try/catch.**
   Worth a pass to confirm every fetch (award data, district data, sources)
   fails gracefully in the UI rather than silently leaving a blank section —
   `map.js`'s `load()` already has a try/catch that hides the map section on
   failure; haven't verified the others (`app.js`'s award-switching fetches,
   `wikidraft.js`, `representation.js`) do the same. Flagged, not fixed.
3. **4 placeholder awards remain genuinely unbuildable** with current
   sourcing effort: Kempegowda (Wikipedia table empty/inconsistent),
   Padma/Arjuna/Dronacharya/Khel Ratna (Karnataka subset) — no
   state/birthplace column in any list, and a Wikidata SPARQL shortcut was
   attempted and blocked by a tool URL-length limit. Karnataka State Film
   Award (Best Film category) was mid-build (wikitext already fetched) when
   this session's priorities shifted to the layout/map work — still open.

## Do not touch
(none yet — nothing has been explicitly marked off-limits)

## Plain-English summary
First autopilot run on this project. Everything currently in the repo is
internally consistent — no broken JSON, no dangling source citations, no
missing data files, no leaked credentials, no syntax errors. The one thing
autopilot changed was a doc note that would've otherwise gone stale
immediately. The real open items aren't code-health problems, they're
unfinished feature work from the current session (verification tooling,
fetch error-handling audit, and the remaining 4 hard-to-source awards) —
logged above so the next run (or you) can pick them up with context instead
of re-discovering them.
