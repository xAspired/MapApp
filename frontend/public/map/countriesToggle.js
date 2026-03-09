let maskLayer = null;
let countriesLayer = null;
let enabled = false;

export function initCountriesToggle(map) {
  const btn = document.getElementById('toggle-countries');
  if (!btn) return;

  // 🔹 Creiamo un pane per la maschera sotto i marker
  if (!map.getPane('maskPane')) {
    map.createPane('maskPane');
    map.getPane('maskPane').style.zIndex = 400; // deve stare sotto markerPane
  }

  btn.addEventListener('click', async () => {
    enabled = !enabled;

    if (!enabled) {
      if (maskLayer) map.removeLayer(maskLayer);
      if (countriesLayer) map.removeLayer(countriesLayer);

      maskLayer = null;
      countriesLayer = null;

      btn.textContent = '🌍 Mostra paesi con pin';
      btn.classList.remove('active');
      return;
    }

    try {
      const res = await fetch(
        'http://localhost:3000/api/countries?withMarkers=true'
      );
      const geojson = await res.json();

      const world = [[
        [-90, -180],
        [-90, 180],
        [90, 180],
        [90, -180],
        [-90, -180]
      ]];

      const holes = [];

      geojson.features.forEach(f => {
        if (f.geometry.type === 'Polygon') {
          holes.push(
            f.geometry.coordinates[0].map(([lng, lat]) => [lat, lng])
          );
        }
        if (f.geometry.type === 'MultiPolygon') {
          f.geometry.coordinates.forEach(poly => {
            holes.push(
              poly[0].map(([lng, lat]) => [lat, lng])
            );
          });
        }
      });

      // 🔹 Maschera sotto i marker
      maskLayer = L.polygon([world, ...holes], {
        pane: 'maskPane',
        fillColor: '#ffffff',
        fillOpacity: 1,
        stroke: false,
        interactive: false
      }).addTo(map);
      
      if (window.markersLayer) {
        window.markersLayer.eachLayer(marker => {
          if (marker instanceof L.Marker) marker.bringToFront();
        });
      }

      // 🔹 Layer dei paesi
      countriesLayer = L.geoJSON(geojson, {
        style: {
          color: '#2e7d32',
          weight: 2,
          fillOpacity: 0
        }
      }).addTo(map);


      btn.textContent = '❌ Nascondi filtro';
      btn.classList.add('active');

    } catch (err) {
      console.error(err);
    }
  });
}