const { app, BrowserWindow } = require("electron");
const path = require("path");
const { fork } = require("child_process");
const http = require("http");

let serverProcess;

function startServer() {
  return new Promise((resolve, reject) => {

    const serverPath = app.isPackaged
      ? path.join(process.resourcesPath, "backend/src/server.js")
      : path.join(__dirname, "../backend/src/server.js");

    serverProcess = fork(serverPath, { stdio: "inherit" });

    serverProcess.on("error", reject);

    waitForServer(resolve);
  });
}

function waitForServer(resolve) {
  const tryConnect = () => {
    http
      .get("http://localhost:3000", () => {
        console.log("Server pronto");
        resolve();
      })
      .on("error", () => {
        setTimeout(tryConnect, 300);
      });
  };

  tryConnect();
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

app.whenReady().then(async () => {
  await startServer();
  createWindow();
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});