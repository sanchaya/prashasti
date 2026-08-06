(function(){
  let payload = null;

  async function load(){
    try{
      const res = await fetch('data/representation.json');
      payload = await res.json();
    }catch(e){
      const section = document.getElementById('representation-section');
      if(section) section.style.display = 'none';
      return;
    }
    render();
    window.addEventListener('sanchaya:langchange', render);
  }

  function bar(container, label, pct){
    const row = document.createElement('div');
    row.className = 'rep-bar-row';
    row.innerHTML = `
      <div class="rep-bar-label">${label}</div>
      <div class="rep-bar-track"><div class="rep-bar-fill" style="width:${pct}%"></div></div>
      <div class="rep-bar-pct">${pct}%</div>
    `;
    container.appendChild(row);
  }

  function render(){
    if(!payload) return;
    const c = payload.completeness;
    const g = payload.gender;
    const d = payload.district;
    const e = payload.enrichment_potential;

    // completeness bars
    const compEl = document.getElementById('rep-completeness-bars');
    compEl.innerHTML = '';
    bar(compEl, Sanchi18n.t('rep_field_bar'), c.with_field_pct);
    bar(compEl, Sanchi18n.t('rep_location_bar'), c.with_location_pct);
    bar(compEl, Sanchi18n.t('rep_wikipedia_bar'), c.with_wikipedia_pct);
    bar(compEl, Sanchi18n.t('rep_wikidata_bar'), c.with_wikidata_pct);

    // gender summary + chart
    document.getElementById('rep-gender-summary').textContent =
      Sanchi18n.t('rep_gender_summary', g.female_pct, g.sample_size, g.sample_pct_of_total);

    const chartEl = document.getElementById('rep-gender-chart');
    chartEl.innerHTML = '';
    const maxTotal = Math.max(...g.by_decade.map(x => x.total), 1);
    g.by_decade.forEach(x => {
      const col = document.createElement('div');
      col.className = 'rg-col';
      const stackHeight = Math.max(10, (x.total / maxTotal) * 100);
      const malePct = x.total ? (x.male / x.total) * 100 : 0;
      const femalePct = x.total ? (x.female / x.total) * 100 : 0;
      const otherPct = x.total ? (x.other / x.total) * 100 : 0;
      col.innerHTML = `
        <div class="rg-pct">${x.female_pct}%</div>
        <div class="rg-stack" style="height:${stackHeight}%">
          <div class="rg-male" style="height:${malePct}%"></div>
          <div class="rg-female" style="height:${femalePct}%"></div>
          ${otherPct ? `<div class="rg-other" style="height:${otherPct}%"></div>` : ''}
        </div>
        <div class="rg-label">${x.decade}</div>
      `;
      chartEl.appendChild(col);
    });

    // district summary + lowest list
    document.getElementById('rep-district-summary').textContent =
      Sanchi18n.t('rep_district_summary', d.sample_size, d.sample_pct_of_total, d.districts_represented, d.districts_total);
    const lowEl = document.getElementById('rep-district-lowest');
    lowEl.innerHTML = '';
    d.lowest.forEach(item => {
      const pill = document.createElement('span');
      pill.className = 'rep-lowest-pill';
      pill.innerHTML = `${item.district}: <strong>${item.count}</strong>`;
      lowEl.appendChild(pill);
    });

    // enrichment bars
    const enrichEl = document.getElementById('rep-enrich-bars');
    enrichEl.innerHTML = '';
    bar(enrichEl, Sanchi18n.t('rep_photo_bar'), e.photo_pct);
    bar(enrichEl, Sanchi18n.t('rep_occupation_bar'), e.occupation_pct);
    bar(enrichEl, Sanchi18n.t('rep_birthplace_bar'), e.birthplace_pct);
    bar(enrichEl, Sanchi18n.t('rep_deceased_bar'), e.deceased_pct);
  }

  load();
})();
