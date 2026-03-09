import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import markersRoutes from './routes/markers.js';
import countriesRoutes from './routes/countries.js';
import foldersRoutes from './routes/folders.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Abilita CORS per tutte le origini
app.use(cors());

// Parse JSON body
app.use(express.json());

// Internal API
app.use('/api/markers', markersRoutes);
app.use('/api/countries', countriesRoutes);
app.use('/api/folders', foldersRoutes);

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../frontend/public')));

// Fallback per SPA: tutte le altre route puntano a index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/public/index.html'));
});

// Avvio server
app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});