(function(){
  let allRecords = [];
  let selected = null;

  const els = {};

  function grabEls(){
    els.search = document.getElementById('wp-search');
    els.suggestions = document.getElementById('wp-suggestions');
    els.preview = document.getElementById('wp-preview');
    els.previewWrap = document.getElementById('wp-preview-wrap');
    els.selectedName = document.getElementById('wp-selected-name');
    els.copyBtn = document.getElementById('wp-copy-btn');
    els.downloadBtn = document.getElementById('wp-download-btn');
    els.generateBtn = document.getElementById('wp-generate-btn');
  }

  function districtPhrase(loc){
    if(!loc) return null;
    return loc;
  }

  function buildWikitext(r){
    const name = r.name;
    const year = r.year;
    const field = r.field && r.field !== 'Unspecified' ? r.field : null;
    const district = districtPhrase(r.location);

    const infoboxLines = [
      '{{Infobox person',
      `| name        = ${name}`,
    ];
    if(district) infoboxLines.push(`| birth_place = ${district}, Karnataka, India`);
    infoboxLines.push('| nationality = Indian');
    if(field) infoboxLines.push(`| occupation  = ${field}`);
    infoboxLines.push(`| awards      = [[Rajyotsava Prashasti]] (${year})`);
    infoboxLines.push('}}');

    const introBits = [];
    introBits.push(`'''${name}'''`);
    introBits.push(`is a recipient of the '''[[Rajyotsava Prashasti]]'''${district ? `, from ${district}, Karnataka` : ', from Karnataka'},`);
    introBits.push(`honoured in ${year}${field ? ` for contributions to ${field.toLowerCase()}` : ''}.{{citation needed}}`);

    const wikitext = [
      infoboxLines.join('\n'),
      '',
      introBits.join(' '),
      '',
      '== Career ==',
      '{{citation needed}}',
      '',
      '== Awards ==',
      `* [[Rajyotsava Prashasti]] (${year})${field ? ` — for contributions to ${field.toLowerCase()}.` : '.'}{{citation needed}}`,
      '',
      '== References ==',
      '{{reflist}}',
      '',
      '[[Category:Rajyotsava Prashasti recipients]]',
      district ? `[[Category:People from ${district} district]]` : '<!-- add a [[Category:People from ___ district]] once known -->',
      '<!-- Remove or replace the line below: use [[Category:Year of birth missing (living people)]] if still living and birth year unknown, or [[Category:1900 births]]-style if known -->',
      '[[Category:Living people]]',
    ].join('\n');

    return wikitext;
  }

  function renderSuggestions(query){
    els.suggestions.innerHTML = '';
    if(!query || query.length < 2){ els.suggestions.style.display = 'none'; return; }
    const q = query.toLowerCase();
    const matches = allRecords
      .filter(r => !r.wikipedia_url && r.name.toLowerCase().includes(q))
      .slice(0, 8);
    if(matches.length === 0){ els.suggestions.style.display = 'none'; return; }
    els.suggestions.style.display = 'block';
    matches.forEach(r => {
      const li = document.createElement('li');
      li.textContent = `${r.name} — ${r.year}${r.field ? ' · ' + r.field : ''}`;
      li.addEventListener('click', () => selectPerson(r));
      els.suggestions.appendChild(li);
    });
  }

  function selectPerson(r){
    selected = r;
    els.search.value = r.name;
    els.suggestions.style.display = 'none';
    els.selectedName.textContent = `${r.name} · ${r.year}${r.field ? ' · ' + r.field : ''}${r.location ? ' · ' + r.location : ''}`;
    els.previewWrap.style.display = 'block';
    els.preview.value = buildWikitext(r);
  }

  function init(records){
    allRecords = records;
    grabEls();
    if(!els.search) return;

    els.search.addEventListener('input', () => renderSuggestions(els.search.value.trim()));
    els.search.addEventListener('blur', () => setTimeout(() => { els.suggestions.style.display = 'none'; }, 150));

    els.generateBtn.addEventListener('click', () => {
      if(selected) els.preview.value = buildWikitext(selected);
    });

    els.copyBtn.addEventListener('click', async () => {
      try{
        await navigator.clipboard.writeText(els.preview.value);
        const old = els.copyBtn.textContent;
        els.copyBtn.textContent = '✓';
        setTimeout(() => { els.copyBtn.textContent = old; }, 1200);
      }catch(e){
        els.preview.select();
        document.execCommand('copy');
      }
    });

    els.downloadBtn.addEventListener('click', () => {
      if(!selected) return;
      const blob = new Blob([els.preview.value], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selected.name.replace(/\s+/g, '_') + '_draft.txt';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  window.SanchiWikiDraft = { init };
})();
