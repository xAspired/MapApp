const { app, BrowserWindow } = require("electron");
const path = require("path");

async function createWindow() {
  // Avvia il server dinamicamente con percorso assoluto
  const serverPath = path.join(__dirname, "../backend/src/server.js");
  await import(serverPath);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Carica l'app dal server locale
  win.loadURL("http://localhost:3000");
}

// Crea finestra all'avvio
app.whenReady().then(createWindow);

// Chiudi app quando tutte le finestre sono chiuse
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Riattiva finestra se su macOS e non ci sono finestre aperte
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});