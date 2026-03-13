// ======================================================
// FOLDERS.JS
// Gestione cartelle tramite backend API e UI
// ======================================================

// Stato condiviso delle cartelle in memoria
export let folders = [];

// ======================================================
// CARICAMENTO CARTELLE DAL BACKEND
// ======================================================
export async function loadFolders() {
  try {
    const res = await fetch('/api/folders'); // GET API folders
    if (!res.ok) throw new Error("Errore fetch folders");
    const data = await res.json();

    folders.length = 0; // reset array mantenendo riferimento
    data.forEach(f => {
      folders.push({
        ...f,
        id: Number(f.id), // assicura che id sia numero
        markers: [] // inizializza array marker per ogni cartella
      });
    });
  } catch (err) {
    console.error("Errore caricando cartelle:", err);
  }
}

// ======================================================
// CREA CARTELLA (backend)
// ======================================================
export async function createFolder(name, color) {
  try {
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    });
    if (!res.ok) throw new Error(await res.text());
    const folder = await res.json();

    folders.push({
      ...folder,
      id: Number(folder.id),
      markers: []
    });

    return folder;
  } catch (err) {
    console.error("Errore creando cartella:", err);
    alert("Errore creando la cartella");
    throw err;
  }
}

// ======================================================
// ELIMINA CARTELLA
// ======================================================
export async function deleteFolder(id) {
  try {
    const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());

    const index = folders.findIndex(f => f.id === Number(id));
    if (index !== -1) folders.splice(index, 1);
  } catch (err) {
    console.error("Errore eliminando cartella:", err);
    alert("Errore eliminando la cartella");
  }
}

// ======================================================
// AGGIORNA CARTELLA
// ======================================================
export async function updateFolder(id, name, color) {
  try {
    const res = await fetch(`/api/folders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    });
    if (!res.ok) throw new Error(await res.text());

    const folder = folders.find(f => f.id === Number(id));
    if (folder) {
      folder.name = name;
      folder.color = color;
    }
  } catch (err) {
    console.error("Errore aggiornando cartella:", err);
    alert("Errore salvando la cartella");
  }
}

// ======================================================
// TROVA CARTELLA PER ID
// ======================================================
export function getFolderById(id) {
  return folders.find(f => f.id === Number(id));
}

// ======================================================
// RENDER UI CARTELLE
// ======================================================
export function renderFolders() {
  const panel = document.getElementById('folders-panel');
  if (!panel) return;
  panel.innerHTML = folders.length === 0 ? '<small>Nessuna cartella</small>' : '';

  folders.forEach(f => {
    const div = document.createElement('div');
    div.className = 'folder-row';
    div.innerHTML = `
      <div style="width:12px;height:12px;border-radius:50%;background:${f.color};"></div>
      <input type="text" value="${f.name}" data-id="${f.id}" class="folder-name">
      <input type="color" value="${f.color}" data-id="${f.id}" class="folder-color">
      <button data-id="${f.id}" class="delete-folder">✖</button>
    `;
    panel.appendChild(div);
  });
}

// ======================================================
// MODAL CREA CARTELLA
// ======================================================
export function openCreateFolderModal(map, loadMarkersFn) {
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
      await createFolder(name, color);
      await loadFolders();
      renderFolders();
      await loadMarkersFn(map, folders);
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Errore creando cartella");
    }
  };

  saveBtn.addEventListener('click', saveHandler);
  cancelBtn.addEventListener('click', closeModal);
}

// ======================================================
// INIZIALIZZA INPUT DINAMICI CARTELLE
// ======================================================
export function initFolderInputs(map, loadMarkersFn) {
  document.addEventListener('input', async (e) => {
    if (!e.target.classList.contains('folder-color') && !e.target.classList.contains('folder-name')) return;

    const id = e.target.dataset.id;
    const folder = folders.find(f => f.id == id);
    if (!folder) return;

    if (e.target.classList.contains('folder-color')) folder.color = e.target.value;
    if (e.target.classList.contains('folder-name')) folder.name = e.target.value;

    try {
      await updateFolder(id, folder.name, folder.color);
      await loadMarkersFn(map, folders);
    } catch(err) {
      console.error("Errore aggiornando cartella:", err);
      alert("Errore salvando la cartella");
    }
  });
}