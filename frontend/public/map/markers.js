// ======================================================
// MARKERS.JS
// Gestione marker su Leaflet e interazione con backend
// ======================================================

// Layer globale dei marker
export let markersLayer = null;

// ======================================================
// CREA ICONA COLORE PERSONALIZZATA
// color -> colore cerchio marker
// ======================================================
export function createColoredIcon(color) {
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

// ======================================================
// CREA POPUP MARKER
// marker -> oggetto GeoJSON marker
// folders -> array cartelle per associare colori e popup
// ======================================================
export function createMarkerPopup(marker, folders) {
  const folderId = marker.properties.folderId !== null ? Number(marker.properties.folderId) : null;
  const folder = folders.find(f => f.id === folderId);
  const rating = marker.properties.rating || 0;

  // HTML cartelle disponibili
  const folderItems = folders.map(f => `
    <div class="folder-select-item" data-folder-id="${f.id}" 
         style="padding:3px 6px;margin:2px 0;cursor:pointer;border-radius:4px;background:${f.color};color:white;font-size:13px;">
      ${f.name}
    </div>
  `).join('');

  // HTML stelle per rating
  const starsHTML = [...Array(5)].map((_, i) => {
    const filled = i < rating ? "#ffc107" : "#ccc";
    return `<span class="star" data-value="${i+1}" 
                  style="cursor:pointer;color:${filled};font-size:16px;margin-right:2px;">★</span>`;
  }).join('');

  // Ritorna HTML popup
  return `
    <div class="marker-popup" data-id="${marker.properties.id}" 
         style="min-width:220px;font-family:Arial,sans-serif;padding:10px;border-radius:8px;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
      <div style="font-weight:bold;margin-bottom:4px;font-size:14px;">Nome</div>
      <div style="font-size:13px;color:#333;margin-bottom:6px;">${marker.properties.name}</div>
      <div style="font-weight:bold;font-size:13px;color:#555;margin-top:6px;margin-bottom:2px;">Descrizione</div>
      <div style="font-size:13px;color:#333;margin-bottom:6px;">${marker.properties.description || '-'}</div>
      <hr style="margin:6px 0;border:none;border-top:1px solid #eee;" />
      ${folder ? `
        <div style="margin-bottom:6px;">
          <div style="margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;font-weight:bold;display:flex;align-items:center;gap:6px;color:${folder.color};">
              📁 ${folder.name}
            </span>
            <button class="remove-from-folder-btn" data-id="${marker.properties.id}" 
                    style="width:24px;height:24px;border:none;border-radius:4px;color:black;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">✖</button>
          </div>
          <div class="folder-rating" data-id="${marker.properties.id}" 
               style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">${starsHTML}</div>
        </div>
      ` : `<div class="folder-rating" data-id="${marker.properties.id}" style="margin-bottom:6px;">${starsHTML}</div>`}
      <hr style="margin:6px 0;border:none;border-top:1px solid #eee;" />
      <div style="display:flex;gap:6px;justify-content:flex-start;margin-top:4px;">
        <button class="add-to-folder-btn" data-id="${marker.properties.id}" 
                style="width:28px;height:28px;border:none;border-radius:4px;background:#007bff;color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;">➕</button>
        <button class="delete-marker-btn" data-id="${marker.properties.id}" 
                style="width:28px;height:28px;border:none;border-radius:4px;background:#dc3545;color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;">🗑️</button>
      </div>
      <div class="folder-selection" style="display:none;margin-top:4px;">${folderItems}</div>
    </div>
  `;
}

// ======================================================
// CARICA MARKER DAL BACKEND
// map -> istanza Leaflet
// folders -> cartelle per assegnare marker
// ======================================================
export async function loadMarkers(map, folders) {
  try {
    const res = await fetch('http://localhost:3000/api/markers');
    if (!res.ok) throw new Error(await res.text());
    const geojson = await res.json();

    // Pulisce markers nelle cartelle
    folders.forEach(f => f.markers = []);

    // Popola folders[].markers e sistema proprietà
    geojson.features.forEach(f => {
      const folderId = f.properties.folderId !== undefined ? Number(f.properties.folderId) : null;
      f.properties.folderId = folderId;
      f.properties.rating = f.properties.rating || 0;

      const markerObj = {
        id: Number(f.properties.id),
        name: f.properties.name,
        description: f.properties.description,
        folderId,
        rating: f.properties.rating,
        lon: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1]
      };
      if (folderId !== null) {
        const folder = folders.find(fld => fld.id === folderId);
        if (folder) folder.markers.push(markerObj);
      }
    });

    // Rimuove layer precedente se esiste
    if (markersLayer) map.removeLayer(markersLayer);

    // Aggiunge GeoJSON layer su mappa
    markersLayer = L.geoJSON(geojson, {
      pointToLayer: (feature, latlng) => {
        const folder = folders.find(f => f.id === feature.properties.folderId);
        const color = folder ? folder.color : "#007bff";
        return L.marker(latlng, { pane: 'markersTop', icon: createColoredIcon(color) });
      },
      onEachFeature: (feature, layer) => {
        layer.bindPopup(createMarkerPopup(feature, folders), { pane: 'popupTop', className: 'custom-popup' });
      }
    }).addTo(map);
  } catch (err) {
    console.error('Errore caricamento marker:', err);
  }
}

