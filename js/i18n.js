// Prashasti Sanchaya — i18n
// Two languages for now (English, Kannada). Add more by adding a key to DICT and
// an <option> to the language switcher in index.html.

const DICT = {
  en: {
    nav_browse: "Browse", nav_map: "Map", nav_wikidata: "Wikidata", nav_representation: "Representation", nav_about: "About the data",
    award_label: "Award", coming_soon: "Coming soon",
    eyebrow: "A Sanchaya project · Government of Karnataka's second-highest civilian honour",
    hero_h1: "Every Rajyotsava Prashasti recipient on record",
    hero_desc: "Every November 1st since 1966, Karnataka has honoured its own — writers, wrestlers, folk artists, scientists, midwives, soldiers. This collects that honour roll in one searchable place, built from Wikipedia's own record of the awards and cross-checked against Wikidata.",
    search_placeholder: "Search a name, field, or district…",
    search_btn: "Search",
    stat_total: "Recipients on record", stat_years: "Ceremonies, 1966–2025",
    stat_fields: "Fields of achievement", stat_wiki: "Have a Wikipedia article",

    tl_title: "Recipients by year",
    tl_desc: "Each bar is one ceremony. Height is how many were honoured that year. Gaps are years the award wasn't given, or years Wikipedia's own record is thin — both are labelled, not hidden. Click a year to filter the list below.",
    tl_legend_full: "documented year", tl_legend_gap: "not awarded that year", tl_legend_thin: "award given, but Wikipedia's record is incomplete",

    map_title: "Where they're from",
    map_desc_pre: "District attribution only appears in Wikipedia's coverage of the more recent award years, so this map reflects",
    map_desc_post: "recipients with a known district — a sample, not the full roll. Circle size is how many recipients came from that district.",
    map_footnote: (n) => `${n} recipients were credited to a location outside Karnataka (Mumbai, Chennai, NRI Kannadigas abroad, etc.) and aren't plotted here.`,

    browse_title: "Browse the roll",
    browse_desc: "Search by name, field, or district. This filters the full register.",
    filter_all_fields: "All fields", filter_all_years: "All years", filter_clear: "Clear",
    result_count: (shown, total, filtered) => filtered ? `${shown.toLocaleString()} recipients (of ${total.toLocaleString()})` : `${shown.toLocaleString()} recipients`,
    load_more: "Show more",
    badge_wikipedia: "wikipedia", badge_draft: "draft article",

    wd_title: "Fill the gaps on Wikidata",
    wd_desc: (missing) => `Wikipedia's award-list pages already link 342 recipients to their own biography articles, and 311 of those have a Wikidata item. Of those, only 5 currently record this specific award as a fact (award received → Rajyotsava Prashasti). The rest — ${missing} people — are missing that one statement.`,
    wd_col1_h: "What this project can do",
    wd_col1_li1: "Compiled a ready-to-run QuickStatements batch — one line per person, adding P166 → Q7286513 (award received → Rajyotsava Prashasti) with the year as a qualifier.",
    wd_col1_li2: "Left every statement unreviewed and unsent — nothing is written to Wikidata until you submit it yourself.",
    wd_download: "Download the QuickStatements batch (.tsv)",
    wd_col2_h: "What this site can't do",
    wd_col2_desc: "This project doesn't handle Wikidata credentials or log in on your behalf — that stays entirely in your hands, on Wikidata's own site. Submitting is three steps:",
    wd_step1: "Log in to your own account at wikidata.org.",
    wd_step2: "Open quickstatements.toolforge.org and authorise it via Wikidata OAuth (a one-click consent screen — your login is never shared with this site).",
    wd_step3: "Paste in the downloaded batch under \"Import commands (v1)\", review the preview it generates, and run it.",

    wp_title: "Draft a Wikipedia article",
    wp_desc: "Recipients without a badge above don't have a Wikipedia article yet. Pick one from the list and this generates a starting wikitext draft from what we know — you fill in the sourcing and prose Wikipedia needs, then submit it yourself.",
    wp_picker_placeholder: "Type a name without a Wikipedia article…",
    wp_notability_h: "Before you draft",
    wp_notability: "Wikipedia's notability guideline for biographies (WP:ANYBIO) generally treats recipients of a well-known, significant state honour as a good starting case for notability — but the article still needs independent, reliable sources (news coverage, books, official citations) beyond the award announcement itself. If you can't find at least one or two, it may not be ready yet.",
    wp_generate: "Generate draft",
    wp_copy: "Copy wikitext", wp_download: "Download as .txt",
    wp_steps_h: "Submitting it",
    wp_step1: "Log in to your own account at en.wikipedia.org (new accounts are easiest via Articles for Creation, below).",
    wp_step2: "Open the Article Wizard and paste the draft in as a new Draft page.",
    wp_step3: "Replace every [citation needed] with a real source, and expand the prose beyond the stub.",
    wp_step4: "Submit for review via Articles for Creation — an experienced editor will check it before it goes live.",

    prov_title: "Where this data comes from — and where it thins out",
    prov_sub: "In the spirit of every Sanchaya project: gaps are labelled, not hidden.",

    rep_title: "Representation & data completeness",
    rep_sub: "Who's missing from this list is as important as who's on it — and honestly, the biggest gap is in our data, not necessarily in who got the award.",
    rep_completeness_h: "How much of the roll is actually linked up",
    rep_completeness_note: "Every other stat on this page only describes the sliver of records with that data — treat percentages below as a lower bound on the real picture, not the full picture.",
    rep_field_bar: "Have a field/category", rep_location_bar: "Have a district", rep_wikipedia_bar: "Have a Wikipedia article", rep_wikidata_bar: "Have a Wikidata item",
    rep_gender_h: "Gender, from Wikidata records",
    rep_gender_summary: (female_pct, n, total_pct) => `Among the ${n} recipients with a Wikidata item (${total_pct}% of the full roll), women make up ${female_pct}%.`,
    rep_gender_caveat: "Pulled from Wikidata's own sex-or-gender property for the recipients who have an item there — not inferred from names. Since Wikidata coverage itself likely skews toward better-documented recipients, this is probably a ceiling on the true share, not the true number.",
    rep_district_h: "Districts",
    rep_district_summary: (n, pct, represented, totalD) => `${n} recipients (${pct}% of the full roll) have a district on record, spread across all ${represented} of Karnataka's ${totalD} districts. Lowest counts in the sample:`,
    rep_district_caveat: "All 31 districts appear somewhere in the sample, so nothing is at a confirmed zero — but with fewer than a quarter of records carrying a district at all, that's a statement about what we can see, not about what's true.",
    rep_enrich_h: "What's sitting in Wikidata, ready to pull in",
    rep_enrich_note: "Percentages are of the recipients who have a Wikidata item, not the full roll. Caste, community, and religion aren't included here by design — Wikipedia/Wikidata rarely record them, and guessing from names is unreliable and not something this project will do. That data would need to come from the Karnataka government's own award records, if they record it.",
    rep_photo_bar: "Have a photo", rep_occupation_bar: "Have occupation detail", rep_birthplace_bar: "Have a birthplace", rep_deceased_bar: "Recorded as deceased",

    footer_tagline: "A Sanchaya project",
    footer_desc: "Built as a static, client-side site — no server, no tracking. Data licensed the same as its sources (Wikipedia text is CC BY-SA; treat this dataset the same way). Source: Wikipedia's Rajyotsava award-list pages and contemporaneous news coverage, cross-referenced with Wikidata.",
  },
  kn: {
    nav_browse: "ಪಟ್ಟಿ", nav_map: "ನಕ್ಷೆ", nav_wikidata: "ವಿಕಿಡೇಟಾ", nav_representation: "ಪ್ರಾತಿನಿಧ್ಯ", nav_about: "ದತ್ತಾಂಶದ ಬಗ್ಗೆ",
    award_label: "ಪ್ರಶಸ್ತಿ", coming_soon: "ಶೀಘ್ರದಲ್ಲಿ ಬರಲಿದೆ",
    eyebrow: "ಒಂದು ಸಂಚಯ ಯೋಜನೆ · ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಎರಡನೇ ಅತ್ಯುನ್ನತ ನಾಗರಿಕ ಗೌರವ",
    hero_h1: "ದಾಖಲಾಗಿರುವ ಪ್ರತಿಯೊಬ್ಬ ರಾಜ್ಯೋತ್ಸವ ಪ್ರಶಸ್ತಿ ಪುರಸ್ಕೃತ",
    hero_desc: "1966ರಿಂದ ಪ್ರತಿ ನವೆಂಬರ್ 1ರಂದು, ಕರ್ನಾಟಕ ತನ್ನವರನ್ನು ಗೌರವಿಸುತ್ತಾ ಬಂದಿದೆ — ಸಾಹಿತಿಗಳು, ಕುಸ್ತಿಪಟುಗಳು, ಜಾನಪದ ಕಲಾವಿದರು, ವಿಜ್ಞಾನಿಗಳು, ಸೂಲಗಿತ್ತಿಯರು, ಯೋಧರು. ಇದು ಆ ಗೌರವ ಪಟ್ಟಿಯನ್ನು ಒಂದೇ ಕಡೆ ಹುಡುಕಬಹುದಾದಂತೆ ಸಂಗ್ರಹಿಸುತ್ತದೆ, ವಿಕಿಪೀಡಿಯಾದ ದಾಖಲೆಗಳಿಂದ ಸಂಗ್ರಹಿಸಿ ವಿಕಿಡೇಟಾದೊಂದಿಗೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.",
    search_placeholder: "ಹೆಸರು, ಕ್ಷೇತ್ರ, ಅಥವಾ ಜಿಲ್ಲೆ ಹುಡುಕಿ…",
    search_btn: "ಹುಡುಕಿ",
    stat_total: "ದಾಖಲಾದ ಪುರಸ್ಕೃತರು", stat_years: "ಸಮಾರಂಭಗಳು, 1966–2025",
    stat_fields: "ಸಾಧನಾ ಕ್ಷೇತ್ರಗಳು", stat_wiki: "ವಿಕಿಪೀಡಿಯಾ ಲೇಖನ ಇರುವವರು",

    tl_title: "ವರ್ಷವಾರು ಪುರಸ್ಕೃತರು",
    tl_desc: "ಪ್ರತಿ ಪಟ್ಟಿಯೂ ಒಂದು ಸಮಾರಂಭ. ಎತ್ತರ ಆ ವರ್ಷ ಗೌರವಿಸಲ್ಪಟ್ಟವರ ಸಂಖ್ಯೆ. ಪ್ರಶಸ್ತಿ ನೀಡದ ವರ್ಷಗಳು ಅಥವಾ ವಿಕಿಪೀಡಿಯಾದ ದಾಖಲೆ ಕಡಿಮೆ ಇರುವ ವರ್ಷಗಳನ್ನು ಗುರುತಿಸಲಾಗಿದೆ, ಮರೆಮಾಡಿಲ್ಲ. ಕೆಳಗಿನ ಪಟ್ಟಿಯನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಲು ಒಂದು ವರ್ಷವನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ.",
    tl_legend_full: "ದಾಖಲಾದ ವರ್ಷ", tl_legend_gap: "ಆ ವರ್ಷ ಪ್ರಶಸ್ತಿ ನೀಡಿಲ್ಲ", tl_legend_thin: "ಪ್ರಶಸ್ತಿ ನೀಡಲಾಗಿದೆ, ಆದರೆ ವಿಕಿಪೀಡಿಯಾ ದಾಖಲೆ ಅಪೂರ್ಣ",

    map_title: "ಅವರು ಎಲ್ಲಿಂದ ಬಂದವರು",
    map_desc_pre: "ಜಿಲ್ಲಾ ಮಾಹಿತಿ ಇತ್ತೀಚಿನ ವರ್ಷಗಳ ವಿಕಿಪೀಡಿಯಾ ದಾಖಲೆಗಳಲ್ಲಿ ಮಾತ್ರ ಕಂಡುಬರುತ್ತದೆ, ಆದ್ದರಿಂದ ಈ ನಕ್ಷೆ",
    map_desc_post: "ಜಿಲ್ಲೆ ತಿಳಿದಿರುವ ಪುರಸ್ಕೃತರನ್ನು ತೋರಿಸುತ್ತದೆ — ಇದು ಪೂರ್ಣ ಪಟ್ಟಿಯಲ್ಲ, ಒಂದು ಮಾದರಿ. ವೃತ್ತದ ಗಾತ್ರ ಆ ಜಿಲ್ಲೆಯ ಪುರಸ್ಕೃತರ ಸಂಖ್ಯೆ.",
    map_footnote: (n) => `${n} ಪುರಸ್ಕೃತರನ್ನು ಕರ್ನಾಟಕದ ಹೊರಗಿನ ಸ್ಥಳಕ್ಕೆ (ಮುಂಬೈ, ಚೆನ್ನೈ, ವಿದೇಶದ ಕನ್ನಡಿಗರು, ಇತ್ಯಾದಿ) ಗುರುತಿಸಲಾಗಿದೆ ಮತ್ತು ಇಲ್ಲಿ ತೋರಿಸಿಲ್ಲ.`,

    browse_title: "ಪಟ್ಟಿಯನ್ನು ವೀಕ್ಷಿಸಿ",
    browse_desc: "ಹೆಸರು, ಕ್ಷೇತ್ರ, ಅಥವಾ ಜಿಲ್ಲೆಯಿಂದ ಹುಡುಕಿ. ಇದು ಪೂರ್ಣ ನೋಂದಣಿಯನ್ನು ಫಿಲ್ಟರ್ ಮಾಡುತ್ತದೆ.",
    filter_all_fields: "ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳು", filter_all_years: "ಎಲ್ಲಾ ವರ್ಷಗಳು", filter_clear: "ಅಳಿಸಿ",
    result_count: (shown, total, filtered) => filtered ? `${shown.toLocaleString()} ಪುರಸ್ಕೃತರು (ಒಟ್ಟು ${total.toLocaleString()}ರಲ್ಲಿ)` : `${shown.toLocaleString()} ಪುರಸ್ಕೃತರು`,
    load_more: "ಇನ್ನಷ್ಟು ತೋರಿಸಿ",
    badge_wikipedia: "ವಿಕಿಪೀಡಿಯಾ", badge_draft: "ಡ್ರಾಫ್ಟ್ ಲೇಖನ",

    wd_title: "ವಿಕಿಡೇಟಾದಲ್ಲಿ ಕೊರತೆ ತುಂಬಿಸಿ",
    wd_desc: (missing) => `ವಿಕಿಪೀಡಿಯಾದ ಪ್ರಶಸ್ತಿ ಪಟ್ಟಿ ಪುಟಗಳು ಈಗಾಗಲೇ 342 ಪುರಸ್ಕೃತರನ್ನು ಅವರ ಜೀವನಚರಿತ್ರೆ ಲೇಖನಗಳಿಗೆ ಜೋಡಿಸಿವೆ, ಮತ್ತು ಅವುಗಳಲ್ಲಿ 311ಕ್ಕೆ ವಿಕಿಡೇಟಾ ಐಟಂ ಇದೆ. ಅವುಗಳಲ್ಲಿ, ಕೇವಲ 5 ಮಾತ್ರ ಈ ನಿರ್ದಿಷ್ಟ ಪ್ರಶಸ್ತಿಯನ್ನು ಸತ್ಯವಾಗಿ ದಾಖಲಿಸಿವೆ (award received → Rajyotsava Prashasti). ಉಳಿದ ${missing} ಜನರಿಗೆ ಆ ಒಂದು ಹೇಳಿಕೆ ಕೊರತೆಯಿದೆ.`,
    wd_col1_h: "ಈ ಯೋಜನೆ ಏನು ಮಾಡಬಲ್ಲದು",
    wd_col1_li1: "ಸಿದ್ಧ QuickStatements ಬ್ಯಾಚ್ ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ — ಪ್ರತಿ ವ್ಯಕ್ತಿಗೆ ಒಂದು ಸಾಲು, P166 → Q7286513 (award received → Rajyotsava Prashasti) ಸೇರಿಸುತ್ತದೆ, ವರ್ಷವನ್ನು ಕ್ವಾಲಿಫೈಯರ್ ಆಗಿ.",
    wd_col1_li2: "ಪ್ರತಿ ಹೇಳಿಕೆಯನ್ನು ಪರಿಶೀಲಿಸದೆ, ಕಳುಹಿಸದೆ ಬಿಡಲಾಗಿದೆ — ನೀವೇ ಸಲ್ಲಿಸುವವರೆಗೆ ವಿಕಿಡೇಟಾಗೆ ಏನೂ ಬರೆಯಲಾಗುವುದಿಲ್ಲ.",
    wd_download: "QuickStatements ಬ್ಯಾಚ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ (.tsv)",
    wd_col2_h: "ಈ ಸೈಟ್ ಏನು ಮಾಡಲಾರದು",
    wd_col2_desc: "ಈ ಯೋಜನೆ ವಿಕಿಡೇಟಾ ರುಜುವಾತುಗಳನ್ನು ನಿರ್ವಹಿಸುವುದಿಲ್ಲ ಅಥವಾ ನಿಮ್ಮ ಪರವಾಗಿ ಲಾಗಿನ್ ಆಗುವುದಿಲ್ಲ — ಅದು ಸಂಪೂರ್ಣವಾಗಿ ನಿಮ್ಮ ಕೈಯಲ್ಲಿ, ವಿಕಿಡೇಟಾದ ಸ್ವಂತ ಸೈಟ್‌ನಲ್ಲಿ ಇರುತ್ತದೆ. ಸಲ್ಲಿಸುವುದು ಮೂರು ಹಂತಗಳು:",
    wd_step1: "wikidata.org ನಲ್ಲಿ ನಿಮ್ಮ ಸ್ವಂತ ಖಾತೆಗೆ ಲಾಗಿನ್ ಆಗಿ.",
    wd_step2: "quickstatements.toolforge.org ತೆರೆಯಿರಿ ಮತ್ತು ವಿಕಿಡೇಟಾ OAuth ಮೂಲಕ ಅಧಿಕೃತಗೊಳಿಸಿ (ಒಂದು ಕ್ಲಿಕ್ ಸಮ್ಮತಿ ಪರದೆ — ನಿಮ್ಮ ಲಾಗಿನ್ ಎಂದಿಗೂ ಈ ಸೈಟ್‌ನೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಲಾಗುವುದಿಲ್ಲ).",
    wd_step3: "\"Import commands (v1)\" ಅಡಿಯಲ್ಲಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿದ ಬ್ಯಾಚ್ ಅನ್ನು ಅಂಟಿಸಿ, ಅದು ರಚಿಸುವ ಪೂರ್ವವೀಕ್ಷಣೆಯನ್ನು ಪರಿಶೀಲಿಸಿ, ಮತ್ತು ಅದನ್ನು ರನ್ ಮಾಡಿ.",

    wp_title: "ವಿಕಿಪೀಡಿಯಾ ಲೇಖನ ಕರಡು ರಚಿಸಿ",
    wp_desc: "ಮೇಲೆ ಬ್ಯಾಡ್ಜ್ ಇಲ್ಲದ ಪುರಸ್ಕೃತರಿಗೆ ಇನ್ನೂ ವಿಕಿಪೀಡಿಯಾ ಲೇಖನ ಇಲ್ಲ. ಪಟ್ಟಿಯಿಂದ ಒಬ್ಬರನ್ನು ಆಯ್ಕೆಮಾಡಿ, ಇದು ನಮಗೆ ತಿಳಿದಿರುವುದರಿಂದ ಆರಂಭಿಕ ವಿಕಿಟೆಕ್ಸ್ಟ್ ಕರಡನ್ನು ರಚಿಸುತ್ತದೆ — ವಿಕಿಪೀಡಿಯಾಗೆ ಬೇಕಾದ ಮೂಲಗಳು ಮತ್ತು ಗದ್ಯವನ್ನು ನೀವು ಸೇರಿಸಿ, ನಂತರ ನೀವೇ ಸಲ್ಲಿಸಿ.",
    wp_picker_placeholder: "ವಿಕಿಪೀಡಿಯಾ ಲೇಖನ ಇಲ್ಲದ ಹೆಸರನ್ನು ಟೈಪ್ ಮಾಡಿ…",
    wp_notability_h: "ಕರಡು ಬರೆಯುವ ಮೊದಲು",
    wp_notability: "ಜೀವನಚರಿತ್ರೆಗಳಿಗೆ ವಿಕಿಪೀಡಿಯಾದ ಗಮನಾರ್ಹತೆ ಮಾರ್ಗಸೂಚಿ (WP:ANYBIO) ಸಾಮಾನ್ಯವಾಗಿ ಪ್ರಸಿದ್ಧ, ಮಹತ್ವದ ರಾಜ್ಯ ಗೌರವ ಪಡೆದವರನ್ನು ಗಮನಾರ್ಹತೆಗೆ ಉತ್ತಮ ಆರಂಭಿಕ ಪ್ರಕರಣವಾಗಿ ಪರಿಗಣಿಸುತ್ತದೆ — ಆದರೆ ಲೇಖನಕ್ಕೆ ಪ್ರಶಸ್ತಿ ಘೋಷಣೆಯನ್ನು ಮೀರಿ ಸ್ವತಂತ್ರ, ವಿಶ್ವಾಸಾರ್ಹ ಮೂಲಗಳು (ಸುದ್ದಿ ವರದಿ, ಪುಸ್ತಕಗಳು, ಅಧಿಕೃತ ಉಲ್ಲೇಖಗಳು) ಬೇಕಾಗುತ್ತವೆ. ಕನಿಷ್ಠ ಒಂದೆರಡು ಸಿಗದಿದ್ದರೆ, ಇದು ಇನ್ನೂ ಸಿದ್ಧವಾಗಿಲ್ಲದಿರಬಹುದು.",
    wp_generate: "ಕರಡು ರಚಿಸಿ",
    wp_copy: "ವಿಕಿಟೆಕ್ಸ್ಟ್ ನಕಲಿಸಿ", wp_download: ".txt ಆಗಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    wp_steps_h: "ಸಲ್ಲಿಸುವುದು",
    wp_step1: "en.wikipedia.org ನಲ್ಲಿ ನಿಮ್ಮ ಸ್ವಂತ ಖಾತೆಗೆ ಲಾಗಿನ್ ಆಗಿ (ಹೊಸ ಖಾತೆಗಳಿಗೆ Articles for Creation ಮೂಲಕ ಸುಲಭ).",
    wp_step2: "Article Wizard ತೆರೆಯಿರಿ ಮತ್ತು ಕರಡನ್ನು ಹೊಸ ಡ್ರಾಫ್ಟ್ ಪುಟವಾಗಿ ಅಂಟಿಸಿ.",
    wp_step3: "ಪ್ರತಿ [citation needed] ಅನ್ನು ನಿಜವಾದ ಮೂಲದಿಂದ ಬದಲಾಯಿಸಿ, ಮತ್ತು ಗದ್ಯವನ್ನು ಸ್ಟಬ್‌ಗಿಂತ ವಿಸ್ತರಿಸಿ.",
    wp_step4: "Articles for Creation ಮೂಲಕ ಪರಿಶೀಲನೆಗೆ ಸಲ್ಲಿಸಿ — ಅನುಭವಿ ಸಂಪಾದಕರು ಅದನ್ನು ಪ್ರಕಟಿಸುವ ಮೊದಲು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.",

    prov_title: "ಈ ದತ್ತಾಂಶ ಎಲ್ಲಿಂದ ಬಂತು — ಮತ್ತು ಎಲ್ಲಿ ಕಡಿಮೆಯಾಗುತ್ತದೆ",
    prov_sub: "ಪ್ರತಿ ಸಂಚಯ ಯೋಜನೆಯ ಆಶಯದಂತೆ: ಕೊರತೆಗಳನ್ನು ಗುರುತಿಸಲಾಗಿದೆ, ಮರೆಮಾಡಿಲ್ಲ.",

    rep_title: "ಪ್ರಾತಿನಿಧ್ಯ ಮತ್ತು ದತ್ತಾಂಶ ಪೂರ್ಣತೆ",
    rep_sub: "ಈ ಪಟ್ಟಿಯಲ್ಲಿ ಯಾರು ಇಲ್ಲ ಎಂಬುದು ಯಾರು ಇದ್ದಾರೆ ಎಂಬುದಷ್ಟೇ ಮುಖ್ಯ — ಮತ್ತು ನಿಜ ಹೇಳಬೇಕೆಂದರೆ, ದೊಡ್ಡ ಕೊರತೆ ನಮ್ಮ ದತ್ತಾಂಶದಲ್ಲಿದೆ, ಯಾರಿಗೆ ಪ್ರಶಸ್ತಿ ಸಿಕ್ಕಿದೆ ಎಂಬುದರಲ್ಲಲ್ಲ.",
    rep_completeness_h: "ಪಟ್ಟಿಯ ಎಷ್ಟು ಭಾಗ ನಿಜವಾಗಿ ಜೋಡಿಸಲ್ಪಟ್ಟಿದೆ",
    rep_completeness_note: "ಈ ಪುಟದ ಪ್ರತಿ ಇತರ ಅಂಕಿಅಂಶವೂ ಆ ದತ್ತಾಂಶ ಇರುವ ಸಣ್ಣ ಭಾಗವನ್ನು ಮಾತ್ರ ವಿವರಿಸುತ್ತದೆ — ಕೆಳಗಿನ ಶೇಕಡಾವಾರುಗಳನ್ನು ನಿಜವಾದ ಚಿತ್ರಣದ ಕನಿಷ್ಠ ಮಿತಿಯಾಗಿ ಪರಿಗಣಿಸಿ, ಪೂರ್ಣ ಚಿತ್ರಣವಾಗಿ ಅಲ್ಲ.",
    rep_field_bar: "ಕ್ಷೇತ್ರ/ವರ್ಗ ಇರುವವರು", rep_location_bar: "ಜಿಲ್ಲೆ ಇರುವವರು", rep_wikipedia_bar: "ವಿಕಿಪೀಡಿಯಾ ಲೇಖನ ಇರುವವರು", rep_wikidata_bar: "ವಿಕಿಡೇಟಾ ಐಟಂ ಇರುವವರು",
    rep_gender_h: "ಲಿಂಗ, ವಿಕಿಡೇಟಾ ದಾಖಲೆಗಳಿಂದ",
    rep_gender_summary: (female_pct, n, total_pct) => `ವಿಕಿಡೇಟಾ ಐಟಂ ಇರುವ ${n} ಪುರಸ್ಕೃತರಲ್ಲಿ (ಪೂರ್ಣ ಪಟ್ಟಿಯ ${total_pct}%), ಮಹಿಳೆಯರು ${female_pct}% ಇದ್ದಾರೆ.`,
    rep_gender_caveat: "ವಿಕಿಡೇಟಾ ಐಟಂ ಇರುವ ಪುರಸ್ಕೃತರಿಗೆ ವಿಕಿಡೇಟಾದ ಸ್ವಂತ ಲಿಂಗ ಗುಣಲಕ್ಷಣದಿಂದ ಪಡೆಯಲಾಗಿದೆ — ಹೆಸರುಗಳಿಂದ ಊಹಿಸಿಲ್ಲ. ವಿಕಿಡೇಟಾ ವ್ಯಾಪ್ತಿ ಸ್ವತಃ ಚೆನ್ನಾಗಿ ದಾಖಲಾದ ಪುರಸ್ಕೃತರತ್ತ ವಾಲಿರುವ ಕಾರಣ, ಇದು ಬಹುಶಃ ನಿಜವಾದ ಪಾಲಿನ ಗರಿಷ್ಠ ಮಿತಿ, ನಿಜವಾದ ಸಂಖ್ಯೆ ಅಲ್ಲ.",
    rep_district_h: "ಜಿಲ್ಲೆಗಳು",
    rep_district_summary: (n, pct, represented, totalD) => `${n} ಪುರಸ್ಕೃತರಿಗೆ (ಪೂರ್ಣ ಪಟ್ಟಿಯ ${pct}%) ಜಿಲ್ಲೆ ದಾಖಲಾಗಿದೆ, ಕರ್ನಾಟಕದ ${totalD} ಜಿಲ್ಲೆಗಳಲ್ಲಿ ಎಲ್ಲಾ ${represented} ಜಿಲ್ಲೆಗಳಲ್ಲಿ ಹರಡಿದೆ. ಮಾದರಿಯಲ್ಲಿ ಕಡಿಮೆ ಸಂಖ್ಯೆಗಳು:`,
    rep_district_caveat: "ಎಲ್ಲಾ 31 ಜಿಲ್ಲೆಗಳು ಮಾದರಿಯಲ್ಲಿ ಎಲ್ಲೋ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತವೆ, ಆದ್ದರಿಂದ ಯಾವುದೂ ಖಚಿತ ಶೂನ್ಯದಲ್ಲಿಲ್ಲ — ಆದರೆ ಕಾಲುಭಾಗಕ್ಕಿಂತ ಕಡಿಮೆ ದಾಖಲೆಗಳಿಗೆ ಜಿಲ್ಲೆ ಇರುವುದರಿಂದ, ಇದು ನಮಗೆ ಏನು ಕಾಣುತ್ತದೆ ಎಂಬುದರ ಹೇಳಿಕೆ, ಏನು ನಿಜ ಎಂಬುದರದ್ದಲ್ಲ.",
    rep_enrich_h: "ವಿಕಿಡೇಟಾದಲ್ಲಿ ಏನಿದೆ, ಸೇರಿಸಲು ಸಿದ್ಧ",
    rep_enrich_note: "ಶೇಕಡಾವಾರುಗಳು ವಿಕಿಡೇಟಾ ಐಟಂ ಇರುವ ಪುರಸ್ಕೃತರದ್ದು, ಪೂರ್ಣ ಪಟ್ಟಿಯದ್ದಲ್ಲ. ಜಾತಿ, ಸಮುದಾಯ, ಮತ್ತು ಧರ್ಮವನ್ನು ಉದ್ದೇಶಪೂರ್ವಕವಾಗಿ ಇಲ್ಲಿ ಸೇರಿಸಿಲ್ಲ — ವಿಕಿಪೀಡಿಯಾ/ವಿಕಿಡೇಟಾ ಅಪರೂಪವಾಗಿ ಅವುಗಳನ್ನು ದಾಖಲಿಸುತ್ತವೆ, ಮತ್ತು ಹೆಸರುಗಳಿಂದ ಊಹಿಸುವುದು ವಿಶ್ವಾಸಾರ್ಹವಲ್ಲ ಮತ್ತು ಈ ಯೋಜನೆ ಅದನ್ನು ಮಾಡುವುದಿಲ್ಲ. ಆ ದತ್ತಾಂಶ ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಸ್ವಂತ ಪ್ರಶಸ್ತಿ ದಾಖಲೆಗಳಿಂದ ಬರಬೇಕು, ಅವು ದಾಖಲಿಸಿದ್ದರೆ.",
    rep_photo_bar: "ಫೋಟೋ ಇರುವವರು", rep_occupation_bar: "ಉದ್ಯೋಗ ವಿವರ ಇರುವವರು", rep_birthplace_bar: "ಜನ್ಮಸ್ಥಳ ಇರುವವರು", rep_deceased_bar: "ನಿಧನರಾದವರು ಎಂದು ದಾಖಲಾಗಿರುವವರು",

    footer_tagline: "ಒಂದು ಸಂಚಯ ಯೋಜನೆ",
    footer_desc: "ಸ್ಥಿರ, ಕ್ಲೈಂಟ್-ಸೈಡ್ ಸೈಟ್ ಆಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ — ಯಾವುದೇ ಸರ್ವರ್ ಇಲ್ಲ, ಟ್ರ್ಯಾಕಿಂಗ್ ಇಲ್ಲ. ಡೇಟಾ ಅದರ ಮೂಲಗಳಂತೆಯೇ ಲೈಸೆನ್ಸ್ ಆಗಿದೆ (ವಿಕಿಪೀಡಿಯಾ ಪಠ್ಯ CC BY-SA; ಈ ಡೇಟಾಸೆಟ್ ಅನ್ನೂ ಹಾಗೆಯೇ ಪರಿಗಣಿಸಿ). ಮೂಲ: ವಿಕಿಪೀಡಿಯಾದ ರಾಜ್ಯೋತ್ಸವ ಪ್ರಶಸ್ತಿ ಪಟ್ಟಿ ಪುಟಗಳು ಮತ್ತು ಸಮಕಾಲೀನ ಸುದ್ದಿ ವರದಿ, ವಿಕಿಡೇಟಾದೊಂದಿಗೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.",
  }
};

