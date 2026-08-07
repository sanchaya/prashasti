const SanchiMap = (function(){
  let map = null;
  let markers = [];
  let currentAwardId = null;
  let districtLayer = null;
  let stateLayer = null;
  let boundariesLoaded = false;
  let hasFitted = false;
  let countByDistrict = {};
  let maxCount = 1;
  let districtLayers = {};
  let markersByKey = {};
  let centroidByKey = {};
  let personPins = [];
  let selectHandler = null;
  let selectedKey = null;

  const DISTRICT_ALIAS = {
    'Chamarajanagar': 'Chamarajanagara',
    'Chamarajnagar': 'Chamarajanagara',
    'Chamrajanagar': 'Chamarajanagara',
    'Chikkaballapur': 'Chikkaballapura',
    'Chikballapur': 'Chikkaballapura',
    'Bagalkot': 'Bagalkote',
    'Bagalakot': 'Bagalkote',
    'Bagalakote': 'Bagalkote',
    'Balakote': 'Bagalkote',
    'Bangalore': 'Bengaluru Urban',
    'Bengaluru': 'Bengaluru Urban',
    'Bengaluru City': 'Bengaluru Urban',
    'Bangalore Rural': 'Bengaluru Rural',
    'Bengaluru Rural': 'Bengaluru Rural',
    'Belgaum': 'Belagavi',
    'Bellary': 'Ballari',
    'Bijapur': 'Vijayapura',
    'Vijaypur': 'Vijayapura',
    'Chikmagalur': 'Chikkamagaluru',
    'Chikmagaluru': 'Chikkamagaluru',
    'Dakshin Kannada': 'Dakshina Kannada',
    'South Kannada': 'Dakshina Kannada',
    'Davangere': 'Davanagere',
    'Gulbarga': 'Kalaburagi',
    'Kalaburgi': 'Kalaburagi',
    'Mysore': 'Mysuru',
    'Ramanagar': 'Ramanagara',
    'Ramanagaram': 'Ramanagara',
    'Shimoga': 'Shivamogga',
    'Shivmoga': 'Shivamogga',
    'Tumkur': 'Tumakuru',
    'Udipi': 'Udupi',
    'Uttar Kannada': 'Uttara Kannada',
    'Vijayanagar': 'Vijayanagara',
    'Yadagiri': 'Yadgir',
    'Kodagu': 'Kodagu',
  };

  function normalize(name){
    const key = (DISTRICT_ALIAS[name] || name || '').toLowerCase().replace(/[^a-z]/g, '');
    return key;
  }

  // Pure — resolves a raw location string to a canonical district key against
  // an arbitrary set of valid keys. No dependency on the map/boundaries being
  // loaded, so callers elsewhere (e.g. app.js stats) can use it immediately.
  function resolveDistrictKey(raw, validKeys){
    if(!raw) return null;
    const clean = String(raw).replace(/[\[\].]/g, '').trim();
    const n = DISTRICT_ALIAS[clean] ? normalize(DISTRICT_ALIAS[clean]) : normalize(clean);
    if(validKeys.has(n)) return n;
    for(const k of validKeys){ if(k.includes(n) || n.includes(k)) return k; }
    return null;
  }

  function districtKeyFor(raw){
    return resolveDistrictKey(raw, new Set(Object.keys(districtLayers)));
  }

  function colorFor(t){
    // ramp light blue -> blue -> purple
    const c1 = [214, 236, 252];
    const c2 = [33, 150, 243];
    const c3 = [122, 54, 141];
    let r, g, b;
    if(t < 0.5){
      const p = t / 0.5;
      r = Math.round(c1[0] + (c2[0] - c1[0]) * p);
      g = Math.round(c1[1] + (c2[1] - c1[1]) * p);
      b = Math.round(c1[2] + (c2[2] - c1[2]) * p);
    } else {
      const p = (t - 0.5) / 0.5;
      r = Math.round(c2[0] + (c3[0] - c2[0]) * p);
      g = Math.round(c2[1] + (c3[1] - c2[1]) * p);
      b = Math.round(c2[2] + (c3[2] - c2[2]) * p);
    }
    return `rgb(${r},${g},${b})`;
  }

  function ensureMap(){
    if(map) return map;
    const el = document.getElementById('karnataka-map');
    if(!el || typeof L === 'undefined') return null;
    map = L.map('karnataka-map', {
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([14.9, 76.4], 7);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 12,
      minZoom: 6,
    }).addTo(map);
    return map;
  }

  function clearMarkers(){
    markers.forEach(m => m.remove());
    markers = [];
    markersByKey = {};
    centroidByKey = {};
    clearPersonPins();
  }

  // ---------------- individual name pins (shown for the selected district only) ----------------
  // No per-person geocoding exists (scripts/geocode_locations.py is WIP/unfinished), so pins are
  // jittered around the district's centroid rather than a real per-person location -- honest about
  // precision, but still puts every name on the map once you select a district.

  function clearPersonPins(){
    personPins.forEach(p => p.remove());
    personPins = [];
  }

  function jitteredPoint(center, index){
    if(index === 0) return center;
    const ring = Math.ceil(index / 8);
    const angle = ((index % 8) / 8) * Math.PI * 2;
    const radius = 0.045 * ring;
    return [center[0] + Math.sin(angle) * radius, center[1] + Math.cos(angle) * radius];
  }

  function showPersonPins(records, key){
    clearPersonPins();
    if(!map || !key) return;
    const center = centroidByKey[key];
    if(!center) return;
    const permanent = records.length <= 60;
    records.forEach((r, i) => {
      const pt = jitteredPoint(center, i);
      const dot = L.circleMarker(pt, {
        radius: 4,
        fillColor: '#e67e22',
        fillOpacity: 0.95,
        color: '#a85a1a',
        weight: 1,
        opacity: 0.95,
      }).addTo(map);
      dot.bindTooltip(escape(r.name), {
        permanent,
        direction: 'top',
        offset: [0, -6],
        opacity: 0.95,
        className: 'person-pin-label',
      });
      dot.bindPopup(`<div class="district-tooltip"><strong>${escape(r.name)}</strong><br>${escape([r.year, r.field].filter(Boolean).join(' · '))}</div>`);
      dot.bringToFront();
      personPins.push(dot);
    });
  }

  function hideLegend(){
    const el = document.getElementById('map-legend');
    if(el) el.style.display = 'none';
  }
  function showLegend(){
    const el = document.getElementById('map-legend');
    if(el) el.style.display = '';
  }

  function showNoLocation(){
    clearMarkers();
    hideLegend();
    if(districtLayer){ districtLayer.remove(); districtLayer = null; }
    if(stateLayer){ stateLayer.remove(); stateLayer = null; }
    boundariesLoaded = false;
    currentAwardId = null;
    districtLayers = {};
    if(selectedKey){ selectedKey = null; if(selectHandler) selectHandler(null); }

    const frame = document.querySelector('.map-frame');
    if(!frame) return;
    frame.querySelectorAll('.map-empty').forEach(e => e.remove());
    const empty = document.createElement('div');
    empty.className = 'map-empty';
    empty.textContent = Sanchi18n ? Sanchi18n.t('map_no_location') : 'No district data for this award yet.';
    frame.appendChild(empty);

    const foot = document.getElementById('map-footnote');
    if(foot) foot.style.display = 'none';
  }

  function hideNoLocation(){
    const frame = document.querySelector('.map-frame');
    if(frame) frame.querySelectorAll('.map-empty').forEach(e => e.remove());
    const foot = document.getElementById('map-footnote');
    if(foot) foot.style.display = '';
    showLegend();
  }

  function radiusFor(count, maxCount){
    const minR = 6, maxR = 34;
    return minR + (maxR - minR) * Math.sqrt(count / maxCount);
  }

  async function loadBoundaries(m){
    if(boundariesLoaded) return;
    try{
      const [distRes, stateRes] = await Promise.all([
        fetch('data/karnataka-districts.geojson'),
        fetch('data/karnataka-state.geojson'),
      ]);
      const distGeo = await distRes.json();
      const stateGeo = await stateRes.json();

      districtLayer = L.geoJSON(distGeo, {
        style: districtStyle,
        onEachFeature: (f, lyr) => {
          const key = normalize(f.properties.district);
          districtLayers[key] = lyr;
          lyr.on('mouseover', () => { if(selectedKey !== key) lyr.setStyle({ weight: 1.6, fillOpacity: 0.8 }); });
          lyr.on('mouseout', () => { if(selectedKey !== key) lyr.setStyle(districtStyle(f)); });
          lyr.on('click', () => {
            const count = countByDistrict[key] || 0;
            if(count === 0) return;
            selectKey(key, f.properties.district, count);
          });
        },
      }).addTo(m);

      stateLayer = L.geoJSON(stateGeo, {
        style: { color: '#7a368d', weight: 2.5, fill: false, opacity: 0.95 },
      }).addTo(m);

      boundariesLoaded = true;
    }catch(e){
      // boundaries are decorative; fall back to circle markers only
    }
  }

  function districtStyle(f){
    const count = countByDistrict[normalize(f.properties.district)] || 0;
    return {
      fillColor: colorFor(maxCount ? count / maxCount : 0),
      fillOpacity: 0.55,
      color: '#ffffff',
      weight: 1,
    };
  }

  function applyStyles(){
    if(districtLayer){
      districtLayer.setStyle(districtStyle);
      if(stateLayer) stateLayer.bringToFront();
    }
    if(markers.length){
      markers.forEach(m => m.bringToFront());
    }
  }

  function renderLegend(){
    const el = document.getElementById('map-legend');
    if(!el) return;
    el.innerHTML = '';
    const title = document.createElement('span');
    title.className = 'legend-title';
    title.textContent = Sanchi18n ? Sanchi18n.t('map_legend_title') : 'Recipients per district';
    el.appendChild(title);

    const low = document.createElement('span');
    low.className = 'legend-label';
    low.textContent = '0';
    el.appendChild(low);

    const ramp = document.createElement('div');
    ramp.className = 'legend-ramp';
    const bins = 5;
    for(let i = 0; i < bins; i++){
      const sw = document.createElement('span');
      sw.className = 'legend-swatch';
      sw.style.background = colorFor(i / (bins - 1));
      ramp.appendChild(sw);
    }
    el.appendChild(ramp);

    const high = document.createElement('span');
    high.className = 'legend-label';
    high.textContent = maxCount.toLocaleString();
    el.appendChild(high);

    const sep = document.createElement('span');
    sep.className = 'legend-sep';
    el.appendChild(sep);

    const dotK = document.createElement('span');
    dotK.className = 'legend-dot';
    dotK.style.background = '#2196f3';
    el.appendChild(dotK);
    const labelK = document.createElement('span');
    labelK.className = 'legend-key';
    labelK.textContent = Sanchi18n ? Sanchi18n.t('map_legend_district') : 'Karnataka district';
    el.appendChild(labelK);

    const dotO = document.createElement('span');
    dotO.className = 'legend-dot';
    dotO.style.background = '#16a085';
    el.appendChild(dotO);
    const labelO = document.createElement('span');
    labelO.className = 'legend-key';
    labelO.textContent = Sanchi18n ? Sanchi18n.t('map_legend_outside') : 'Outside Karnataka';
    el.appendChild(labelO);
  }

  // ---------------- click-to-select (district or outside-location) ----------------
  // Persists until cleared — distinct from the ephemeral 5s flash used by highlightLocation()
  // when a recipient name is clicked in the browse list.

  function styleSelected(entry){
    if(entry.isOther){
      entry.layer.setStyle({ fillOpacity: 1, weight: 3, color: '#7a368d' });
    } else {
      entry.layer.setStyle({ fillOpacity: 0.9, color: '#7a368d', fillColor: '#a83480', weight: 2.5 });
    }
    entry.layer.bringToFront();
  }

  function styleUnselected(key, entry){
    if(entry.isOther){
      entry.layer.setStyle({ fillOpacity: 0.7, weight: 1.5, color: '#0f6b58' });
    } else {
      entry.layer.setStyle({ fillOpacity: 0.45, color: '#1876c9', fillColor: '#2196f3' });
    }
  }

  function selectKey(key, label, count, opts){
    if(selectedKey === key){ clearSelection(); return; }
    // reset previous selection's visuals
    if(selectedKey){
      if(districtLayers[selectedKey]){
        const f = districtLayers[selectedKey].feature;
        if(f) districtLayers[selectedKey].setStyle(districtStyle(f));
      }
      if(markersByKey[selectedKey]) styleUnselected(selectedKey, markersByKey[selectedKey]);
    }
    selectedKey = key;
    const isOther = !!(opts && opts.isOther);
    if(!isOther && districtLayers[key]){
      districtLayers[key].setStyle({ fillColor: '#7a368d', fillOpacity: 0.85, color: '#7a368d', weight: 3, opacity: 0.95 });
      districtLayers[key].bringToFront();
      if(stateLayer) stateLayer.bringToFront();
      if(map && districtLayers[key].getBounds){
        map.flyToBounds(districtLayers[key].getBounds().pad(0.35), { maxZoom: 9, duration: 0.8 });
      }
    }
    if(markersByKey[key]) styleSelected(markersByKey[key]);
    if(selectHandler) selectHandler({ key, label, count, isOther });
  }

  function clearSelection(){
    if(!selectedKey) return;
    if(districtLayers[selectedKey]){
      const f = districtLayers[selectedKey].feature;
      if(f) districtLayers[selectedKey].setStyle(districtStyle(f));
    }
    if(markersByKey[selectedKey]) styleUnselected(selectedKey, markersByKey[selectedKey]);
    selectedKey = null;
    clearPersonPins();
    if(selectHandler) selectHandler(null);
  }

  function onSelect(fn){ selectHandler = fn; }

  // Does a recipient's raw location string belong to the current map selection?
  function matchesSelection(rawLocation){
    if(!selectedKey || !rawLocation) return false;
    if(selectedKey.indexOf('other:') === 0){
      return selectedKey === 'other:' + String(rawLocation).toLowerCase();
    }
    return districtKeyFor(rawLocation) === selectedKey;
  }

  // Select a district from a recipient's raw location string — same persistent
  // selection a map click produces (bidirectional: name click <-> map click).
  // Returns true if a district matched.
  function highlightLocation(rawLocation, label){
    if(!map || !districtLayer || !rawLocation) return false;
    const key = districtKeyFor(rawLocation);
    if(!key || !districtLayers[key]) return false;

    const f = districtLayers[key].feature;
    const districtName = f && f.properties && f.properties.district;
    const count = countByDistrict[key] || 0;
    selectKey(key, districtName || rawLocation, count);

    if(label && districtLayers[key]){
      const tip = `<div class="district-tooltip"><strong>${escape(label)}</strong><br>${districtName ? escape(districtName) : ''}</div>`;
      districtLayers[key].bindTooltip(tip, { direction: 'top', offset: [0, -14], sticky: false, opacity: 1 });
      setTimeout(() => { try{ districtLayers[key].openTooltip(); }catch(e){} }, 900);
    }

    return true;
  }

  function escape(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  async function load(award){
    if(!award || !award.has_location_data){
      showNoLocation();
      return;
    }
    hideNoLocation();
    const m = ensureMap();
    if(!m) return;

    const dataFile = award.district_data_file || 'data/district_counts.json';
    let payload;
    try{
      const res = await fetch(dataFile);
      payload = await res.json();
    }catch(e){
      document.getElementById('map-section').style.display = 'none';
      return;
    }

    if(currentAwardId === award.id){
      refresh();
      return;
    }
    currentAwardId = award.id;

    const districts = payload.districts;
    countByDistrict = {};
    districts.forEach(d => { countByDistrict[normalize(d.district)] = d.count; });
    maxCount = Math.max(...districts.map(d => d.count), 1);

    const total = districts.reduce((s, d) => s + d.count, 0);
    const coverageEl = document.getElementById('map-coverage-count');
    if(coverageEl) coverageEl.textContent = total.toLocaleString();

    function updateFootnote(){
      document.getElementById('map-footnote').textContent = Sanchi18n.t('map_footnote', payload.outside_karnataka, payload.unmapped);
    }
    updateFootnote();
    window.addEventListener('sanchaya:langchange', updateFootnote);

    const others = payload.other_locations || [];

    clearMarkers();
    await loadBoundaries(m);
    applyStyles();
    renderLegend();

    if(!hasFitted && stateLayer){
      hasFitted = true;
      const fit = stateLayer.getBounds().pad(0.05);
      others.forEach(o => { if(o.lon > 69 && o.lon < 83) fit.extend([o.lat, o.lon]); });
      setTimeout(() => map.fitBounds(fit, { maxZoom: 8 }), 0);
    }

    districts.sort((a, b) => b.count - a.count).forEach(d => {
      const key = normalize(d.district);
      const circle = L.circleMarker([d.lat, d.lon], {
        radius: radiusFor(d.count, maxCount),
        fillColor: '#2196f3',
        fillOpacity: 0.45,
        color: '#1876c9',
        weight: 1.5,
        opacity: 0.9,
      }).addTo(m);

      circle.bindTooltip(
        `<div class="district-tooltip"><strong>${d.district}</strong><br>${d.count} recipient${d.count === 1 ? '' : 's'} — ${Sanchi18n ? Sanchi18n.t('map_click_hint') : 'click to see them'}</div>`,
        { direction: 'top', offset: [0, -radiusFor(d.count, maxCount)], sticky: false }
      );
      circle.on('mouseover', () => { if(selectedKey !== key) circle.setStyle({ fillOpacity: 0.8, color: '#7a368d', fillColor: '#a83480' }); });
      circle.on('mouseout', () => { if(selectedKey !== key) circle.setStyle({ fillOpacity: 0.45, color: '#1876c9', fillColor: '#2196f3' }); });
      circle.on('click', () => selectKey(key, d.district, d.count));
      markers.push(circle);
      markersByKey[key] = { layer: circle, isOther: false };
      centroidByKey[key] = [d.lat, d.lon];
    });

    others.forEach(o => {
      const key = 'other:' + o.location.toLowerCase();
      const circle = L.circleMarker([o.lat, o.lon], {
        radius: radiusFor(o.count, maxCount),
        fillColor: '#16a085',
        fillOpacity: 0.7,
        color: '#0f6b58',
        weight: 1.5,
        opacity: 0.95,
      }).addTo(m);

      circle.bindTooltip(
        `<div class="district-tooltip"><strong>${o.location}</strong><br>${o.count} recipient${o.count === 1 ? '' : 's'} — outside Karnataka</div>`,
        { direction: 'top', offset: [0, -radiusFor(o.count, maxCount)], sticky: false }
      );
      circle.on('mouseover', () => { if(selectedKey !== key) circle.setStyle({ fillOpacity: 1, weight: 2.5 }); });
      circle.on('mouseout', () => { if(selectedKey !== key) circle.setStyle({ fillOpacity: 0.7, weight: 1.5 }); });
      circle.on('click', () => selectKey(key, o.location, o.count, { isOther: true }));
      markers.push(circle);
      markersByKey[key] = { layer: circle, isOther: true };
      centroidByKey[key] = [o.lat, o.lon];
    });

    // fix sizing glitch when the map div was hidden (display:none) during init
    setTimeout(() => m.invalidateSize(), 50);
  }

  function refresh(){
    if(!map) return;
    setTimeout(() => {
      map.invalidateSize();
      if(districtLayer) districtLayer.bringToFront();
      if(stateLayer) stateLayer.bringToFront();
      if(markers.length) markers.forEach(m => m.bringToFront());
    }, 50);
  }

  return { load, refresh, highlightLocation, onSelect, clearSelection, matchesSelection, normalizeDistrictName: normalize, resolveDistrictKey, showPersonPins, clearPersonPins };
})();

window.SanchiMap = SanchiMap;
