const { app, BrowserWindow } = require("electron");
const path = require("path");
const express = require("express");
const cors = require("cors");

// --- EXPRESS SERVER ---
async function startServer() {
  const server = express();

  // Middleware
  server.use(cors());
  server.use(express.json());

  // DB e rotte
  const db = require("../backend/src/db.cjs");
  const foldersRoutes = require("../backend/src/routes/folders.cjs");
  const countriesRoutes = require("../backend/src/routes/countries.cjs");
  const markersRoutes = require("../backend/src/routes/markers.cjs");

  server.use("/api/folders", foldersRoutes);
  server.use("/api/countries", countriesRoutes);
  server.use("/api/markers", markersRoutes);

  server.get('/api/search', async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) return res.json([]);

      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RichiMap/1.0 (youremail@example.com)',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error("Search error:", err);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Frontend static
  const frontendPath = path.join(__dirname, "../frontend/public");
  server.use(express.static(frontendPath));

  // SPA fallback
  server.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });

  // Avvio server
  server.listen(3000, () => {
    console.log("Server listening on http://localhost:3000");
  });
}

// --- CREAZIONE FINESTRA ---
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "../frontend/public/img/icons/icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadURL("http://localhost:3000");
}

// --- CICLO VITA APP ---
app.whenReady().then(() => {
  startServer();
  
  if (process.platform === "darwin") {
    app.dock.setIcon(path.join(__dirname, "../frontend/public/img/icons/icon.png"));
  }

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});