const { app, BrowserWindow } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");

async function createWindow() {
  try {
    const serverPath = path.join(__dirname, "../backend/src/server.js");
    await import(pathToFileURL(serverPath).href);

    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    win.loadURL("http://localhost:3000");
  } catch (err) {
    console.error("Errore avviando il server:", err);
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});