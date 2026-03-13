// ======================================================
// countriesToggle.js - spotlight world mask senza bordi fissi
// ======================================================

let countriesLayer = null;
let highlightLayer = null;
let enabled = false;

// ======================================================
// point in polygon
// ======================================================
function pointInPolygon(lng, lat, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// ======================================================
// controlla se feature ha marker
// ======================================================
function featureHasMarker(feature, markersLayer) {
  let polygons = [];
  if (feature.geometry.type === "Polygon") polygons = [feature.geometry.coordinates];
  if (feature.geometry.type === "MultiPolygon") polygons = feature.geometry.coordinates;

  return markersLayer.getLayers().some(marker => {
    if (!(marker instanceof L.Marker)) return false;
    const { lat, lng } = marker.getLatLng();
    return polygons.some(poly =>
      poly.some(ring => pointInPolygon(lng, lat, ring))
    );
  });
}

// ======================================================
// crea maschera del mondo
// ======================================================
function buildWorldMask(featuresWithMarkers) {
  const world = [
    [
      [-180, -90],
      [180, -90],
      [180, 90],
      [-180, 90],
      [-180, -90]
    ]
  ];

  const holes = [];
  featuresWithMarkers.forEach(f => {
    if (f.geometry.type === "Polygon") holes.push(f.geometry.coordinates[0]);
    if (f.geometry.type === "MultiPolygon") f.geometry.coordinates.forEach(p => holes.push(p[0]));
  });

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [world[0], ...holes]
    }
  };
}

// ======================================================
// init toggle
// ======================================================
export function initCountriesToggle(map, markersLayer) {
  const btn = document.getElementById("toggle-countries");
  if (!btn) return;

  if (!map.getPane("maskPane")) {
    map.createPane("maskPane");
    map.getPane("maskPane").style.zIndex = 350;
  }

  btn.addEventListener("click", async () => {
    enabled = !enabled;

    if (!enabled) {
      // ✅ rimuove entrambi i layer quando si disattiva
      if (countriesLayer) map.removeLayer(countriesLayer);
      if (highlightLayer) map.removeLayer(highlightLayer);

      countriesLayer = null;
      highlightLayer = null;

      btn.textContent = "🌍 Mostra paesi con pin";
      btn.classList.remove("active");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/countries");
      const geojson = await res.json();

      const countriesWithMarkers = geojson.features.filter(f =>
        featureHasMarker(f, markersLayer)
      );

      // maschera semi-trasparente senza bordi
      const mask = buildWorldMask(countriesWithMarkers);
      countriesLayer = L.geoJSON(mask, {
        pane: "maskPane",
        style: {
          fillColor: "#0f172a",
          fillOpacity: 0.65,
          stroke: false // niente bordi
        }
      }).addTo(map);

      // highlight paesi con marker solo al mouse
      highlightLayer = L.geoJSON(countriesWithMarkers, {
        pane: "maskPane",
        style: { fillOpacity: 0 }, // invisibile di default
        onEachFeature: (feature, layer) => {
          layer.on("mouseover", () => layer.setStyle({
            fillColor: "#64748b",
            fillOpacity: 0.3
          }));
          layer.on("mouseout", () => layer.setStyle({ fillOpacity: 0 }));
          layer.on("click", () => map.fitBounds(layer.getBounds(), { padding: [40, 40] }));
        }
      }).addTo(map);

      btn.textContent = "❌ Nascondi filtro";
      btn.classList.add("active");

    } catch (err) {
      console.error("Errore toggle paesi:", err);
      alert("Errore caricando i paesi");
    }
  });
}