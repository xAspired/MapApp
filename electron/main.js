const { app, BrowserWindow } = require("electron");
const path = require("path");
const { fork } = require("child_process");

let serverProcess;

function startServer() {
  try {
    // usa un path diverso se sei in dev o in build
    const serverPath = app.isPackaged
      ? path.join(process.resourcesPath, "backend/src/server.js") // build
      : path.join(__dirname, "../backend/src/server.js");       // dev

    serverProcess = fork(serverPath, { stdio: "inherit" });

    serverProcess.on("exit", (code, signal) => {
      console.log(`Server terminato con codice ${code}, signal ${signal}`);
    });
  } catch (err) {
    console.error("Errore avviando il server:", err);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadURL("http://localhost:3000");
}

app.whenReady().then(() => {
  startServer();
  createWindow();
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});