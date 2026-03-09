import { markersLayer, loadMarkers, addMarkerToBackend, createMarkerPopup, deleteMarkerFromBackend, updateMarkerRating } from './markers.js';
import { initCountriesToggle } from './countriesToggle.js';

let folders = []; // ora tutto backend
const map = L.map('map').setView([41.8719, 12.5674], 5);
window.map = map;

// ======= TILE LAYERS =======
const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', noWrap: true });
const satelliteLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenTopoMap contributors', noWrap: true });
const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO', noWrap: true });
streetLayer.addTo(map);

L.control.layers({
  "Strada": streetLayer,
  "Satellite": satelliteLayer,
  "Scura": darkLayer
}).addTo(map);

// ======= PANES =======
map.createPane('maskPane'); map.getPane('maskPane').style.zIndex = 400;
map.createPane('markersTop'); map.getPane('markersTop').style.zIndex = 650;
map.createPane('popupTop'); map.getPane('popupTop').style.zIndex = 1000;

// ======= INIT =======
await loadFoldersFromBackend();
console.log("📂 Folders caricati:", folders.map(f => ({id: f.id, name: f.name})));
renderFolders();
loadMarkers(map, folders);
initCountriesToggle(map);

// ======= FAB =======
const fabToggle = document.getElementById('fab-toggle');
const fabMenu = document.getElementById('fab-menu');
fabToggle.addEventListener('click', () => fabMenu.classList.toggle('hidden'));
fabMenu.addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  if (!action) return;
  fabMenu.classList.add('hidden');
  switch(action) {
    case 'locate': locateUser(); break;
    case 'add-marker': enableAddMarker(); break;
    case 'create-folder': openCreateFolder(); break;
    case 'reset': map.setView([41.8719, 12.5674], 5); break;
  }
});

// ======= CLICK GLOBALE =======
let markerToAssign = null;

