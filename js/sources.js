// Prashasti Sanchaya — Sources & citations page
// Standalone page (sources.html): loads the award registry, every award's records,
// and the sources registry, then renders each source with a per-record count,
// grouped by award.

(async function(){
  const registry = await fetchJSON('data/awards.json', []);
  const sourcesRegistry = await fetchJSON('data/sources.json', null);

  const data = {};
  await Promise.all(registry.map(async a => {
    if(!a.data_file){ data[a.id] = []; return; }
    data[a.id] = await fetchJSON(a.data_file, []);
  }));

  const list = document.getElementById('reference-list');
  const desc = document.getElementById('ref-desc');
  if(!list || !sourcesRegistry) return;

  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function render(){
    const lang = Sanchi18n.getLang();
    const src = sourcesRegistry.sources;

    const counts = {};
    Object.keys(data).forEach(aid => {
      (data[aid] || []).forEach(r => {
        if(r.source_id) counts[r.source_id] = (counts[r.source_id] || 0) + 1;
      });
    });

    const kinds = {};
    Object.keys(src).forEach(id => { kinds[id] = src[id].kind; });
    const hasNews = Object.keys(src).some(id => kinds[id] === 'news');

    // Group sources by award, keeping award registry order.
    const awardGroups = registry
      .map(a => ({
        award: a,
        ids: Object.keys(src).filter(id => (src[id].awards || []).includes(a.id) && counts[id] > 0),
      }))
      .filter(g => g.ids.length > 0);

    list.innerHTML = '';

    const total = Object.keys(data).reduce((s, aid) => s + (data[aid] || []).length, 0);
    const withSrc = Object.keys(counts).reduce((s, id) => s + counts[id], 0);
    const pct = total ? Math.round((withSrc / total) * 100) : 0;
    if(desc){
      desc.textContent = Sanchi18n.t('ref_desc') + ' ' +
        `${withSrc.toLocaleString()} / ${total.toLocaleString()} (${pct}%) ${lang === 'kn' ? 'ದಾಖಲೆಗಳಿಗೆ ಉಲ್ಲೇಖವಿದೆ.' : 'records have a citation.'}`;
    }

    awardGroups.forEach(g => {
      const a = g.award;
      const name = lang === 'kn' ? a.name_kn : a.name_en;

      const group = document.createElement('div');
      group.className = 'ref-group';

      const head = document.createElement('h2');
      head.className = 'ref-group-title';
      head.textContent = name;
      group.appendChild(head);

      g.ids.forEach(id => {
        const s = src[id];
        const row = document.createElement('div');
        row.className = 'reference-item';
        const title = escapeHtml(s.title);
        const url = s.url || '#';
        const count = counts[id];
        const publisher = s.publisher ? escapeHtml(s.publisher) : '';
        const date = s.date ? ' · ' + escapeHtml(s.date) : '';
        const langTag = s.language && s.language === 'kn' ? 'kn' : 'en';
        const langLabel = langTag === 'kn' ? 'ಕನ್ನಡ' : 'English';
        const kindLabel = s.kind === 'news'
          ? escapeHtml(Sanchi18n.t('ref_source_news'))
          : escapeHtml(Sanchi18n.t('ref_source_wiki'));
        row.innerHTML = `
          <div class="reference-main">
            <a class="reference-title" href="${url}" target="_blank" rel="noopener">${title}</a>
            <div class="reference-meta">${[publisher, date].filter(Boolean).join('')} · <span class="reference-lang">${langLabel}</span> · ${kindLabel}</div>
          </div>
          <div class="reference-count"><strong>${count}</strong><span>${escapeHtml(Sanchi18n.t('ref_records_label'))}</span></div>
        `;
        group.appendChild(row);
      });

      list.appendChild(group);
    });

    const notes = document.createElement('div');
    notes.className = 'ref-license';
    const wikiNote = Sanchi18n.t('ref_license_wiki');
    const newsNote = Sanchi18n.t('ref_license_news');
    notes.textContent = [wikiNote, hasNews ? newsNote : ''].filter(Boolean).join(' ');
    list.appendChild(notes);
  }

  Sanchi18n.init();
  render();
  window.addEventListener('sanchaya:langchange', render);

  async function fetchJSON(url, fallback){
    try{
      const res = await fetch(url);
      return await res.json();
    }catch(e){
      return fallback;
    }
  }
})();
