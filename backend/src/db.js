import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../../mapapp.sqlite");
const dbExists = fs.existsSync(dbPath);

const db = new Database(dbPath);

// ATTIVA FOREIGN KEY
db.pragma('foreign_keys = ON');

// ===============================
// TABELLE
// ===============================

// folders
db.prepare(`
CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL
)
`).run();

// countries
db.prepare(`
CREATE TABLE IF NOT EXISTS countries (
  gid INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  geom TEXT NOT NULL,
  lon_min REAL,
  lon_max REAL,
  lat_min REAL,
  lat_max REAL
)
`).run();

// markers
db.prepare(`
CREATE TABLE IF NOT EXISTS markers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  lon REAL NOT NULL,
  lat REAL NOT NULL,
  country_id INTEGER,
  folder_id INTEGER,
  rating INTEGER DEFAULT 0,
  FOREIGN KEY(country_id) REFERENCES countries(gid),
  FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE SET NULL)
`).run();

// ===============================
// DATI DI ESEMPIO
// ===============================
if (!dbExists) {
  // una cartella di esempio
  const folderId = db.prepare(`
    INSERT INTO folders (name, color) VALUES (?, ?)
  `).run("Luoghi preferiti", "#ff0000").lastInsertRowid;

  // un paese di esempio
  db.prepare(`
    INSERT INTO countries (gid, name, geom, lon_min, lon_max, lat_min, lat_max)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    "Italia",
    JSON.stringify({ type: "Polygon", coordinates: [[[6.6,36.6],[18.5,36.6],[18.5,47.1],[6.6,47.1],[6.6,36.6]]] }),
    6.6, 18.5, 36.6, 47.1
  );

  // un marker di esempio
  db.prepare(`
    INSERT INTO markers (name, description, lon, lat, country_id, folder_id, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run("Punto di esempio", "Marker di prova", 12.5, 42.0, 1, folderId, 3);

  console.log("Database vuoto: dati di esempio inseriti ✅");
}

export default db;