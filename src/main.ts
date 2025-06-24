import { app, BrowserWindow, shell, nativeImage, NativeImage } from 'electron';
import path from 'path';
import fs from 'fs';
import { URL } from 'url';
import { createTray } from './tray';

// Chromium performance flags
app.commandLine.appendSwitch('enable-gpu');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('gtk-version', '3'); // Fix Gnome GTK3/4 conflict
app.commandLine.appendSwitch('disk-cache-size', '104857600'); // 100MB cache

const userAgent =
  'Mozilla/5.0 (X11; Linux x86_64; rv:139.0) Gecko/20100101 Firefox/139.0';

async function createMainWindow(): Promise<BrowserWindow> {
  const basePath = app.isPackaged ? process.resourcesPath : app.getAppPath();
  const iconPath = path.join(basePath, 'assets/icons/icon.png');

  let icon: NativeImage | undefined;
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      console.warn(`Icon at ${iconPath} is empty.`);
      icon = undefined;
    }
  } else {
    console.warn(`Icon not found at ${iconPath}`);
  }

  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    icon,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  await window.loadURL('https://web.whatsapp.com/', { userAgent });

  return window;
}

function setupWebSecurity(window: BrowserWindow) {
  const locale = app.getLocale();

  window.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['Accept-Language'] = locale;
    details.requestHeaders['User-Agent'] = userAgent;
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

async function initializeApp() {
  const mainWindow = await createMainWindow();
  setupWebSecurity(mainWindow);
  setupExternalNavigation(mainWindow);
  createTray(mainWindow);
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
