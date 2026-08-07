# Data

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

## Government-sourced awards (Kanaka Shri, T. Chowdaiah, Varnashilpi Venkatappa,
## Jakanachari, Akkamahadevi, Basava Puraskara, Sangolli Rayanna)

These seven have no usable Wikipedia list (mostly stubs or no page at all), so they were built
from karnataka.gov.in's own "State Awards" recipient pages (Dept. of Kannada & Culture), which
the department last updated in 2020 — years after that are not reflected. Names are stripped of
honorifics (Shri/Smt/Dr/Pandit/etc.) and split from a trailing location where the source listed
one; no per-record `wikipedia_url` or `wikidata_qid` was looked up (unlike the Wikipedia-sourced
awards), since that would mean a manual disambiguation pass per name rather than a bulk pull —
left for a future pass. Ganayogi Panchakshari Gawai Award has no list on this portal or on
Wikipedia and remains a placeholder.

## Karnataka State Film Award (Best Film)

The film award family has dozens of categories (Best Film, Director, Actor, Actress,
Screenplay, Playback Singer, and more), each documented on its own Wikipedia page — too much
scope for one add-on pass. Only **Best Film** is built (54 films, 1967-68 to 2021, from
[the Best Film Wikipedia page](https://en.wikipedia.org/wiki/Karnataka_State_Film_Award_for_First_Best_Film)).
Records follow the same shape as `national-film-award-best-kannada-film.json`: the film title
is the record's `name`, with `director` and `producer` as separate fields, `field: "Cinema"`,
and no `location` (film awards aren't tied to a district). The other categories remain unbuilt.

## Padma Awards (Karnataka recipients) and Ganayogi Panchakshari Gavai Award

Two more of the original six "genuinely hard" placeholders turned out to be buildable on a
second, deeper pass:

**Padma Awards** — Wikipedia's recipient lists have no state/birthplace column, and a Wikidata
SPARQL cross-reference was blocked by a tool URL-length limit. The actual working source turned
out to be the **Press Information Bureau's own annual Padma Awards press release**
(pib.gov.in), which lists every awardee's State/Country directly in the table. Built from the
2024 and 2025 releases (18 Karnataka recipients, tier — Shri/Bhushan/Vibhushan — stored per
record). Earlier years' PIB releases weren't checked for the same table format; extending
further back is a bounded follow-up, not a dead end. Arjuna, Dronacharya, and Khel Ratna were
investigated the same way — PIB's Sports Ministry releases don't carry a State field at all, so
those three remain placeholders. Khel Ratna (62 people total, ever) and Dronacharya (~159) are
realistically buildable via a per-person Wikipedia birthplace lookup as a future pass; Arjuna
(967+) is a genuine multi-session project, flagged out of scope rather than forced.

**Ganayogi Panchakshari Gavai Award** — a January 2024 Hindu article covering that year's
Karnataka state awards batch named two recipients: Pandit Somnath Maradur (Hindustani vocal,
Dharwad) and Dr. Nagamani Srinath (Carnatic vocal, Mysuru). No consolidated list exists on
Wikipedia or karnataka.gov.in. A third, 2024–25 candidate name turned up only in a search
snippet whose source page wouldn't render on fetch — left out rather than included on
unverifiable grounds.

**Kempegowda Award** stays a placeholder after real investigation: BBMP has never published a
recipient archive online (its site only has a nomination form), English Wikipedia's table is
broken (rows disconnected from their years), Kannada Wikipedia's page is a near-empty stub, and
news coverage only ever names a handful of "notable" honorees out of each year's 30–500+
recipients. There's no path to a genuinely complete list without BBMP publishing one itself.
It is, as of this pass, the only one of the original six "hard" awards still unbuilt.

## Arjuna, Dronacharya, and Khel Ratna (Karnataka recipients)

A second pass found real paths for all three:

- **Khel Ratna** — the full 62-person national roster (1991–92 to present) was reconstructed
  from the Ministry of Youth Affairs & Sports and checked person-by-person for a Karnataka
  connection. 2 confirmed: Pankaj Advani and Sunil Chhetri (both Bengaluru-based). High
  confidence this is complete or very close to it.
- **Dronacharya** — 7 confirmed Karnataka-connected recipients out of ~159 nationally
  (1985–2024), each independently verified. Only ~13 of the 159 names were individually checked
  in this pass; the rest were triaged by surname/institution signals for other states, which is
  reasonable but not a completeness guarantee. Treat as a strong partial list.
- **Arjuna** — the actual unlock was Karnataka's own Dept. of Youth Empowerment and Sports
  publishing its own pre-filtered subset of the national Arjuna roll
  (`ysd.karnataka.gov.in/storage/pdf-files/ARJUNA.pdf`), which made an otherwise-infeasible
  967+-person national list tractable. Only 11 names came out of it, likely reflecting the
  department's own record-keeping gaps (and a ~2023 last-modified date, so 2023–2026 winners
  aren't included) rather than Karnataka's true full count since 1961.

Each record on these three carries a `connection` or `discipline` field noting the specific
basis (born vs. based, in the sports two's case) and pointing at its source, rather than
asserting a bare "Karnataka" tag without explanation.

## Where the Rajyotsava data comes from

The original request was to pull this from
[kannadasiri.karnataka.gov.in](https://kannadasiri.karnataka.gov.in/203/rajyotsavsa), but that
site disallows automated access (`robots.txt`). Built instead from Wikipedia's own record —
decade list pages for 1966–2000, individual `Rajyotsava Awards (year)` pages for 2003–2022, and
contemporaneous news coverage for 2023 and 2025 (no dedicated Wikipedia page exists yet for
either). Full gap-by-gap breakdown is on the site itself, in the admin view under "Provenance."
1977–1980 and 2009 the award simply wasn't given; 1992–2002, 2017–2018, and 2024 are genuine
documentation gaps, not zero-recipient years.

## Map data notes

Each award's map is driven by its own `district_data_file` (falling back to
`data/district_counts.json`, the Rajyotsava roll, when an award has none). Eight awards
currently have one: Rajyotsava Prashasti plus the seven government-sourced awards listed
above (Basava Puraskara, Jakanachari, Varnashilpi Venkatappa, T. Chowdaiah, Kanakashree,
Sangolli Rayanna, Akkamahadevi) — built by aggregating each award's own recipient `location`
values against the same 31-district centroid table, via
`data/awards.json`'s `has_location_data`/`district_data_file` fields. Awards whose source data
carries no location values at all (Pampa, Attimabbe, Nadoja, Sahitya Akademi, Karnataka Ratna,
Jnanpith, Bharat Ratna, National Film Award) correctly show the "no location data" state on the
map rather than a fabricated one.

`data/district_counts.json` aggregates the Rajyotsava roll by district (442 of 2,102 records
carry a district at all — district attribution only survives in Wikipedia's coverage of later
award years). District names were normalized from messy source variants (Bangalore/Bengaluru,
Kalaburgi/Kalaburagi, South Kannada/Dakshina Kannada, etc.) via the alias tables in
`map.js`/`district_counts.json`. The `other_locations` array holds recipients credited to places
outside Karnataka (Mumbai, Chennai, Telangana, the Gulf) with approximate coordinates, plotted
as teal markers; `unmapped` records (e.g. "Non-Resident") have no plot location. The GeoJSON
boundaries come from `udit-001/india-maps-data` (districts) and `civictech-India/DataSetsJson`
(state outline).

## Contributing to Wikidata

Each active award's Wikidata coverage is computed live in the browser from
`has_wikidata_statement` in its data file, and the "Wikidata gaps" admin section adapts its own
copy accordingly — a full credit-batch UI for awards with gaps, a plain "fully documented,
nothing to add" message for ones without (Jnanpith, Bharat Ratna).

Where there's a QuickStatements batch (`data/quickstatements_batch.tsv` for Rajyotsava,
`data/quickstatements_karnataka_ratna.tsv` for Karnataka Ratna), each line adds an
`award received` (P166) statement with the award year as a qualifier and a `reference URL`
(S854) pointing at the source page the record was taken from:

```
qid	P166	qal585	S854
Q3351108	P166	Q3630879	P585	+1992-11-01T00:00:00Z/11	S854	https://en.wikipedia.org/wiki/Karnataka_Ratna
...
```

To submit: log in to **your own** Wikidata account, open
[quickstatements.toolforge.org](https://quickstatements.toolforge.org/), authorise it via
Wikidata's own OAuth screen (your credentials never pass through this project), paste the batch
under "Import commands (v1)", review the preview, and run it.
