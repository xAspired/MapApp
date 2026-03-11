const db = require('../db.cjs');

function getCountries(req, res) {
  try {
    const { withMarkers } = req.query;
    let rows;

    if (withMarkers === 'true') {
      rows = db.prepare(`
        SELECT DISTINCT c.gid, c.name, c.geom
        FROM countries c
        JOIN markers m
        ON m.country_id = c.gid
      `).all();
    } else {
      rows = db.prepare(`
        SELECT gid, name, geom
        FROM countries
      `).all();
    }

    const geojson = {
      type: "FeatureCollection",
      features: rows.map(r => ({
        type: "Feature",
        properties: {
          gid: r.gid,
          name: r.name
        },
        geometry: JSON.parse(r.geom)
      }))
    };

    res.json(geojson);

  } catch (err) {
    console.error("ERRORE GET COUNTRIES:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getCountries };