const { app, BrowserWindow } = require("electron");
const path = require("path");
const { fork } = require("child_process");
const http = require("http");

let serverProcess;

function startServer() {
  const serverPath = app.isPackaged
    ? path.join(app.getAppPath(), "backend", "src", "server.js")
    : path.join(__dirname, "..", "backend", "src", "server.js");

  console.log("Avvio server:", serverPath);

  serverProcess = fork(serverPath, { stdio: "inherit" });

  serverProcess.on("exit", (code, signal) => {
    console.log(`Server terminato con codice ${code}, signal ${signal}`);
  });
}

function waitForServer(retries = 50) {
  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get("http://localhost:3000", () => {
          console.log("Server pronto");
          resolve();
        })
        .on("error", () => {
          if (retries <= 0) {
            reject("Server non raggiungibile");
          } else {
            setTimeout(() => {
              retries--;
              check();
            }, 200);
          }
        });
    };

    check();
  });
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

  // utile per debug
  win.webContents.openDevTools();
}

app.whenReady().then(async () => {
  startServer();

  try {
    await waitForServer();
    createWindow();
  } catch (err) {
    console.error(err);
  }
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});