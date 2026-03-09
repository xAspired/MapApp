import { folders } from './folders.js';
import { loadFoldersFromBackend, renderFolders } from './map.js';

export let markersLayer = null;

function createColoredIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      width:18px;
      height:18px;
      border-radius:50%;
      border:2px solid white;
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

// ===============================
// CREA POPUP MARKER CON STELLE
// ===============================
export function createMarkerPopup(marker, folders) {
  // folderId convertito in number o null
  const folderId = marker.properties.folderId !== null ? Number(marker.properties.folderId) : null;
  const folder = folders.find(f => f.id === folderId);
  const rating = marker.properties.rating || 0;

  const folderItems = folders.map(f => `
    <div class="folder-select-item" 
         data-folder-id="${f.id}" 
         style="padding:3px 6px; margin:2px 0; cursor:pointer; border-radius:4px; background:${f.color}; color:white; font-size:13px;">
      ${f.name}
    </div>
  `).join('');

  const starsHTML = [...Array(5)].map((_, i) => {
    const filled = i < rating ? "#ffc107" : "#ccc";
    return `<span class="star" data-value="${i+1}" style="cursor:pointer;color:${filled};font-size:16px;margin-right:2px;">★</span>`;
  }).join('');

  return `
    <div class="marker-popup" data-id="${marker.properties.id}" style="min-width:220px;font-family:Arial,sans-serif;padding:10px;border-radius:8px;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
      <div style="font-weight:bold;margin-bottom:4px;font-size:14px;">Nome</div>
      <div style="font-size:13px;color:#333;margin-bottom:6px;">${marker.properties.name}</div>

      <div style="font-weight:bold;font-size:13px;color:#555;margin-top:6px;margin-bottom:2px;">Descrizione</div>
      <div style="font-size:13px;color:#333;margin-bottom:6px;">${marker.properties.description || '-'}</div>

      <hr style="margin:6px 0;border:none;border-top:1px solid #eee;" />

      ${folder ? `
        <div style="margin-bottom:6px;">
          <div style="margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:13px;font-weight:bold;display:flex;align-items:center;gap:6px;color:${folder.color};">
              📁 ${folder.name}
            </span>
            <button class="remove-from-folder-btn" data-id="${marker.properties.id}" title="Rimuovi dalla cartella" style="width:24px;height:24px;border:none;border-radius:4px;color:black;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">✖</button>
          </div>
          <div class="folder-rating" data-id="${marker.properties.id}" style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">${starsHTML}</div>
        </div>
      ` : `<div class="folder-rating" data-id="${marker.properties.id}" style="margin-bottom:6px;">${starsHTML}</div>`}

      <hr style="margin:6px 0;border:none;border-top:1px solid #eee;" />

      <div style="display:flex;gap:6px;justify-content:flex-start;margin-top:4px;">
        <button class="add-to-folder-btn" data-id="${marker.properties.id}" title="Aggiungi a cartella" style="width:28px;height:28px;border:none;border-radius:4px;background:#007bff;color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;">➕</button>
        <button class="delete-marker-btn" data-id="${marker.properties.id}" title="Elimina marker" style="width:28px;height:28px;border:none;border-radius:4px;background:#dc3545;color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;">🗑️</button>
      </div>

      <div class="folder-selection" style="display:none;margin-top:4px;">${folderItems}</div>
    </div>
  `;
}

// ===============================
// CARICA MARKER
// ===============================
export async function loadMarkers(map, folders) {
  try {
    const res = await fetch('http://localhost:3000/api/markers');
    if (!res.ok) throw new Error(await res.text());
    const geojson = await res.json();
    console.log("✅ GeoJSON ricevuto:", geojson.features.map(f => ({
      id: f.properties.id,
      folderId: f.properties.folderId,
      name: f.properties.name
    })));

    // svuota i marker nelle cartelle
    // reset dei markers
  folders.forEach(f => f.markers = []);

// associa i marker ai folders
geojson.features.forEach(f => {
  // Prendi folderId dalla risposta del backend se esiste
  // fallback a null se undefined
  const folderId = f.properties.folderId !== undefined
  ? Number(f.properties.folderId)
  : null;
  const rating = f.rating || 0;

  // Aggiorna properties così tutto il codice che usa properties funziona
  f.properties.folderId = folderId;
  f.properties.rating = rating;

  // Crea markerObj per associare alle cartelle
  const markerObj = {
    id: Number(f.properties.id),
    name: f.properties.name,
    description: f.properties.description,
    folderId,
    rating,
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1]
  };

  // Associa marker alla cartella se folderId esiste
  if (folderId !== null) {
    const folder = folders.find(fld => fld.id === folderId);
    if (folder) folder.markers.push(markerObj);
  }
});

console.log("💡 Markers assegnati alle cartelle:", folders.map(f => ({id: f.id, markers: f.markers})));

    // rimuovi layer precedente
    if (markersLayer) map.removeLayer(markersLayer);

    markersLayer = L.geoJSON(geojson, {
      pointToLayer: (feature, latlng) => {
        const folder = folders.find(f => f.id === feature.properties.folderId);
        const color = folder ? folder.color : "#007bff";
        return L.marker(latlng, { pane: 'markersTop', icon: createColoredIcon(color) });
      },
      onEachFeature: (feature, layer) => {

        layer.bindPopup(
          createMarkerPopup(feature, folders),
          { pane: 'popupTop', className: 'custom-popup' }
        );
      
        layer.on('popupopen', async (e) => {
      
          // 1️⃣ ricarica folders dal backend
          await loadFoldersFromBackend();
      
          // 2️⃣ aggiorna pannello cartelle
          renderFolders();
      
          // 3️⃣ aggiorna popup
          const popupContent = createMarkerPopup(feature, folders);
          e.popup.setContent(popupContent);
      
        });
      
      }
    }).addTo(map);

  } catch (err) {
    console.error('Errore caricamento marker:', err);
  }
}

// ===============================
// AGGIUNGI MARKER BACKEND
// ===============================
export async function addMarkerToBackend(name, description, lon, lat, folderId) {
  try {
    const payload = { name, description, lon, lat };

    // se folderId presente, passalo così com'è (backend farà il check)
    if (folderId !== null && folderId !== undefined) payload.folderId = Number(folderId);

    const res = await fetch('http://localhost:3000/api/markers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    return await res.json();

  } catch (err) {
    console.error('Errore POST marker:', err);
    throw err;
  }
}

// ===============================
// DELETE MARKER BACKEND
// ===============================
export async function deleteMarkerFromBackend(markerId) {
  try {
    const res = await fetch(`http://localhost:3000/api/markers/${markerId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (err) {
    console.error('Errore DELETE marker:', err);
    throw err;
  }
}

// ===============================
// UPDATE RATING BACKEND
// ===============================
export async function updateMarkerRating(markerId, rating) {
  try {
    const res = await fetch(`http://localhost:3000/api/markers/${markerId}/rating`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating })
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (err) {
    console.error('Errore PATCH rating:', err);
    throw err;
  }
}