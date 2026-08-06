(async function(){
  const NOT_AWARDED = new Set([1977,1978,1979,1980,2009]);
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
    provenanceGrid: document.getElementById('provenance-grid'),
    awardBtn: document.getElementById('award-switcher-btn'),
    awardMenu: document.getElementById('award-switcher-menu'),
    awardLabel: document.getElementById('award-switcher-label'),
  };

  Sanchi18n.init();

  // ---- load awards registry, then the active award's data ----
  let awardsRegistry = [];
  try{
    const res = await fetch('data/awards.json');
    awardsRegistry = await res.json();
  }catch(e){ awardsRegistry = []; }
  state.awards = awardsRegistry;
  renderAwardSwitcher();

  const active = awardsRegistry.find(a => a.status === 'active') || null;
  state.currentAward = active;

  let raw = [];
  if(active){
    try{
      const res = await fetch(active.data_file);
      raw = await res.json();
    }catch(e){
      els.list.innerHTML = '<p style="color:var(--text-dim)">Could not load the dataset. If you\'re viewing this file directly from disk, serve it over a local server instead.</p>';
    }
  }
  state.data = raw;
  state.filtered = raw;

  init();

  function renderAwardSwitcher(){
    if(!els.awardMenu) return;
    els.awardMenu.innerHTML = '';
    awardsRegistry.forEach(a => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      const lang = Sanchi18n.getLang();
      const name = lang === 'kn' ? a.name_kn : a.name_en;
      li.innerHTML = `<span class="award-name">${name}</span>` +
        (a.status === 'planned' ? `<span class="award-soon">${Sanchi18n.t('coming_soon')}</span>` : '');
      if(a.status === 'planned'){
        li.classList.add('is-planned');
      } else {
        li.classList.add('is-active-award');
      }
      els.awardMenu.appendChild(li);
    });
    const activeA = awardsRegistry.find(a => a.status === 'active');
    if(activeA && els.awardLabel){
      els.awardLabel.textContent = Sanchi18n.getLang() === 'kn' ? activeA.name_kn : activeA.name_en;
    }
  }

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

  function init(){
    renderStats();
    renderTimeline();
    renderFieldOptions();
    renderYearOptions();
    renderProvenance();
    renderWikidataDesc();
    applyFilters();

    if(window.SanchiWikiDraft) window.SanchiWikiDraft.init(state.data);

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

    window.addEventListener('sanchaya:langchange', () => {
      renderAwardSwitcher();
      renderFieldOptions(els.fieldSelect.value);
      renderProvenance();
      renderWikidataDesc();
      renderList();
    });
  }

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
    const dur = 800; const start = performance.now();
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
    const maxCount = Math.max(...Object.values(counts), 1);
    const first = 1966, last = 2025;

    els.timeline.innerHTML = '';
    for(let y = first; y <= last; y++){
      const bar = document.createElement('div');
      bar.className = 'tl-bar';
      bar.dataset.year = y;
      const fill = document.createElement('div');
      fill.className = 'tl-fill';
      const count = counts[y] || 0;
      const notAwarded = NOT_AWARDED.has(y);
      const thin = !notAwarded && count > 0 && count < 8;

      if(notAwarded){ bar.classList.add('gap'); bar.title = y + ': award not conferred this year'; }
      else if(count === 0){ bar.classList.add('gap'); bar.title = y + ': no record found for this year'; }
      else if(thin){ bar.classList.add('thin'); fill.style.height = Math.max(6, (count/maxCount)*100) + '%'; bar.title = y + ': ' + count + ' on record (incomplete)'; }
      else { fill.style.height = Math.max(6, (count/maxCount)*100) + '%'; bar.title = y + ': ' + count + ' recipients'; }

      bar.appendChild(fill);
      const label = document.createElement('div');
      label.className = 'tl-year'; label.textContent = y;
      bar.appendChild(label);
      bar.addEventListener('click', () => {
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
    els.fieldSelect.innerHTML = `<option value="" data-i18n="filter_all_fields">${Sanchi18n.t('filter_all_fields')}</option>`;
    for(const [field, count] of sorted){
      const opt = document.createElement('option');
      opt.value = field;
      opt.textContent = `${Sanchi18n.fieldLabel(field)} (${count})`;
      els.fieldSelect.appendChild(opt);
    }
    if(preserveValue) els.fieldSelect.value = preserveValue;
  }

  function renderYearOptions(){
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

    row.appendChild(year); row.appendChild(main); row.appendChild(badges);
    return row;
  }

  function renderWikidataDesc(){
    if(els.wdDesc) els.wdDesc.textContent = Sanchi18n.t('wd_desc', 306);
  }

  function renderProvenance(){
    const lang = Sanchi18n.getLang();
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
    const cells = lang === 'kn' ? cellsKn : cellsEn;
    els.provenanceGrid.innerHTML = '';
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
