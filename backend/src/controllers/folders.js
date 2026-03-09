// controllers/foldersController.js
import db from '../db.js'; // il tuo client sqlite

// ===============================
// GET TUTTE LE CARTELLE
// ===============================
export function getFolders(req, res) {
  try {
    const folders = db.prepare('SELECT * FROM folders').all();
    res.json(folders);
  } catch (err) {
    console.error("Errore caricando cartelle:", err);
    res.status(500).json({ error: 'Errore caricando cartelle' });
  }
}

// ===============================
// CREA CARTELLA
// ===============================
export function createFolder(req, res) {
  const { name, color } = req.body;
  if (!name || !color) return res.status(400).json({ error: 'Nome e colore richiesti' });

  try {
    const stmt = db.prepare('INSERT INTO folders (name, color) VALUES (?, ?)');
    const info = stmt.run(name, color);
    const folder = { id: info.lastInsertRowid, name, color };
    res.json(folder);
  } catch (err) {
    console.error("Errore creando cartella:", err);
    res.status(500).json({ error: 'Errore creando cartella' });
  }
}

// ===============================
// ELIMINA CARTELLA
// ===============================
export function deleteFolder(req, res) {
    const id = Number(req.params.id);
  
    try {
      // 1️⃣ Rimuovi associazione marker
      db.prepare('UPDATE markers SET folder_id = NULL WHERE folder_id = ?').run(id);
  
      // 2️⃣ Elimina la cartella
      const stmt = db.prepare('DELETE FROM folders WHERE id = ?');
      const info = stmt.run(id);
  
      if (info.changes === 0) return res.status(404).json({ error: 'Cartella non trovata' });
  
      res.json({ success: true });
    } catch (err) {
      console.error("Errore eliminando cartella:", err);
      res.status(500).json({ error: 'Errore eliminando cartella' });
    }
  }

// ===============================
// SPOSTA MARKER IN UNA CARTELLA
// ===============================
export function moveMarkerToFolder(req, res) {
    const markerId = Number(req.params.markerId);
    // folderId può essere null o stringa, gestisco anche ""
    const folderId = req.body.folderId ? Number(req.body.folderId) : null;
  
    if (isNaN(markerId)) return res.status(400).json({ error: 'MarkerId non valido' });
  
    try {
      // usa il nome corretto della colonna folder_id
      const stmt = db.prepare('UPDATE markers SET folder_id = ? WHERE id = ?');
      const info = stmt.run(folderId, markerId);
  
      if (info.changes === 0) return res.status(404).json({ error: 'Marker non trovato' });
  
      res.json({ markerId, folderId });
    } catch (err) {
      console.error("Errore spostando marker:", err);
      res.status(500).json({ error: 'Errore spostando marker' });
    }
  }

// PATCH aggiorna cartella (nome e/o colore)
export function updateFolder(req, res) {
    const id = Number(req.params.id);
    const { name, color } = req.body;
    if (!name && !color) return res.status(400).json({ error: "Nome o colore richiesti" });
  
    const stmt = db.prepare(`
      UPDATE folders
      SET name = COALESCE(?, name),
          color = COALESCE(?, color)
      WHERE id = ?
    `);
    const info = stmt.run(name, color, id);
  
    if (info.changes === 0) return res.status(404).json({ error: "Cartella non trovata" });
    const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
    res.json(folder);
  }