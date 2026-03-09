// folders.js (solo frontend, senza backend)
export let folders = [];

// ===============================
// LOAD / SAVE LOCAL
// ===============================
export function loadFolders() {
  const saved = localStorage.getItem("folders");
  if (saved) folders = JSON.parse(saved);
}

export function saveFolders() {
  localStorage.setItem("folders", JSON.stringify(folders));
}

// ===============================
// CREA CARTELLA (solo frontend)
// ===============================
export async function createFolder(name, color) {
  try {
    // genera id unico (timestamp + random)
    const id = Date.now() + Math.floor(Math.random() * 1000);

    const folder = { id, name, color, markers: [] };
    folders.push({ ...folder, id: Number(folder.id) });
    saveFolders();

    return folder;
  } catch (err) {
    console.error('Errore creando cartella:', err);
    alert("Errore creando la cartella");
    throw err;
  }
}

// ===============================
// TROVA CARTELLA
// ===============================
export function getFolderById(id) {
  return folders.find(f => f.id === Number(id));
}

// ===============================
// SPOSTA MARKER IN UNA CARTELLA
// ===============================
export async function moveMarkerToFolder(markerId, folderId) {
  try {
    // Aggiorna localmente il marker nella cartella
    const folder = folderId ? getFolderById(folderId) : null;

    // Qui dovresti aggiornare anche il backend se lo implementerai
    // Per ora solo ritorni un oggetto fittizio
    return { id: markerId, folderId: folder ? folder.id : null };
  } catch (err) {
    console.error('Errore spostando marker:', err);
    throw err;
  }
}
