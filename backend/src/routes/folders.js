// routes/folders.js
import express from 'express';
import { getFolders, createFolder, deleteFolder, moveMarkerToFolder, updateFolder } from '../controllers/folders.js';
const router = express.Router();

router.get('/', getFolders);
router.post('/', createFolder);
router.patch('/:id', updateFolder);
router.delete('/:id', deleteFolder);
router.patch('/marker/:markerId', moveMarkerToFolder);

export default router;