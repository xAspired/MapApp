const fs = require("fs");
const path = require("path");
const db = require("../db.cjs");

function getCountries(req, res) {
  try {

    const file = path.join(__dirname, "../../data/countries.geo.json");
    const geojson = JSON.parse(fs.readFileSync(file, "utf8"));

    const { withMarkers } = req.query;

    if (withMarkers === "true") {

      const countriesWithMarkers = db.prepare(`
        SELECT DISTINCT country_id
        FROM markers
      `).all().map(r => r.country_id);

      geojson.features = geojson.features.filter(f =>
        countriesWithMarkers.includes(f.id)
      );

    }

    res.json(geojson);

  } catch (err) {
    console.error("ERRORE GET COUNTRIES:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getCountries };