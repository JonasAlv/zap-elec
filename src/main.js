const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { URL } = require('url');
const createTray = require('./tray');

app.disableHardwareAcceleration();
app.isQuitting = false;

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '..', 'assets/icons', 'icon.png'),
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  const systemLocale = app.getLocale();

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['Accept-Language'] = systemLocale;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
  mainWindow.loadURL('https://web.whatsapp.com/', { userAgent });
  mainWindow.setMenuBarVisibility(false);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentOrigin = new URL(mainWindow.webContents.getURL()).origin;
    const targetOrigin = new URL(url).origin;

    if (currentOrigin !== targetOrigin) {
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

  tray = createTray(mainWindow);

  mainWindow.on('show', () => {
    tray.setToolTip('zap-elec - Window Visible');
  });

  mainWindow.on('hide', () => {
    tray.setToolTip('zap-elec - Window Hidden');
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
