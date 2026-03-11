const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const { app } = require("electron");

// Percorso sicuro e persistente del DB
const dbPath = path.join(app.getPath("userData"), "mapapp.sqlite");
const dbExists = fs.existsSync(dbPath);

const db = new Database(dbPath);

// Attiva foreign key
db.pragma("foreign_keys = ON");

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
  const folderId = db.prepare(`
    INSERT INTO folders (name, color) VALUES (?, ?)
  `).run("Luoghi preferiti", "#ff0000").lastInsertRowid;

  db.prepare(`
    INSERT INTO countries (gid, name, geom, lon_min, lon_max, lat_min, lat_max)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    "Italia",
    JSON.stringify({ type: "Polygon", coordinates: [[[6.6,36.6],[18.5,36.6],[18.5,47.1],[6.6,47.1],[6.6,36.6]]] }),
    6.6, 18.5, 36.6, 47.1
  );

  db.prepare(`
    INSERT INTO markers (name, description, lon, lat, country_id, folder_id, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run("Punto di esempio", "Marker di prova", 12.5, 42.0, 1, folderId, 3);

  console.log("Database creato in:", dbPath);
}

module.exports = db;