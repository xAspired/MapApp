import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import markersRoutes from './routes/markers.cjs';
import countriesRoutes from './routes/countries.cjs';
import foldersRoutes from './routes/folders.cjs';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendPath = path.join(__dirname, "..", "..", "frontend", "public");

// middleware
app.use(cors());
app.use(express.json());

// API
app.use('/api/markers', markersRoutes);
app.use('/api/countries', countriesRoutes);
app.use('/api/folders', foldersRoutes);

// static frontend
app.use(express.static(frontendPath));

// fallback SPA
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// start server
app.listen(3000, "127.0.0.1", () => {
  console.log("Server listening on http://localhost:3000");
});