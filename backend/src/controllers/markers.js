import db from '../db.js';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

// ===============================
// trova il country di un punto
// ===============================
function findCountryId(lon, lat) {
  const countries = db.prepare(`SELECT gid, geom FROM countries`).all();

  const point = { type: "Point", coordinates: [lon, lat] };

  for (const c of countries) {
    const polygon = JSON.parse(c.geom);
    if (booleanPointInPolygon(point, polygon)) {
      return c.gid;
    }
  }
  return null;
}

// ===============================
// GET tutti i marker
// ===============================
export function getMarkers(req, res) {
  try {
    const rows = db.prepare(`
      SELECT id, name, description, lon, lat, rating, folder_id
      FROM markers
    `).all();

    const geojson = {
      type: "FeatureCollection",
      features: rows.map(r => ({
        type: "Feature",
        properties: {
          id: r.id,
          name: r.name,
          description: r.description,
          folderId: r.folder_id,
          rating: r.rating || 0
        },
        geometry: {
          type: "Point",
          coordinates: [r.lon, r.lat]
        }
      }))
    };

    res.json(geojson);

  } catch (err) {
    console.error('ERRORE GET MARKERS:', err);
    res.status(500).json({ error: err.message });
  }
}

// ===============================
// POST aggiungi marker
// ===============================
export function addMarker(req, res) {
  const { name, description, lon, lat, folderId } = req.body;

  try {
    const country_id = findCountryId(lon, lat);

    // verifica folderId nel DB
    let folder_id = null;
    if (folderId !== null && folderId !== undefined) {
      const folderExists = db.prepare('SELECT id FROM folders WHERE id = ?').get(Number(folderId));
      if (folderExists) folder_id = Number(folderId);
      else console.log(`FolderId ${folderId} non trovato, salvo marker senza cartella`);
    }

    const result = db.prepare(`
      INSERT INTO markers (name, description, lon, lat, country_id, folder_id, rating)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(name, description, lon, lat, country_id, folder_id);

    res.json({
      id: result.lastInsertRowid,
      name,
      description,
      folderId: folder_id,
      rating: 0
    });

  } catch (err) {
    console.error('ERRORE POST MARKER:', err);
    res.status(500).json({ error: err.message });
  }
}

// ===============================
// PATCH aggiorna rating
// ===============================
export function updateMarkerRating(req, res) {
  const markerId = req.params.id;
  const { rating } = req.body;

  if (rating === undefined || rating < 0 || rating > 5) {
    return res.status(400).json({ error: "Rating non valido (0-5)" });
  }

  try {
    const result = db.prepare(`
      UPDATE markers
      SET rating = ?
      WHERE id = ?
    `).run(rating, markerId);

    if (result.changes === 0) return res.status(404).json({ error: "Marker non trovato" });

    const marker = db.prepare(`
      SELECT id, name, description, rating
      FROM markers
      WHERE id = ?
    `).get(markerId);

    marker.folderId = null; // cartella sempre frontend
    res.json(marker);

  } catch (err) {
    console.error('ERRORE PATCH RATING:', err);
    res.status(500).json({ error: err.message });
  }
}

// ===============================
// DELETE marker
// ===============================
export function deleteMarker(req, res) {
  const markerId = req.params.id;

  try {
    const result = db.prepare(`DELETE FROM markers WHERE id = ?`).run(markerId);
    if (result.changes === 0) return res.status(404).json({ error: "Marker non trovato" });

    res.json({ success: true });

  } catch (err) {
    console.error('ERRORE DELETE MARKER:', err);
    res.status(500).json({ error: err.message });
  }
}

// ===============================
// PATCH aggiorna folder di un marker
// ===============================
export function updateMarkerFolder(req, res) {
  const markerId = req.params.id;
  let { folderId } = req.body;
  console.log("🛠 Backend riceve PATCH folder:", { markerId, folderId });

  if (folderId !== null && folderId !== undefined) folderId = Number(folderId);

  try {
    const result = db.prepare(`
      UPDATE markers
      SET folder_id = ?
      WHERE id = ?
    `).run(folderId || null, markerId);

    console.log("🛠 Backend UPDATE result:", result);

    if (result.changes === 0) return res.status(404).json({ error: "Marker non trovato" });

    const marker = db.prepare(`
      SELECT id, name, description, lon, lat, folder_id AS folderId, rating
      FROM markers
      WHERE id = ?
    `).get(markerId);

    console.log("🛠 Backend marker aggiornato:", marker);
    res.json(marker);

  } catch (err) {
    console.error('ERRORE PATCH folder marker:', err);
    res.status(500).json({ error: err.message });
  }
}