// Compact field-category dictionary (top ~40 fields cover >95% of records).
// Anything not listed here just displays in English — no silent mistranslation.
const FIELD_KN = {
  "Social Work": "ಸಮಾಜ ಸೇವೆ", "Social Service": "ಸಮಾಜ ಸೇವೆ", "Social service": "ಸಮಾಜ ಸೇವೆ",
  "Literature": "ಸಾಹಿತ್ಯ", "Music": "ಸಂಗೀತ", "Medicine": "ವೈದ್ಯಕೀಯ", "Medical": "ವೈದ್ಯಕೀಯ",
  "Folklore": "ಜಾನಪದ", "Theatre": "ರಂಗಭೂಮಿ", "Drama": "ನಾಟಕ", "Sports": "ಕ್ರೀಡೆ",
  "Education": "ಶಿಕ್ಷಣ", "Cinema": "ಚಲನಚಿತ್ರ", "Journalism": "ಪತ್ರಿಕೋದ್ಯಮ", "Media": "ಮಾಧ್ಯಮ",
  "Agriculture": "ಕೃಷಿ", "Yakshagana": "ಯಕ್ಷಗಾನ", "Fine Arts": "ಲಲಿತಕಲೆ", "Dance": "ನೃತ್ಯ",
  "Science": "ವಿಜ್ಞಾನ", "Sculpture": "ಶಿಲ್ಪಕಲೆ", "Painting": "ಚಿತ್ರಕಲೆ", "Research": "ಸಂಶೋಧನೆ",
  "Environment": "ಪರಿಸರ", "Folk Art": "ಜಾನಪದ ಕಲೆ", "Folk art": "ಜಾನಪದ ಕಲೆ",
  "Administration": "ಆಡಳಿತ", "Yoga": "ಯೋಗ", "Judiciary": "ನ್ಯಾಯಾಂಗ",
  "Engineering": "ಎಂಜಿನಿಯರಿಂಗ್", "Photography": "ಛಾಯಾಗ್ರಹಣ",
  "Sanskrit": "ಸಂಸ್ಕೃತ", "Gamaka": "ಗಮಕ", "Others": "ಇತರೆ", "Other fields": "ಇತರೆ ಕ್ಷೇತ್ರಗಳು",
  "Miscellaneous": "ವಿವಿಧ", "Unspecified": "ಸ್ಪಷ್ಟಪಡಿಸಿಲ್ಲ",
  "Freedom Struggle": "ಸ್ವಾತಂತ್ರ್ಯ ಹೋರಾಟ", "Overseas Kannadiga": "ಅನಿವಾಸಿ ಕನ್ನಡಿಗ",
  "Institution": "ಸಂಸ್ಥೆ",
};

const Sanchi18n = (function(){
  let lang = localStorage.getItem('sanchaya_lang') || 'en';

  function t(key, ...args){
    const entry = (DICT[lang] && DICT[lang][key] !== undefined) ? DICT[lang][key] : DICT.en[key];
    if(typeof entry === 'function') return entry(...args);
    return entry !== undefined ? entry : key;
  }

  function fieldLabel(field){
    if(lang === 'kn' && FIELD_KN[field]) return FIELD_KN[field];
    return field;
  }

  function getLang(){ return lang; }

  function setLang(newLang){
    lang = newLang;
    localStorage.setItem('sanchaya_lang', lang);
    document.documentElement.lang = lang;
    applyStatic();
    window.dispatchEvent(new CustomEvent('sanchaya:langchange', { detail: { lang } }));
  }

  function applyStatic(){
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', t(key));
    });
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  function init(){
    document.documentElement.lang = lang;
    applyStatic();
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });
  }

  return { t, fieldLabel, getLang, setLang, init };
})();
