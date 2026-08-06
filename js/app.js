(async function(){
  const RAJYOTSAVA_NOT_AWARDED = new Set([1977,1978,1979,1980,2009]);
  const PAGE_SIZE = 60;

  const state = {
    data: [], filtered: [], shown: PAGE_SIZE,
    search: '', field: '', year: '',
    currentAward: null, awards: [],
  };

  const els = {
    timeline: document.getElementById('timeline'),
    statTotal: document.getElementById('stat-total'),
    statYears: document.getElementById('stat-years'),
    statFields: document.getElementById('stat-fields'),
    statWiki: document.getElementById('stat-wiki'),
    searchInput: document.getElementById('search-input'),
    fieldSelect: document.getElementById('field-select'),
    yearSelect: document.getElementById('year-select'),
    clearBtn: document.getElementById('clear-filters'),
    resultCount: document.getElementById('result-count'),
    list: document.getElementById('recipient-list'),
    loadMore: document.getElementById('load-more'),
    wdDesc: document.getElementById('wd-desc'),
    wdDownload: document.getElementById('wd-download-btn'),
    missingCount: document.getElementById('missing-count'),
    provenanceGrid: document.getElementById('provenance-grid'),
    awardBtn: document.getElementById('award-switcher-btn'),
    awardMenu: document.getElementById('award-switcher-menu'),
    awardLabel: document.getElementById('award-switcher-label'),
    mapSection: document.getElementById('map-section'),
    repSection: document.getElementById('representation-section'),
    navRepresentation: document.querySelector('a[href="#representation-section"]'),
    navMap: document.querySelector('a[href="#map-section"]'),
    heroEyebrow: document.querySelector('.eyebrow'),
    heroH1: document.querySelector('.hero h1'),
    heroDesc: document.querySelector('.hero-desc'),
  };

  Sanchi18n.init();

  let awardsRegistry = [];
  try{
    const res = await fetch('data/awards.json');
    awardsRegistry = await res.json();
  }catch(e){ awardsRegistry = []; }
  state.awards = awardsRegistry;

  const initialAward = awardsRegistry.find(a => a.status === 'active') || null;
  await loadAward(initialAward);
  renderAwardSwitcher();
  wireStaticControls();

  if(els.awardBtn){
    els.awardBtn.addEventListener('click', () => {
      const open = els.awardMenu.classList.toggle('open');
      els.awardBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', (e) => {
      if(!document.getElementById('award-switcher').contains(e.target)){
        els.awardMenu.classList.remove('open');
        els.awardBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  window.addEventListener('sanchaya:langchange', () => {
    renderAwardSwitcher();
    updateHeroText(state.currentAward);
    renderFieldOptions(els.fieldSelect.value);
    renderProvenance();
    renderWikidataDesc();
    renderList();
  });

  // ---------------- award loading ----------------

  async function loadAward(award){
    if(!award) return;
    state.currentAward = award;
    state.search = ''; state.field = ''; state.year = ''; state.shown = PAGE_SIZE;
    if(els.searchInput) els.searchInput.value = '';
    const heroInput = document.getElementById('hero-search-input');
    if(heroInput) heroInput.value = '';

    let raw = [];
    try{
      const res = await fetch(award.data_file);
      raw = await res.json();
    }catch(e){
      els.list.innerHTML = '<p style="color:var(--text-dim)">Could not load this award\'s dataset.</p>';
    }
    state.data = raw;
    state.filtered = raw;

    // toggle sections this award doesn't support
    toggleSection(els.mapSection, els.navMap, !!award.has_location_data);
    toggleSection(els.repSection, els.navRepresentation, !!award.has_representation_data);
    if(award.has_location_data && window.SanchiMap) window.SanchiMap.load(award);

    updateHeroText(award);

    renderStats();
    renderTimeline();
    renderFieldOptions();
    renderYearOptions();
    renderProvenance();
    renderWikidataDesc();
    applyFilters();

    if(window.SanchiWikiDraft) window.SanchiWikiDraft.init(state.data);
  }

  function toggleSection(sectionEl, navEl, show){
    if(sectionEl) sectionEl.style.display = show ? '' : 'none';
    if(navEl) navEl.style.display = show ? '' : 'none';
  }

  function updateHeroText(award){
    if(!award) return;
    const lang = Sanchi18n.getLang();
    const name = lang === 'kn' ? award.name_kn : award.name_en;
    const desc = lang === 'kn' ? award.desc_kn : award.desc_en;
    const hero = lang === 'kn' ? (award.hero_kn || award.desc_kn) : (award.hero_en || award.desc_en);

    if(els.heroEyebrow){
      const prefix = lang === 'kn' ? 'ಒಂದು ಸಂಚಯ ಯೋಜನೆ' : 'A Sanchaya project';
      els.heroEyebrow.textContent = `${prefix} · ${desc}`;
    }
    if(els.heroH1){
      els.heroH1.textContent = lang === 'kn' ? `ದಾಖಲಾಗಿರುವ ಪ್ರತಿಯೊಬ್ಬ ${name} ಪುರಸ್ಕೃತ` : `Every ${name} recipient on record`;
    }
    if(els.heroDesc && hero){
      els.heroDesc.textContent = hero;
    }
  }

  function renderAwardSwitcher(){
    if(!els.awardMenu) return;
    els.awardMenu.innerHTML = '';
    const lang = Sanchi18n.getLang();
    awardsRegistry.forEach(a => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      const name = lang === 'kn' ? a.name_kn : a.name_en;
      li.innerHTML = `<span class="award-name">${name}</span>` +
        (a.status === 'planned' ? `<span class="award-soon">${Sanchi18n.t('coming_soon')}</span>` : '');
      if(a.status === 'planned'){
        li.classList.add('is-planned');
      } else {
        li.classList.add('is-active-award');
        if(state.currentAward && a.id === state.currentAward.id) li.classList.add('is-selected');
        li.addEventListener('click', async () => {
          els.awardMenu.classList.remove('open');
          els.awardBtn.setAttribute('aria-expanded', 'false');
          await loadAward(a);
          renderAwardSwitcher();
        });
      }
      els.awardMenu.appendChild(li);
    });
    if(state.currentAward && els.awardLabel){
      els.awardLabel.textContent = lang === 'kn' ? state.currentAward.name_kn : state.currentAward.name_en;
    }
  }

  // ---------------- static control wiring (once) ----------------

  function wireStaticControls(){
    els.searchInput.addEventListener('input', debounce(() => { state.search = els.searchInput.value.trim().toLowerCase(); state.shown = PAGE_SIZE; applyFilters(); }, 150));

    const heroInput = document.getElementById('hero-search-input');
    const heroBtn = document.getElementById('hero-search-btn');
    const runHeroSearch = () => {
      els.searchInput.value = heroInput.value;
      state.search = heroInput.value.trim().toLowerCase();
      state.shown = PAGE_SIZE;
      applyFilters();
      document.getElementById('browse-section').scrollIntoView({behavior:'smooth', block:'start'});
    };
    if(heroBtn) heroBtn.addEventListener('click', runHeroSearch);
    if(heroInput) heroInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') runHeroSearch(); });

    els.fieldSelect.addEventListener('change', () => { state.field = els.fieldSelect.value; state.shown = PAGE_SIZE; applyFilters(); });
    els.yearSelect.addEventListener('change', () => { state.year = els.yearSelect.value; state.shown = PAGE_SIZE; applyFilters(); syncTimelineActive(); });
    els.clearBtn.addEventListener('click', () => {
      state.search=''; state.field=''; state.year=''; state.shown = PAGE_SIZE;
      els.searchInput.value=''; els.fieldSelect.value=''; els.yearSelect.value='';
      applyFilters(); syncTimelineActive();
    });
    els.loadMore.addEventListener('click', () => { state.shown += PAGE_SIZE; renderList(); });
  }

  // ---------------- rendering ----------------

  function renderStats(){
    const total = state.data.length;
    const years = new Set(state.data.map(r => r.year));
    const fields = new Set(state.data.map(r => r.field));
    const withWiki = state.data.filter(r => r.wikipedia_url).length;
    animateNumber(els.statTotal, total);
    els.statYears.textContent = years.size;
    els.statFields.textContent = fields.size;
    animateNumber(els.statWiki, withWiki);
  }

  function animateNumber(el, target){
    const dur = 600; const start = performance.now();
    function step(t){
      const p = Math.min(1, (t-start)/dur);
      el.textContent = Math.round(target * (1 - Math.pow(1-p, 3))).toLocaleString();
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function renderTimeline(){
    const counts = {};
    state.data.forEach(r => { counts[r.year] = (counts[r.year]||0) + 1; });
    const years = Object.keys(counts).map(Number);
    if(years.length === 0) return;
    const first = Math.min(...years);
    const last = Math.max(...years, new Date().getFullYear());
    const maxCount = Math.max(...Object.values(counts), 1);
    const notAwarded = state.currentAward && state.currentAward.id === 'rajyotsava-prashasti' ? RAJYOTSAVA_NOT_AWARDED : new Set();

    els.timeline.innerHTML = '';
    for(let y = first; y <= last; y++){
      const bar = document.createElement('div');
      bar.className = 'tl-bar';
      bar.dataset.year = y;
      const fill = document.createElement('div');
      fill.className = 'tl-fill';
      const count = counts[y] || 0;
      const isNotAwarded = notAwarded.has(y);
      const thin = !isNotAwarded && count > 0 && count < Math.max(2, maxCount * 0.15);

      if(isNotAwarded){ bar.classList.add('gap'); bar.title = y + ': award not conferred this year'; }
      else if(count === 0){ bar.classList.add('gap'); bar.title = y + ': no record found for this year'; }
      else if(thin){ bar.classList.add('thin'); fill.style.height = Math.max(6, (count/maxCount)*100) + '%'; bar.title = y + ': ' + count + ' on record'; }
      else { fill.style.height = Math.max(6, (count/maxCount)*100) + '%'; bar.title = y + ': ' + count + ' recipients'; }

      bar.appendChild(fill);
      const label = document.createElement('div');
      label.className = 'tl-year'; label.textContent = y;
      bar.appendChild(label);
      bar.addEventListener('click', () => {
        if(count === 0) return;
        state.year = String(y);
        els.yearSelect.value = String(y);
        state.shown = PAGE_SIZE;
        applyFilters(); syncTimelineActive();
        document.getElementById('browse-section').scrollIntoView({behavior:'smooth', block:'start'});
      });
      els.timeline.appendChild(bar);
    }
  }

  function syncTimelineActive(){
    [...els.timeline.children].forEach(bar => bar.classList.toggle('active', bar.dataset.year === state.year));
  }

  function renderFieldOptions(preserveValue){
    const counts = {};
    state.data.forEach(r => { counts[r.field] = (counts[r.field]||0)+1; });
    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
    els.fieldSelect.innerHTML = `<option value="">${Sanchi18n.t('filter_all_fields')}</option>`;
    for(const [field, count] of sorted){
      const opt = document.createElement('option');
      opt.value = field;
      opt.textContent = `${Sanchi18n.fieldLabel(field)} (${count})`;
      els.fieldSelect.appendChild(opt);
    }
    if(preserveValue) els.fieldSelect.value = preserveValue;
  }

  function renderYearOptions(){
    els.yearSelect.innerHTML = `<option value="">${Sanchi18n.t('filter_all_years')}</option>`;
    const years = [...new Set(state.data.map(r => r.year))].sort((a,b)=>b-a);
    for(const y of years){
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      els.yearSelect.appendChild(opt);
    }
  }

  function applyFilters(){
    state.filtered = state.data.filter(r => {
      if(state.year && String(r.year) !== state.year) return false;
      if(state.field && r.field !== state.field) return false;
      if(state.search){
        const hay = (r.name + ' ' + (r.field||'') + ' ' + (r.location||'')).toLowerCase();
        if(!hay.includes(state.search)) return false;
      }
      return true;
    });
    state.filtered.sort((a,b) => b.year - a.year || a.name.localeCompare(b.name));
    renderList();
  }

  function renderList(){
    const toShow = state.filtered.slice(0, state.shown);
    const filtered = state.filtered.length !== state.data.length;
    els.resultCount.textContent = Sanchi18n.t('result_count', state.filtered.length, state.data.length, filtered);

    els.list.innerHTML = '';
    const frag = document.createDocumentFragment();
    for(const r of toShow) frag.appendChild(recipientRow(r));
    els.list.appendChild(frag);
    els.loadMore.style.display = state.filtered.length > state.shown ? 'block' : 'none';
  }

  function recipientRow(r){
    const row = document.createElement('div');
    row.className = 'recipient';

    const year = document.createElement('div');
    year.className = 'r-year'; year.textContent = r.year;

    const main = document.createElement('div');
    main.className = 'r-main';
    const name = document.createElement('div');
    name.className = 'r-name';
    if(r.wikipedia_url){
      const a = document.createElement('a');
      a.href = r.wikipedia_url; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = r.name;
      name.appendChild(a);
    } else {
      name.textContent = r.name;
    }
    const meta = document.createElement('div');
    meta.className = 'r-meta';
    meta.textContent = [Sanchi18n.fieldLabel(r.field), r.location].filter(Boolean).join(' · ');
    main.appendChild(name); main.appendChild(meta);

    const badges = document.createElement('div');
    badges.className = 'r-badges';
    if(r.wikipedia_url){
      const b = document.createElement('span');
      b.className = 'badge on-wikipedia';
      b.textContent = Sanchi18n.t('badge_wikipedia');
      badges.appendChild(b);
    } else {
      const b = document.createElement('a');
      b.className = 'badge needs-wikidata badge-link';
      b.href = '#wikipedia-draft-section';
      b.textContent = '+ ' + Sanchi18n.t('badge_draft');
      b.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('wikipedia-draft-section').scrollIntoView({behavior:'smooth', block:'start'});
        const wpSearch = document.getElementById('wp-search');
        if(wpSearch){
          wpSearch.value = r.name;
          wpSearch.dispatchEvent(new Event('input'));
          wpSearch.focus();
        }
      });
      badges.appendChild(b);
    }
    if(r.wikidata_qid && r.has_wikidata_statement === false){
      const b = document.createElement('span');
      b.className = 'badge needs-wikidata';
      b.textContent = Sanchi18n.t('badge_needs_wikidata');
      badges.appendChild(b);
    }

    row.appendChild(year); row.appendChild(main); row.appendChild(badges);
    return row;
  }

  function renderWikidataDesc(){
    const award = state.currentAward;
    if(!award || !els.wdDesc) return;
    const total = state.data.length;
    const withQid = state.data.filter(r => r.wikidata_qid).length;
    const alreadyLinked = state.data.filter(r => r.has_wikidata_statement === true).length;
    const missing = state.data.filter(r => r.wikidata_qid && r.has_wikidata_statement === false).length;
    const withWiki = state.data.filter(r => r.wikipedia_url).length;

    const panel = document.querySelector('.wikidata-panel');

    if(missing === 0 && withQid > 0){
      els.wdDesc.textContent = Sanchi18n.t('wd_desc_complete', withQid, total);
      if(panel) panel.style.display = 'none';
    } else {
      els.wdDesc.textContent = Sanchi18n.t('wd_desc_general', withWiki, total, withQid, alreadyLinked, missing);
      if(panel) panel.style.display = '';
      if(els.missingCount) els.missingCount.textContent = missing;
      const li1 = document.getElementById('wd-col1-li1');
      if(li1 && award.wikidata_qid){
        const lang = Sanchi18n.getLang();
        const awardName = lang === 'kn' ? award.name_kn : award.name_en;
        li1.textContent = Sanchi18n.t('wd_col1_li1', award.wikidata_qid, awardName);
      }
      if(els.wdDownload){
        const file = award.quickstatements_file || (award.id === 'rajyotsava-prashasti' ? 'data/quickstatements_batch.tsv' : null);
        if(file){
          els.wdDownload.href = file;
          els.wdDownload.style.display = '';
        } else {
          els.wdDownload.style.display = 'none';
        }
      }
    }
  }

  function renderProvenance(){
    const award = state.currentAward;
    const lang = Sanchi18n.getLang();
    els.provenanceGrid.innerHTML = '';

    if(award && award.id === 'rajyotsava-prashasti'){
      const cellsEn = [
        { range: '1966 – 1976', note: 'From Wikipedia\'s decade list pages. Reasonably complete for these years.' },
        { range: '1977 – 1980', note: 'The award itself was not conferred in these years.' },
        { range: '1981 – 1991', note: 'From Wikipedia\'s decade list pages. 1991 is well documented; earlier years are complete.' },
        { range: '1992 – 2002', note: 'Wikipedia has no structured list for most of this stretch. Treat this decade as under-documented, not empty.' },
        { range: '2003 – 2016', note: 'Individual "Rajyotsava Awards (year)" Wikipedia pages exist for most years and were parsed directly.' },
        { range: '2009', note: 'The award was not conferred this year.' },
        { range: '2017 – 2018', note: 'No dedicated Wikipedia page found for these two years.' },
        { range: '2019 – 2022', note: 'Parsed from Wikipedia, including 2022\'s list, formatted as prose rather than a table.' },
        { range: '2023', note: 'Wikipedia has no dedicated page yet; sourced from contemporaneous news coverage instead.' },
        { range: '2024', note: '69 recipients were announced, but no clean structured English-language list was found in time.' },
        { range: '2025', note: 'Sourced from contemporaneous news coverage, since Wikipedia has no dedicated page yet.' },
      ];
      const cellsKn = [
        { range: '1966 – 1976', note: 'ವಿಕಿಪೀಡಿಯಾದ ದಶಕವಾರು ಪಟ್ಟಿ ಪುಟಗಳಿಂದ. ಈ ವರ್ಷಗಳಿಗೆ ಸಾಕಷ್ಟು ಪೂರ್ಣವಾಗಿದೆ.' },
        { range: '1977 – 1980', note: 'ಈ ವರ್ಷಗಳಲ್ಲಿ ಪ್ರಶಸ್ತಿಯನ್ನೇ ನೀಡಿರಲಿಲ್ಲ.' },
        { range: '1981 – 1991', note: 'ವಿಕಿಪೀಡಿಯಾದ ದಶಕವಾರು ಪಟ್ಟಿ ಪುಟಗಳಿಂದ. 1991 ಚೆನ್ನಾಗಿ ದಾಖಲಾಗಿದೆ; ಹಿಂದಿನ ವರ್ಷಗಳು ಪೂರ್ಣವಾಗಿವೆ.' },
        { range: '1992 – 2002', note: 'ಈ ಬಹುಪಾಲು ಅವಧಿಗೆ ವಿಕಿಪೀಡಿಯಾದಲ್ಲಿ ರಚನಾತ್ಮಕ ಪಟ್ಟಿ ಇಲ್ಲ. ಇದನ್ನು ಖಾಲಿ ಎಂದಲ್ಲ, ಕಡಿಮೆ ದಾಖಲಾದ ದಶಕ ಎಂದು ಪರಿಗಣಿಸಿ.' },
        { range: '2003 – 2016', note: 'ಹೆಚ್ಚಿನ ವರ್ಷಗಳಿಗೆ ಪ್ರತ್ಯೇಕ "Rajyotsava Awards (year)" ವಿಕಿಪೀಡಿಯಾ ಪುಟಗಳಿವೆ, ನೇರವಾಗಿ ಪಾರ್ಸ್ ಮಾಡಲಾಗಿದೆ.' },
        { range: '2009', note: 'ಈ ವರ್ಷ ಪ್ರಶಸ್ತಿಯನ್ನು ನೀಡಿರಲಿಲ್ಲ.' },
        { range: '2017 – 2018', note: 'ಈ ಎರಡು ವರ್ಷಗಳಿಗೆ ಪ್ರತ್ಯೇಕ ವಿಕಿಪೀಡಿಯಾ ಪುಟ ಸಿಗಲಿಲ್ಲ.' },
        { range: '2019 – 2022', note: '2022ರ ಪಟ್ಟಿ ಸೇರಿದಂತೆ ವಿಕಿಪೀಡಿಯಾದಿಂದ ಪಾರ್ಸ್ ಮಾಡಲಾಗಿದೆ, ಇದು ಪಟ್ಟಿಗಿಂತ ಗದ್ಯ ರೂಪದಲ್ಲಿತ್ತು.' },
        { range: '2023', note: 'ವಿಕಿಪೀಡಿಯಾದಲ್ಲಿ ಇನ್ನೂ ಪ್ರತ್ಯೇಕ ಪುಟ ಇಲ್ಲ; ಬದಲಿಗೆ ಸಮಕಾಲೀನ ಸುದ್ದಿ ವರದಿಯಿಂದ ಪಡೆಯಲಾಗಿದೆ.' },
        { range: '2024', note: '69 ಮಂದಿಗೆ ಪ್ರಶಸ್ತಿ ಘೋಷಿಸಲಾಯಿತು, ಆದರೆ ಸಮಯದ ಮಿತಿಯಲ್ಲಿ ಸ್ಪಷ್ಟ ರಚನಾತ್ಮಕ ಇಂಗ್ಲಿಷ್ ಪಟ್ಟಿ ಸಿಗಲಿಲ್ಲ.' },
        { range: '2025', note: 'ವಿಕಿಪೀಡಿಯಾದಲ್ಲಿ ಇನ್ನೂ ಪ್ರತ್ಯೇಕ ಪುಟ ಇಲ್ಲದ ಕಾರಣ ಸಮಕಾಲೀನ ಸುದ್ದಿ ವರದಿಯಿಂದ ಪಡೆಯಲಾಗಿದೆ.' },
      ];
      renderCells(lang === 'kn' ? cellsKn : cellsEn);
      return;
    }

    // generic provenance for the newer, smaller awards
    if(award && (award.id === 'karnataka-ratna' || award.id === 'jnanpith-kannada' || award.id === 'bharat-ratna-kannadiga')){
      const total = state.data.length;
      const withWiki = state.data.filter(r => r.wikipedia_url).length;
      const cell = lang === 'kn'
        ? { range: `${award.year_range}`, note: `ಇಂಗ್ಲಿಷ್ ಮತ್ತು ಕನ್ನಡ ವಿಕಿಪೀಡಿಯಾ ಎರಡರಿಂದಲೂ ಪಡೆಯಲಾಗಿದೆ, ಪರಸ್ಪರ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ${total} ರಲ್ಲಿ ${withWiki} ಮಂದಿಗೆ ವಿಕಿಪೀಡಿಯಾ ಲೇಖನವಿದೆ. ಪಟ್ಟಿ ಚಿಕ್ಕದಾಗಿರುವ ಕಾರಣ ಪ್ರತಿಯೊಂದು ಹೆಸರನ್ನೂ ಕೈಯಾರೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.` }
        : { range: `${award.year_range}`, note: `Sourced from both English and Kannada Wikipedia and cross-checked against each other. ${withWiki} of ${total} have a Wikipedia article. Small enough that every name was checked by hand rather than parsed in bulk.` };
      renderCells([cell]);
      return;
    }

    renderCells([]);
  }

  function renderCells(cells){
    for(const c of cells){
      const div = document.createElement('div');
      div.className = 'prov-cell';
      div.innerHTML = `<div class="prov-range">${c.range}</div><div class="prov-note">${c.note}</div>`;
      els.provenanceGrid.appendChild(div);
    }
  }

  function debounce(fn, ms){
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }
})();
