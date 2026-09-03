import { BrowserWindow, shell, nativeImage, NativeImage, app } from 'electron';
import path from 'path';
import { URL } from 'url';

const userAgent = 'Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0';

let cachedIcon: NativeImage | null = null;

let isQuitting = false;

app.on('before-quit', () => {
  isQuitting = true;
});

function getBrowserWindowIcon(): NativeImage {
  if (cachedIcon) return cachedIcon;

  const basePath = app.isPackaged ? process.resourcesPath : app.getAppPath();
  const iconPath = path.join(basePath, 'assets', 'icons', 'icon.png');
  cachedIcon = nativeImage.createFromPath(iconPath);
  return cachedIcon;
}

function setupWebSecurity(window: BrowserWindow) {
  window.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
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
    const currentOrigin = new URL(window.webContents.getURL()).origin;
    const targetOrigin = new URL(url).origin;

    if (currentOrigin !== targetOrigin) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

export async function createMainWindow(): Promise<BrowserWindow> {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: getBrowserWindowIcon(),
    show: false, 
    backgroundColor: '#ffffff',
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  window.setMenu(null);

  window.once('ready-to-show', () => {
    window.show();
  });

  window.on('close', (event) => {

    if (!isQuitting) {
      event.preventDefault(); 
      window.hide();          
    }
    return false;
  });

  setupWebSecurity(window);
  setupExternalNavigation(window);

  await window.loadURL('https://web.whatsapp.com/', { userAgent });

  return window;
}