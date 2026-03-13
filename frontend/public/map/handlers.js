// Import delle funzioni dai moduli markers e folders
import { loadMarkers, updateMarkerRating } from './markers.js';
import { loadFolders, deleteFolder } from './folders.js';

// Variabile per tenere traccia del marker da assegnare a una cartella
let markerToAssign = null;

// Funzione per impostare il marker che sarà assegnato a una cartella
export function setMarkerToAssign(id) {
  markerToAssign = id;
}

// ============================
// DELETE FOLDER
// ============================
// Gestisce il click sul bottone per eliminare una cartella
export async function handleDeleteFolderClick(e, map, folders, renderFolders) {
  if (!e.target.classList.contains('delete-folder')) return false; // ignora se non è il bottone corretto
  const id = e.target.dataset.id; // id della cartella
  if (!confirm("Eliminare cartella? I marker perderanno il colore associato.")) return true; // conferma con l'utente
  await deleteFolder(id); // chiama il backend per eliminare la cartella
  await loadFolders(); // ricarica le cartelle aggiornate dal backend
  renderFolders(); // aggiorna la UI
  await loadMarkers(map, folders); // ricarica i marker per aggiornare eventuali colori
  return true;
}

// ============================
// ASSIGN MARKER CLICK
// ============================
// Assegna il marker selezionato alla cartella cliccata
export async function handleAssignMarkerClick(e, map, folders) {
  if (!markerToAssign) return false; // se non c'è marker da assegnare esci
  const folderRow = e.target.closest('.folder-row'); // trova la cartella cliccata
  if (!folderRow) return false;
  const folderId = folderRow.querySelector('.folder-name').dataset.id; // prende l'id della cartella

  await assignMarkerToFolder(markerToAssign, folderId, map, folders); // assegna marker
  markerToAssign = null; // reset variabile globale
  return true;
}

// ============================
// REMOVE MARKER FROM FOLDER
// ============================
// Rimuove un marker da una cartella (clic su bottone rimuovi)
export async function handleRemoveMarkerClick(e, map, folders) {
  if (!e.target.classList.contains('remove-from-folder-btn')) return false;
  const markerId = e.target.dataset.id;
  await assignMarkerToFolder(markerId, null, map, folders); // assegna null -> rimuove dal folder
  return true;
}

// ============================
// UPDATE MARKER RATING
// ============================
// Gestisce click sulle stelle per aggiornare il rating del marker
export async function handleRatingClick(e, map, folders) {
  if (!e.target.classList.contains('star')) return false; // ignora click non rilevanti
  const markerId = e.target.closest('.folder-rating').dataset.id; // trova id marker
  const rating = parseInt(e.target.dataset.value); // prende il valore della stella cliccata
  try { 
    await updateMarkerRating(markerId, rating); // chiama backend per aggiornare rating
  } catch(err){ 
    console.error(err); 
    alert("Errore aggiornamento rating"); 
  }
  await loadMarkers(map, folders); // ricarica marker per aggiornare UI
  return true;
}

// ============================
// DELETE MARKER
// ============================
// Gestisce click sul bottone per eliminare un marker
export async function handleDeleteMarkerClick(e, map, folders) {
  if (!e.target.classList.contains('delete-marker-btn')) return false;
  const markerId = e.target.dataset.id;
  if (!confirm("Eliminare questo marker?")) return true; // conferma con l'utente
  try {
    await fetch(`/api/markers/${markerId}`, { method:'DELETE' }); // chiamata al backend per cancellare
    await loadMarkers(map, folders); // aggiorna marker sulla mappa
  } catch(err) {
    console.error(err);
    alert("Errore eliminando il marker");
  }
  return true;
}

// ============================
// ADD TO FOLDER POPUP
// ============================
// Gestisce click sul popup per aggiungere un marker a una cartella
export async function handlePopupFolderClick(e, map, folders) {
  // Se clic sul bottone "aggiungi a cartella"
  if (e.target.classList.contains('add-to-folder-btn')) {
    const popupContent = e.target.closest('.leaflet-popup-content');
    const folderList = popupContent.querySelector('.folder-selection');
    // crea dropdown con tutte le cartelle
    folderList.innerHTML = folders.map(f => 
      `<div class="folder-select-item" data-folder-id="${f.id}" 
        style="padding:3px 6px; margin:2px 0; cursor:pointer; border-radius:4px; background:${f.color}; color:white;">
        ${f.name}
      </div>`).join('');
    folderList.style.display = folderList.style.display==='none'?'block':'none';
    return true;
  }

  // Se clic su una cartella nel popup
  if (e.target.classList.contains('folder-select-item')) {
    const popupContent = e.target.closest('.leaflet-popup-content');
    const markerBtn = popupContent.querySelector('.add-to-folder-btn');
    const markerId = markerBtn.dataset.id;
    const folderId = e.target.dataset.folderId;
    await assignMarkerToFolder(markerId, folderId, map, folders); // assegna marker alla cartella
    const popup = e.target.closest('.leaflet-popup');
    if(popup) map.closePopup(); // chiudi popup
    return true;
  }

  return false; // nessuna azione rilevante
}

// ============================
// ASSEGNA MARKER A CARTELLA
// ============================
// Funzione interna per fare PATCH al backend e aggiornare marker
async function assignMarkerToFolder(markerId, folderId, map, folders) {
  try {
    const res = await fetch(`/api/markers/${markerId}/folder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId: folderId !== null ? Number(folderId) : null })
    });
    if (!res.ok) throw new Error(await res.text());
    await loadFolders(); // ricarica folders aggiornati
    await loadMarkers(map, folders); // ricarica marker per aggiornare UI
  } catch(err) {
    console.error(err);
    alert("Errore assegnando marker alla cartella");
  }
}