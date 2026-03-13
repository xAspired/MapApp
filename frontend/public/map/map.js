import { 
  folders, loadFolders, renderFolders,
  openCreateFolderModal, initFolderInputs
} from './folders.js';
import { markersLayer, loadMarkers, addMarkerToBackend, enableAddMarker } from './markers.js';
import { initSearch } from './search.js';
import { initCountriesToggle } from './countriesToggle.js';
import * as Handlers from './handlers.js';

// ======================================================
// INIZIALIZZA MAPPA
// ======================================================
const map = L.map('map').setView([41.8719, 12.5674], 5);
window.map = map;

// ======================================================
// INIT TILE LAYERS
// ======================================================
function initTileLayers() {
  const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', noWrap: true });
  const satelliteLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenTopoMap contributors', noWrap: true });
  const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO', noWrap: true });

  streetLayer.addTo(map);

  L.control.layers({
    "Strada": streetLayer,
    "Satellite": satelliteLayer,
    "Scura": darkLayer
  }).addTo(map);
}

// ======================================================
// INIT PANES
// ======================================================
function initPanes() {
  map.createPane('maskPane'); map.getPane('maskPane').style.zIndex = 400;
  map.createPane('markersTop'); map.getPane('markersTop').style.zIndex = 650;
  map.createPane('popupTop'); map.getPane('popupTop').style.zIndex = 1000;
}

// ======================================================
// INIT FAB
// ======================================================
function initFAB() {
  const fabToggle = document.getElementById('fab-toggle');
  const fabMenu = document.getElementById('fab-menu');

  fabToggle.addEventListener('click', () => fabMenu.classList.toggle('hidden'));

  fabMenu.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    fabMenu.classList.add('hidden');

    switch(action) {
      case 'locate': locateUser(); break;
      case 'add-marker':
        enableAddMarker(map, folders, addMarkerToBackend, loadMarkers);
        break;
      case 'create-folder':
        openCreateFolderModal(map, loadMarkers);
        break;
      case 'reset':
        map.setView([41.8719, 12.5674], 5);
        break;
    }
  });
}

// ======================================================
// CLICK GLOBALI
// ======================================================
function initGlobalClickEvents() {
  document.addEventListener('click', async (e) => {
    if (await Handlers.handleDeleteFolderClick(e, map, folders, renderFolders)) return;
    if (await Handlers.handleAssignMarkerClick(e, map, folders)) return;
    if (await Handlers.handleRemoveMarkerClick(e, map, folders)) return;
    if (await Handlers.handleRatingClick(e, map, folders)) return;
    if (await Handlers.handleDeleteMarkerClick(e, map, folders)) return;
    if (await Handlers.handlePopupFolderClick(e, map, folders)) return;
  });
}

// ======================================================
// GEOLOCALIZZAZIONE
// ======================================================
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

// ======================================================
// INIT COMPLETO MAPPA
// ======================================================
initTileLayers();
initPanes();
initFAB();
initGlobalClickEvents();

await loadFolders();
renderFolders();
await loadMarkers(map, folders);
initCountriesToggle(map, markersLayer);
initSearch(map, folders, addMarkerToBackend, loadMarkers);

// inizializza input cartelle
initFolderInputs(map, loadMarkers);