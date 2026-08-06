(async function(){
  const el = document.getElementById('karnataka-map');
  if(!el || typeof L === 'undefined') return;

  let payload;
  try{
    const res = await fetch('data/district_counts.json');
    payload = await res.json();
  }catch(e){
    document.getElementById('map-section').style.display = 'none';
    return;
  }

  const districts = payload.districts;
  const total = districts.reduce((s,d) => s + d.count, 0);
  document.getElementById('map-coverage-count').textContent = total.toLocaleString();
  function updateFootnote(){
    document.getElementById('map-footnote').textContent = Sanchi18n.t('map_footnote', payload.outside_karnataka);
  }
  updateFootnote();
  window.addEventListener('sanchaya:langchange', updateFootnote);

  const map = L.map('karnataka-map', {
    scrollWheelZoom: false,
    attributionControl: true,
  }).setView([15.0, 75.9], 7);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 12,
    minZoom: 6,
  }).addTo(map);

  const maxCount = Math.max(...districts.map(d => d.count), 1);
  // area-proportional radius: sqrt scale, clamped to a sensible pixel range
  function radiusFor(count){
    const minR = 6, maxR = 34;
    return minR + (maxR - minR) * Math.sqrt(count / maxCount);
  }

  districts.sort((a,b) => b.count - a.count).forEach(d => {
    const circle = L.circleMarker([d.lat, d.lon], {
      radius: radiusFor(d.count),
      fillColor: '#2196f3',
      fillOpacity: 0.45,
      color: '#1876c9',
      weight: 1.5,
      opacity: 0.9,
    }).addTo(map);

    circle.bindTooltip(
      `<div class="district-tooltip"><strong>${d.district}</strong><br>${d.count} recipient${d.count===1?'':'s'}</div>`,
      { direction: 'top', offset: [0, -radiusFor(d.count)], sticky: false }
    );

    circle.on('mouseover', () => circle.setStyle({ fillOpacity: 0.8, color: '#7a368d', fillColor: '#a83480' }));
    circle.on('mouseout', () => circle.setStyle({ fillOpacity: 0.45, color: '#1876c9', fillColor: '#2196f3' }));
  });
})();
