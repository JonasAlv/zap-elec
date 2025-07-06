import { BrowserWindow, shell, nativeImage, NativeImage, app } from 'electron';
import path from 'path';
import { URL } from 'url';

const userAgent =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';

app.commandLine.appendSwitch('js-flags', '--max-old-space-size=128');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('enable-gpu');
app.commandLine.appendSwitch('disk-cache-size', '104857600');

function createBrowserWindowIcon(): NativeImage {
  const basePath = app.isPackaged ? process.resourcesPath : app.getAppPath();
  const iconPath = path.join(basePath, 'assets', 'icons', 'icon.png');
  return nativeImage.createFromPath(iconPath);
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

  const icon = createBrowserWindowIcon();

  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    icon,
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

  await window.loadURL('https://web.whatsapp.com/', { userAgent });

  setupWebSecurity(window);
  setupExternalNavigation(window);

  return window;
}
