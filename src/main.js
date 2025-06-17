const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const createTray = require('./tray');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({    
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
  mainWindow.loadURL('https://web.whatsapp.com/', { userAgent });
  mainWindow.setMenuBarVisibility(false);


  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentUrl = mainWindow.webContents.getURL();
    if (!url.startsWith(currentUrl)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  createTray(mainWindow);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Do not quit on close (keeps tray alive)
  if (process.platform !== 'darwin') {}
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
