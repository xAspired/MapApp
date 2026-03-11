const express = require('express');
const {
  getMarkers,
  addMarker,
  deleteMarker,
  updateMarkerRating,
  updateMarkerFolder
} = require('../controllers/markers.cjs');

const router = express.Router();

// GET tutti i marker
router.get('/', async (req, res) => {
  console.log('GET /api/markers RICEVUTA');
  await getMarkers(req, res);
});

// PATCH aggiorna folder marker
router.patch('/:id/folder', async (req, res) => {
  console.log(`PATCH /api/markers/${req.params.id}/folder RICEVUTA`, req.body);
  await updateMarkerFolder(req, res);
});

// POST nuovo marker
router.post('/', async (req, res) => {
  console.log('POST /api/markers RICEVUTA', req.body);
  await addMarker(req, res);
});

// PATCH aggiorna rating marker
router.patch('/:id/rating', async (req, res) => {
  console.log(`PATCH /api/markers/${req.params.id}/rating RICEVUTA`, req.body);
  await updateMarkerRating(req, res);
});

// DELETE marker
router.delete('/:id', async (req, res) => {
  console.log(`DELETE /api/markers/${req.params.id} RICEVUTA`);
  await deleteMarker(req, res);
});

module.exports = router;