const express = require('express');
const {
  getFolders,
  createFolder,
  deleteFolder,
  moveMarkerToFolder,
  updateFolder
} = require('../controllers/folders.cjs');

const router = express.Router();

router.get('/', getFolders);
router.post('/', createFolder);
router.patch('/:id', updateFolder);
router.delete('/:id', deleteFolder);
router.patch('/marker/:markerId', moveMarkerToFolder);

module.exports = router;