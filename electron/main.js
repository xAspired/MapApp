const { app, BrowserWindow } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");
const http = require("http");

// Funzione per verificare se il server è pronto
function waitForServer(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http.get(url, () => resolve()).on("error", (err) => {
        if (Date.now() - start > timeout) return reject(err);
        setTimeout(check, 100);
      });
    };
    check();
  });
}

async function startServer() {
  try {
    const serverPath = path.join(__dirname, "../backend/src/server.js");
    // Usa import dinamico per ESM
    await import(pathToFileURL(serverPath).href);
    console.log("Server avviato");
  } catch (err) {
    console.error("Errore avviando il server:", err);
  }
}

async function createWindow() {
  await startServer();

  try {
    await waitForServer("http://localhost:3000");

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
    console.error("Server non raggiungibile:", err);
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});