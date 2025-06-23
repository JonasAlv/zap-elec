import { app, BrowserWindow, shell, nativeImage } from 'electron';
import * as path from 'path';
import { URL } from 'url';
import { createTray } from './tray';

//app.disableHardwareAcceleration();
// app.commandLine.appendSwitch('enable-low-end-device-mode');

app.commandLine.appendSwitch('gtk-version', '3');
//app.commandLine.appendSwitch('disable-gpu');
//app.commandLine.appendSwitch('disable-software-rasterizer');

async function createMainWindow(): Promise<BrowserWindow> {
  const basePath = app.isPackaged
    ? process.resourcesPath
    : path.resolve(__dirname, '../../');

  const iconPath = path.join(basePath, 'assets/icons/icon.png');

  const icon = nativeImage.createFromPath(iconPath);

  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    icon,
    show: true,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      enableWebSQL: false,
      spellcheck: false,
    },
  });

  const userAgent =
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:139.0) Gecko/20100101 Firefox/139.0';

  await window.loadURL('https://web.whatsapp.com/', { userAgent });
  return window;
}

function setupWebSecurity(window: BrowserWindow) {
  const locale = app.getLocale();
  window.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['Accept-Language'] = locale;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });
}

function setupExternalNavigation(window: BrowserWindow) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    const current = new URL(window.webContents.getURL()).origin;
    const target = new URL(url).origin;
    if (current !== target) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

function attachTrayBehavior(window: BrowserWindow, tray: Electron.Tray) {
  window.on('show', () => tray.setToolTip('Visible'));
  window.on('hide', () => tray.setToolTip('Hidden'));
}

async function initializeApp() {
  const mainWindow = await createMainWindow();
  setupWebSecurity(mainWindow);
  setupExternalNavigation(mainWindow);

  const tray = createTray(mainWindow);
  attachTrayBehavior(mainWindow, tray);
}

function setupLifecycle() {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) initializeApp();
  });
}

app.whenReady().then(initializeApp);
setupLifecycle();