// ======================================================
// AGGIUNGI MARKER SU BACKEND
// ======================================================
export async function addMarkerToBackend(name, description, lon, lat, folderId) {
  try {
    const payload = { name, description, lon, lat };
    if (folderId != null) payload.folderId = Number(folderId);

    const res = await fetch('http://localhost:3000/api/markers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (err) {
    console.error('Errore POST marker:', err);
    throw err;
  }
}

// ======================================================
// ELIMINA MARKER DAL BACKEND
// ======================================================
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

// ======================================================
// AGGIORNA RATING MARKER SU BACKEND
// ======================================================
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

// ======================================================
// AGGIUNGI MARKER MANUALMENTE CLICCANDO SULLA MAPPA
// map -> istanza Leaflet
// folders -> cartelle disponibili
// addMarkerToBackend -> funzione POST marker
// loadMarkers -> ricarica marker
// ======================================================
export function enableAddMarker(map, folders, addMarkerToBackend, loadMarkers) {
  let tempMarkerCoords = null;
  alert("Clicca sulla mappa per aggiungere un marker");

  map.once('click', e => {
    tempMarkerCoords = e.latlng;
    const modal = document.getElementById('marker-modal');
    modal.classList.add('show');
    setTimeout(() => { document.getElementById('marker-name-input')?.focus(); }, 50);

    const saveBtn = document.getElementById('marker-save-btn');
    const cancelBtn = document.getElementById('marker-cancel-btn');
    const folderSelect = document.getElementById('marker-folder-select');

    folderSelect.innerHTML =
      `<option value="">Nessuna cartella</option>` +
      folders.map(f => `<option value="${f.id}">${f.name}</option>`).join('');

    // Funzione chiusura modal
    const closeModal = () => {
      modal.classList.remove('show');
      document.getElementById('marker-name-input').value = '';
      document.getElementById('marker-desc-input').value = '';
      saveBtn.removeEventListener('click', saveHandler);
      cancelBtn.removeEventListener('click', closeModal);
      tempMarkerCoords = null;
    };

    // Funzione salvataggio marker
    const saveHandler = async () => {
      const name = document.getElementById('marker-name-input').value.trim();
      if (!name) return alert("Inserisci un nome per il marker!");
      const desc = document.getElementById('marker-desc-input').value.trim();
      const folderId = folderSelect.value || null;
      try {
        await addMarkerToBackend(name, desc, tempMarkerCoords.lng, tempMarkerCoords.lat, folderId);
        await loadMarkers(map, folders);
        closeModal();
      } catch(err) {
        console.error(err);
        alert("Errore durante il salvataggio del marker");
      }
    };

    saveBtn.addEventListener('click', saveHandler);
    cancelBtn.addEventListener('click', closeModal);
  });
}