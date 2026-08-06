(async function(){
  const RAJYOTSAVA_NOT_AWARDED = new Set([1977,1978,1979,1980,2009]);
  const PAGE_SIZE = 60;

  const state = {
    registry: [],           // award registry entries (awards.json)
    data: {},               // awardId -> records[]
    selectedAward: null,    // null = "All awards" chip
    filtered: [], shown: PAGE_SIZE,
    search: '', field: '', year: '',
  };

  const els = {
    timeline: document.getElementById('timeline'),
    statTotal: document.getElementById('stat-total'),
    statYears: document.getElementById('stat-years'),
    statFields: document.getElementById('stat-fields'),
    statDistricts: document.getElementById('stat-districts'),
    searchInput: document.getElementById('search-input'),
    fieldSelect: document.getElementById('field-select'),
    yearSelect: document.getElementById('year-select'),
    clearBtn: document.getElementById('clear-filters'),
    resultCount: document.getElementById('result-count'),
    list: document.getElementById('recipient-list'),
    loadMore: document.getElementById('load-more'),
    chips: document.getElementById('award-chips'),
    wdDesc: document.getElementById('wd-desc'),
    wdDownload: document.getElementById('wd-download-btn'),
    missingCount: document.getElementById('missing-count'),
    provenanceGrid: document.getElementById('provenance-grid'),
    mapAwardNote: document.getElementById('map-award-note'),
    repSection: document.getElementById('representation-section'),
    adminNavRepresentation: document.querySelector('a[href="#admin/representation"]'),
    heroEyebrow: document.querySelector('.eyebrow'),
    heroH1: document.getElementById('hero-h1'),
    heroDesc: document.getElementById('hero-desc'),
  };

  Sanchi18n.init();

  // ---------------- data loading ----------------

  try{
    const res = await fetch('data/awards.json');
    state.registry = await res.json();
  }catch(e){
    state.registry = [];
  }

  const active = state.registry;
  await Promise.all(active.map(async a => {
    try{
      if(!a.data_file){ state.data[a.id] = []; return; }
      const res = await fetch(a.data_file);
      const records = await res.json();
      records.forEach(r => { r._award = a; r._awardId = a.id; });
      state.data[a.id] = records;
    }catch(e){
      state.data[a.id] = [];
    }
  }));

  const rajyotsavaAward = state.registry.find(a => a.id === 'rajyotsava-prashasti');

  // ---------------- public helpers ----------------

  function baseRecords(){
    if(state.selectedAward) return state.data[state.selectedAward.id] || [];
    const out = [];
    Object.keys(state.data).forEach(id => {
      const a = state.registry.find(x => x.id === id);
      if(a && a.status === 'active') out.push(...state.data[id]);
    });
    return out;
  }

  function adminAward(){
    if(state.selectedAward && state.selectedAward.status === 'active') return state.selectedAward;
    return rajyotsavaAward;
  }

  function awardLabel(a){ return Sanchi18n.getLang() === 'kn' ? a.name_kn : a.name_en; }

  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // ---------------- wiring ----------------

  renderChips();
  updateHeroText(state.selectedAward);
  wireStaticControls();
  renderInitial();

  async function renderInitial(){
    renderStats();
    renderTimeline();
    renderFieldOptions();
    renderYearOptions();
    await loadMap();
    applyFilters();
    renderWikidataDesc();
    renderProvenance();
    if(window.SanchiWikiDraft && state.data['rajyotsava-prashasti']){
      window.SanchiWikiDraft.init(state.data['rajyotsava-prashasti']);
    }
  }

  window.addEventListener('sanchaya:langchange', () => {
    renderChips();
    updateHeroText(state.selectedAward);
    renderFieldOptions(els.fieldSelect.value);
    renderProvenance();
    renderWikidataDesc();
    renderList();
    updateMapNote();
    if(window.SanchiMap) window.SanchiMap.load(state.selectedAward || rajyotsavaAward);
  });

  // ---------------- routing (#admin) ----------------

  function applyRoute(){
    const hash = location.hash || '';
    const isAdmin = hash.startsWith('#admin');
    document.body.classList.toggle('admin-mode', isAdmin);
    if(isAdmin){
      const sub = hash.slice('#admin/'.length);
      const sectionMap = {
        wikidata: 'wikidata-section',
        draft: 'wikipedia-draft-section',
        provenance: 'provenance-section',
        representation: 'representation-section',
      };
      const sectionId = sub && sectionMap[sub] ? sectionMap[sub] : null;
      if(sectionId){
        const el = document.getElementById(sectionId);
        if(el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
      } else if(window.scrollTo){
        window.scrollTo(0, 0);
      }
    } else if(window.SanchiMap){
      window.SanchiMap.refresh();
    }
  }
  window.addEventListener('hashchange', applyRoute);
  applyRoute();

  // ---------------- award chips ----------------

  function renderChips(){
    if(!els.chips) return;
    els.chips.innerHTML = '';
    const mk = (label, isActive, onClick) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (isActive ? ' is-active' : '');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      b.textContent = label;
      b.addEventListener('click', onClick);
      els.chips.appendChild(b);
    };

    mk(Sanchi18n.t('chip_all'), !state.selectedAward, () => selectAward(null));
    state.registry.filter(a => a.status === 'active').forEach(a => {
      const isActive = state.selectedAward && a.id === state.selectedAward.id;
      mk(awardLabel(a), !!isActive, () => selectAward(a));
    });
  }

  async function selectAward(award){
    if(state.selectedAward && award && state.selectedAward.id === award.id) return;
    state.selectedAward = award;
    state.search = ''; state.field = ''; state.year = ''; state.shown = PAGE_SIZE;
    if(els.searchInput) els.searchInput.value = '';
    els.fieldSelect.value = ''; els.yearSelect.value = '';
    renderChips();
    updateHeroText(award);
    renderStats();
    renderTimeline();
    renderFieldOptions();
    renderYearOptions();
    applyFilters();
    renderProvenance();
    updateMapNote();
    if(window.SanchiMap) window.SanchiMap.load(state.selectedAward || rajyotsavaAward);
  }

  function updateHeroText(award){
    const lang = Sanchi18n.getLang();
    if(els.heroH1){
      if(award){
        const name = lang === 'kn' ? award.name_kn : award.name_en;
        els.heroH1.textContent = lang === 'kn' ? `ದಾಖಲಾಗಿರುವ ಪ್ರತಿಯೊಬ್ಬ ${name} ಪುರಸ್ಕೃತ` : `Every ${name} recipient on record`;
      } else {
        els.heroH1.textContent = lang === 'kn'
          ? 'ದಾಖಲಾಗಿರುವ ಪ್ರತಿಯೊಬ್ಬ ಪುರಸ್ಕೃತ'
          : 'Every recipient on record';
      }
    }
    if(els.heroDesc){
      const hero = award ? (lang === 'kn' ? (award.hero_kn || award.desc_kn) : (award.hero_en || award.desc_en)) : null;
      els.heroDesc.textContent = hero || (lang === 'kn'
        ? '1966ರಿಂದ ಪ್ರತಿ ನವೆಂಬರ್ 1ರಂದು, ಕರ್ನಾಟಕ ತನ್ನವರನ್ನು ಗೌರವಿಸುತ್ತಾ ಬಂದಿದೆ — ಸಾಹಿತಿಗಳು, ಕುಸ್ತಿಪಟುಗಳು, ಜಾನಪದ ಕಲಾವಿದರು, ವಿಜ್ಞಾನಿಗಳು. ಇದು ಆ ಗೌರವ ಪಟ್ಟಿಯನ್ನು ಒಂದೇ ಕಡೆ ಹುಡುಕಬಹುದಾದಂತೆ ಸಂಗ್ರಹಿಸುತ್ತದೆ.'
        : 'Every November 1st since 1966, Karnataka has honoured its own — writers, wrestlers, folk artists, scientists, midwives, soldiers. This collects that honour roll in one searchable place.');
    }
    if(els.heroEyebrow){
      const desc = award ? (lang === 'kn' ? award.desc_kn : award.desc_en) : '';
      const prefix = lang === 'kn' ? 'ಒಂದು ಸಂಚಯ ಯೋಜನೆ' : 'A Sanchaya project';
      els.heroEyebrow.textContent = desc ? `${prefix} · ${desc}` : prefix;
    }
  }

  // ---------------- map ----------------

  function updateMapNote(){
    if(!els.mapAwardNote) return;
    const isRaj = !state.selectedAward || state.selectedAward.id === 'rajyotsava-prashasti';
    els.mapAwardNote.textContent = isRaj ? Sanchi18n.t('map_award_note') : '';
    els.mapAwardNote.style.display = isRaj ? '' : 'none';
  }

  async function loadMap(){
    updateMapNote();
    if(rajyotsavaAward && window.SanchiMap){
      await window.SanchiMap.load(rajyotsavaAward);
    }
  }

  // ---------------- static control wiring (once) ----------------

  function wireStaticControls(){
    els.searchInput.addEventListener('input', debounce(() => { state.search = els.searchInput.value.trim().toLowerCase(); state.shown = PAGE_SIZE; applyFilters(); }, 150));
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
    const total = baseRecords().length;
    const years = new Set(baseRecords().map(r => r.year));
    const fields = new Set(baseRecords().map(r => r.field));
    const districts = new Set(baseRecords().map(r => r.location).filter(Boolean));
    animateNumber(els.statTotal, total);
    els.statYears.textContent = years.size;
    els.statFields.textContent = fields.size;
    animateNumber(els.statDistricts, districts.size);
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
    const records = baseRecords();
    const counts = {};
    records.forEach(r => { counts[r.year] = (counts[r.year]||0) + 1; });
    const years = Object.keys(counts).map(Number);
    if(years.length === 0) return;
    const first = Math.min(...years);
    const last = Math.max(...years, new Date().getFullYear());
    const maxCount = Math.max(...Object.values(counts), 1);
    const notAwarded = (state.selectedAward && state.selectedAward.id === 'rajyotsava-prashasti') ? RAJYOTSAVA_NOT_AWARDED : new Set();

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
        document.getElementById('browse-section').scrollIntoView({behavior:'smooth', block:'center'});
      });
      els.timeline.appendChild(bar);
    }
  }

  function syncTimelineActive(){
    [...els.timeline.children].forEach(bar => bar.classList.toggle('active', bar.dataset.year === state.year));
  }

  function renderFieldOptions(preserveValue){
    const counts = {};
    baseRecords().forEach(r => { counts[r.field] = (counts[r.field]||0)+1; });
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
    const years = [...new Set(baseRecords().map(r => r.year))].sort((a,b)=>b-a);
    for(const y of years){
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      els.yearSelect.appendChild(opt);
    }
  }

  function applyFilters(){
    state.filtered = baseRecords().filter(r => {
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
    const filtered = state.filtered.length !== baseRecords().length;
    els.resultCount.textContent = Sanchi18n.t('result_count', state.filtered.length, baseRecords().length, filtered);

    els.list.innerHTML = '';
    const frag = document.createDocumentFragment();
    for(const r of toShow) frag.appendChild(recipientRow(r));
    els.list.appendChild(frag);
    els.loadMore.style.display = state.filtered.length > state.shown ? 'block' : 'none';
  }

  // ---------------- recipient rows + Wikipedia intros ----------------

  function fieldHue(s){
    let h = 0;
    for(let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  }

  function fieldBadge(field, big){
    const h = fieldHue(field);
    return `<span class="r-field${big ? ' r-field-lg' : ''}" style="--h:${h}">${escapeHtml(Sanchi18n.fieldLabel(field))}</span>`;
  }

  function awardBadge(a, big){
    if(!a) return '';
    return `<span class="r-award${big ? ' r-field-lg' : ''}">${escapeHtml(awardLabel(a))}</span>`;
  }

  function recipientRow(r){
    const row = document.createElement('div');
    row.className = 'recipient';

    const year = document.createElement('div');
    year.className = 'r-year'; year.textContent = r.year;

    const main = document.createElement('div');
    main.className = 'r-main';
    const nameRow = document.createElement('div');
    nameRow.className = 'r-name-row';
    const name = document.createElement('div');
    name.className = 'r-name';
    name.textContent = r.name;
    if(r.wikipedia_url){
      name.classList.add('r-name-link');
      name.setAttribute('role', 'button');
      name.setAttribute('tabindex', '0');
      name.title = Sanchi18n.t('detail_read');
      const open = () => toggleDetails(row, r);
      name.addEventListener('click', open);
      name.addEventListener('keydown', e => {
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); }
      });
    }
    nameRow.appendChild(name);
    nameRow.insertAdjacentHTML('beforeend', fieldBadge(r.field, false));

    const meta = document.createElement('div');
    meta.className = 'r-meta';
    meta.textContent = [r.location, r._award ? awardLabel(r._award) : ''].filter(Boolean).join(' · ');

    main.appendChild(nameRow); main.appendChild(meta);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'r-toggle';
    toggle.setAttribute('aria-label', 'Profile');
    toggle.innerHTML = '<span class="r-toggle-chev">▾</span>';
    toggle.addEventListener('click', () => toggleDetails(row, r));

    row.appendChild(year); row.appendChild(main); row.appendChild(toggle);
    return row;
  }

  async function toggleDetails(row, r){
    const existing = row.querySelector('.r-details');
    const wasOpen = existing && existing.classList.contains('open');
    document.querySelectorAll('.recipient .r-details.open').forEach(d => {
      d.classList.remove('open');
      d.innerHTML = '';
      const t = d.closest('.recipient') && d.closest('.recipient').querySelector('.r-toggle');
      if(t) t.classList.remove('open');
    });
    if(wasOpen) return;

    let det = existing;
    if(!det){
      det = document.createElement('div');
      det.className = 'r-details';
      row.appendChild(det);
    }
    row.querySelector('.r-toggle').classList.add('open');
    det.classList.add('open');
    det.innerHTML = `<div class="r-detail-loading">${escapeHtml(Sanchi18n.t('detail_loading'))}</div>`;

    const lang = Sanchi18n.getLang();
    const enTitle = r.wikipedia_url ? decodeURIComponent(r.wikipedia_url.split('/wiki/')[1] || '') : null;

    if(!enTitle){
      det.innerHTML = `<div class="r-detail-fallback">${escapeHtml(Sanchi18n.t('detail_no_article'))}</div>` + detailBadgeLine(r);
      return;
    }

    const [enSum] = await Promise.all([fetchEnSummary(enTitle)]);
    const knTitle = enSum ? await fetchKnTitle(enSum.title || enTitle) : null;
    const knSum = knTitle ? await fetchKnSummary(knTitle) : null;
    det.innerHTML = detailHtml(r, enSum, knSum, lang);
  }

  function detailBadgeLine(r){
    return `<div class="r-detail-badges">${fieldBadge(r.field, true)}${awardBadge(r._award, true)}</div>`;
  }

  function detailHtml(r, enSum, knSum, lang){
    const enName = enSum && enSum.title ? enSum.title : r.name;
    const knName = knSum && knSum.title ? knSum.title : null;
    const thumbRaw = (knSum && knSum.thumbnail && knSum.thumbnail.source)
      || (enSum && enSum.thumbnail && enSum.thumbnail.source)
      || null;
    const thumb = thumbRaw ? thumbRaw.split('?')[0] : null;
    const enExtract = enSum && enSum.extract ? enSum.extract : '';
    const knExtract = knSum && knSum.extract ? knSum.extract : '';
    const metaLine = [r.year, r.location].filter(Boolean).join(' · ');

    let out = '<div class="r-detail-head">';
    if(thumb) out += `<img class="r-detail-thumb" src="${thumb}" alt="" loading="lazy">`;
    out += '<div class="r-detail-head-main">';
    if(knName) out += `<div class="r-detail-name">${escapeHtml(knName)}</div>`;
    out += `<div class="r-detail-name-en">${escapeHtml(enName)}</div>`;
    out += `<div class="r-detail-badges">${fieldBadge(r.field, true)}${awardBadge(r._award, true)}</div>`;
    if(metaLine) out += `<div class="r-detail-meta">${escapeHtml(metaLine)}</div>`;
    out += '</div>';
    if(r.wikipedia_url){
      out += `<a class="r-detail-link" href="${r.wikipedia_url}" target="_blank" rel="noopener">${escapeHtml(Sanchi18n.t('detail_read'))}</a>`;
    }
    out += '</div>';

    if(lang === 'kn'){
      if(knExtract) out += `<div class="r-detail-intro"><span class="r-detail-lang">${escapeHtml(Sanchi18n.t('detail_lang_kn'))}</span>${escapeHtml(knExtract)}</div>`;
      if(enExtract) out += `<div class="r-detail-intro r-detail-intro-alt"><span class="r-detail-lang">${escapeHtml(Sanchi18n.t('detail_lang_en'))}</span>${escapeHtml(enExtract)}</div>`;
    } else {
      if(enExtract) out += `<div class="r-detail-intro"><span class="r-detail-lang">${escapeHtml(Sanchi18n.t('detail_lang_en'))}</span>${escapeHtml(enExtract)}</div>`;
      if(knExtract) out += `<div class="r-detail-intro r-detail-intro-alt"><span class="r-detail-lang">${escapeHtml(Sanchi18n.t('detail_lang_kn'))}</span>${escapeHtml(knExtract)}</div>`;
    }
    if(!enExtract && !knExtract) out += `<div class="r-detail-fallback">${escapeHtml(Sanchi18n.t('detail_no_article'))}</div>`;
    return out;
  }

  // ---------------- Wikipedia API helpers (cached) ----------------

  const wikiCache = new Map();

  async function cachedJson(url, key){
    if(wikiCache.has(key)) return wikiCache.get(key);
    try{
      const res = await fetch(url);
      if(!res.ok) throw new Error('http ' + res.status);
      const data = await res.json();
      wikiCache.set(key, data);
      return data;
    }catch(e){
      wikiCache.set(key, null);
      return null;
    }
  }

  function fetchEnSummary(title){
    return cachedJson(
      'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title),
      'sum:en:' + title
    );
  }

  async function fetchKnTitle(title){
    const data = await cachedJson(
      'https://en.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=kn&lllimit=1&format=json&origin=*&titles=' + encodeURIComponent(title),
      'll:' + title
    );
    const pages = data && data.query && data.query.pages;
    const page = pages && Object.values(pages)[0];
    const ll = page && page.langlinks && page.langlinks[0];
    return ll ? ll['*'] : null;
  }

  function fetchKnSummary(title){
    return cachedJson(
      'https://kn.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title),
      'sum:kn:' + title
    );
  }

  // ---------------- admin rendering ----------------

  function renderWikidataDesc(){
    const award = adminAward();
    if(!award || !els.wdDesc) return;
    const records = state.data[award.id] || [];
    const total = records.length;
    const withQid = records.filter(r => r.wikidata_qid).length;
    const alreadyLinked = records.filter(r => r.has_wikidata_statement === true).length;
    const missing = records.filter(r => r.wikidata_qid && r.has_wikidata_statement === false).length;
    const withWiki = records.filter(r => r.wikipedia_url).length;

    const panel = document.querySelector('.wikidata-panel');

    if(missing === 0 && withQid > 0){
      els.wdDesc.textContent = Sanchi18n.t('wd_desc_complete', withQid, total);
      if(panel) panel.style.display = 'none';
    } else {
      els.wdDesc.textContent = Sanchi18n.t('wd_desc_general', withWiki, total, withQid, alreadyLinked, missing);
      if(panel) panel.style.display = '';
      if(els.missingCount) els.missingCount.textContent = missing;
      const li1 = document.getElementById('wd-col1-li1');
      if(li1){
        const lang = Sanchi18n.getLang();
        const awardName = awardLabel(award);
        li1.textContent = award.wikidata_qid
          ? Sanchi18n.t('wd_col1_li1', award.wikidata_qid, awardName)
          : 'Compiled a ready-to-run QuickStatements batch.';
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
    const award = adminAward();
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

    if(award && (award.id === 'karnataka-ratna' || award.id === 'jnanpith-kannada' || award.id === 'bharat-ratna-kannadiga')){
      const total = (state.data[award.id] || []).length;
      const withWiki = (state.data[award.id] || []).filter(r => r.wikipedia_url).length;
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

  // ---------------- sources & citations ----------------

  function debounce(fn, ms){
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }
})();