// ===============================
// CARICA MARKER E ASSEGNA ALLE CARTELLE
// ===============================
export async function loadMarkersAndAssignToFolders(map, folders) {
  try {
    const res = await fetch('http://localhost:3000/api/markers');
    if (!res.ok) throw new Error(await res.text());
    const geojson = await res.json();

    // svuota markers nelle cartelle
    folders.forEach(f => f.markers = []);

    // associa marker alle cartelle
    geojson.features.forEach(f => {
      const markerObj = {
        id: f.properties.id,
        name: f.properties.name,
        description: f.properties.description,
        folderId: f.properties.folderId,
        rating: f.properties.rating,
        lon: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1]
      };
      if (markerObj.folderId != null) {
        const folder = folders.find(fld => Number(fld.id) === Number(markerObj.folderId));
        if (folder) folder.markers.push(markerObj);
      }
    });
    console.log("💡 Markers assegnati alle cartelle:", folders.map(f => ({ id: f.id, markers: f.markers.map(m=>m.id) })));

    // rimuovi layer precedente
    if (markersLayer) map.removeLayer(markersLayer);

    markersLayer = L.geoJSON(geojson, {
      pointToLayer: (feature, latlng) => {
        const folder = folders.find(f => Number(f.id) === Number(feature.properties.folderId));        const color = folder ? folder.color : "#007bff";
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

// ===============================
// ASSEGNA MARKER A CARTELLA
// ===============================
async function assignMarkerToFolder(markerId, folderId) {
  console.log("💡 Assegnamento marker iniziato:", { markerId, folderId });

  try {
    // 1️⃣ PATCH sul backend
    const res = await fetch(`/api/markers/${markerId}/folder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId: folderId !== null ? Number(folderId) : null })
    });

    if (!res.ok) throw new Error(await res.text());
    const updatedMarker = await res.json();
    console.log("💡 Risposta backend PATCH:", updatedMarker);

    // 2️⃣ Ricarica folders dal backend
    await loadFoldersFromBackend();
    console.log("💡 Folders aggiornati:", folders);

    // 3️⃣ Ricarica markers dal backend e assegna ai folders
    await loadMarkers(map, folders); // loadMarkers ora popola folders[].markers
    console.log("💡 Markers assegnati alle cartelle:", folders.map(f => ({id: f.id, markers: f.markers})));

    // 4️⃣ Ridisegna il pannello folders
    renderFolders();

  } catch (err) {
    console.error("Errore assegnando marker:", err);
    alert("Errore assegnando marker alla cartella");
  }
}

document.addEventListener('click', async (e) => {

  // ❌ Delete folder
  if (e.target.classList.contains('delete-folder')) {
    const id = e.target.dataset.id;
    if (!confirm("Eliminare cartella? I marker perderanno il colore associato.")) return;
    await fetch(`/api/folders/${id}`, { method: 'DELETE' });
    await loadFoldersFromBackend();
    renderFolders();
    loadMarkers(map, folders);
    return;
  }

  // Click cartella per assegnare marker
  const folderRow = e.target.closest('.folder-row');
  if (folderRow && markerToAssign) {
    const folderId = folderRow.querySelector('.folder-name').dataset.id;
    await assignMarkerToFolder(markerToAssign, folderId);
    markerToAssign = null;
    document.querySelectorAll('.folder-row').forEach(r => r.classList.remove('selectable-folder'));
    return;
  }

  // Rimuovi marker da cartella
  if (e.target.classList.contains('remove-from-folder-btn')) {
    const markerId = e.target.dataset.id;
    await assignMarkerToFolder(markerId, null);
    return;
  }

  // Click su stelle rating
  if (e.target.classList.contains('star')) {
    const markerId = e.target.closest('.folder-rating').dataset.id;
    const rating = parseInt(e.target.dataset.value);
    try { await updateMarkerRating(markerId, rating); } 
    catch(err){ console.error(err); alert("Errore aggiornamento rating"); }
    loadMarkers(map, folders);
    return;
  }

  // DELETE MARKER
  if (e.target.classList.contains('delete-marker-btn')) {
    const markerId = e.target.dataset.id;

    if (!confirm("Eliminare questo marker?")) return;

    try {
      await deleteMarkerFromBackend(markerId);

      // ricarica markers
      await loadMarkers(map, folders);

      // chiudi popup
      map.closePopup();

    } catch (err) {
      console.error(err);
      alert("Errore eliminando il marker");
    }

    return;
  }

  // Click su add-to-folder nel popup
  if (e.target.classList.contains('add-to-folder-btn')) {
    const popupContent = e.target.closest('.leaflet-popup-content');
    const folderList = popupContent.querySelector('.folder-selection');
    if (!folderList.hasChildNodes()) {
      folderList.innerHTML = folders.map(f => `<div class="folder-select-item" data-folder-id="${f.id}" style="padding:3px 6px; margin:2px 0; cursor:pointer; border-radius:4px; background:${f.color}; color:white;">${f.name}</div>`).join('');
    }
    folderList.style.display = folderList.style.display==='none'?'block':'none';
    return;
  }

  // Click cartella popup per assegnare marker
  if (e.target.classList.contains('folder-select-item')) {
    const popupContent = e.target.closest('.leaflet-popup-content');
    const markerBtn = popupContent.querySelector('.add-to-folder-btn');
    const markerId = markerBtn.dataset.id;
    const folderId = e.target.dataset.folderId;
    await assignMarkerToFolder(markerId, folderId);
    const popup = e.target.closest('.leaflet-popup');
    if(popup) map.closePopup();
    return;
  }
});

// ======= GEOLOCATION =======
function locateUser() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(pos => {
    const {latitude, longitude} = pos.coords;
    L.marker([latitude, longitude], { pane:'markersTop' })
      .addTo(map)
      .bindPopup('📍 Sei qui', { pane:'popupTop' })
      .openPopup();
    map.setView([latitude, longitude], 6);
  });
}

// ======= CREA CARTELLA =======
function openCreateFolder() {
  const modal = document.getElementById('folder-modal');
  modal.classList.add('show');
  const saveBtn = document.getElementById('folder-save-btn');
  const cancelBtn = document.getElementById('folder-cancel-btn');

  const closeModal = () => {
    modal.classList.remove('show');
    document.getElementById('folder-name-input').value = '';
    saveBtn.removeEventListener('click', saveHandler);
    cancelBtn.removeEventListener('click', closeModal);
  };

  const saveHandler = async () => {
    const name = document.getElementById('folder-name-input').value.trim();
    const color = document.getElementById('folder-color-input').value;
    if (!name) return alert("Inserisci un nome!");
    try {
      await fetch('/api/folders', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ name, color })
      });
      await loadFoldersFromBackend();
      renderFolders();
      closeModal();
    } catch(err) {
      console.error(err);
      alert("Errore creando cartella");
    }
  };

  saveBtn.addEventListener('click', saveHandler);
  cancelBtn.addEventListener('click', closeModal);
}

// ======= AGGIUNGI MARKER =======
let tempMarkerCoords = null;
function enableAddMarker() {
  alert("Clicca sulla mappa per aggiungere un marker");
  map.once('click', e => {
    tempMarkerCoords = e.latlng;
    const modal = document.getElementById('marker-modal');
    modal.classList.add('show');
    const saveBtn = document.getElementById('marker-save-btn');
    const cancelBtn = document.getElementById('marker-cancel-btn');
    const folderSelect = document.getElementById('marker-folder-select');
    folderSelect.innerHTML = `<option value="">Nessuna cartella</option>` + folders.map(f => `<option value="${f.id}">${f.name}</option>`).join('');

    const closeModal = () => {
      modal.classList.remove('show');
      document.getElementById('marker-name-input').value = '';
      document.getElementById('marker-desc-input').value = '';
      saveBtn.removeEventListener('click', saveHandler);
      cancelBtn.removeEventListener('click', closeModal);
      tempMarkerCoords = null;
    };

    const saveHandler = async () => {
      const name = document.getElementById('marker-name-input').value.trim();
      if (!name) return alert("Inserisci un nome per il marker!");
      const desc = document.getElementById('marker-desc-input').value.trim();
      const folderId = folderSelect.value || null;
      try {
        await addMarkerToBackend(name, desc, tempMarkerCoords.lng, tempMarkerCoords.lat, folderSelect.value || null);        loadMarkers(map, folders);
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

// ======= RENDER CARTELLE =======
export function renderFolders(){
  const panel = document.getElementById('folders-panel');
  if(!panel) return;
  panel.innerHTML = folders.length===0 ? '<small>Nessuna cartella</small>' : '';
  folders.forEach(f=>{
    const div = document.createElement('div');
    div.className='folder-row';
    div.innerHTML = `
      <div style="width:12px;height:12px;border-radius:50%;background:${f.color};"></div>
      <input type="text" value="${f.name}" data-id="${f.id}" class="folder-name">
      <input type="color" value="${f.color}" data-id="${f.id}" class="folder-color">
      <button data-id="${f.id}" class="delete-folder">✖</button>
    `;
    panel.appendChild(div);
  });
}

document.addEventListener('input', async (e) => {
  if (e.target.classList.contains('folder-color') || e.target.classList.contains('folder-name')) {
    const id = e.target.dataset.id;
    const folder = folders.find(f => f.id == id);
    if (!folder) return;

    // aggiorna localmente il valore corretto
    if (e.target.classList.contains('folder-color')) folder.color = e.target.value;
    if (e.target.classList.contains('folder-name')) folder.name = e.target.value;

    // payload corretto da inviare
    const payload = {
      name: folder.name,
      color: folder.color
    };

    try {
      const res = await fetch(`/api/folders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      // ricarica folders e ridisegna markers
      await loadFoldersFromBackend();
      loadMarkers(map, folders);
    } catch(err) {
      console.error("Errore aggiornando cartella:", err);
      alert("Errore salvando la cartella");
    }
  }
});

// ======= CARICAMENTO CARTELLE BACKEND =======
export async function loadFoldersFromBackend() {
  try {
    const res = await fetch('/api/folders');
    if (!res.ok) throw new Error("Errore fetch folders");
    const data = await res.json();
    folders.length = 0;
    data.forEach(f => {
      folders.push({
        ...f,
        id: Number(f.id)   // <--- forza numero
      });
    });
  } catch(err) {
    console.error("Errore caricando cartelle:", err);
  }
}