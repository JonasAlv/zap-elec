import { BrowserWindow, shell, nativeImage, app } from 'electron';
import path from 'path';
import { URL } from 'url';

const userAgent =
  'Mozilla/5.0 (X11; Linux x86_64; rv:139.0) Gecko/20100101 Firefox/139.0';

// for performance
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=128');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-accelerated-2d-canvas');
app.commandLine.appendSwitch('enable-gpu');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('disk-cache-size', '104857600');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');

export async function createMainWindow(): Promise<BrowserWindow> {
  const basePath = app.isPackaged ? process.resourcesPath : app.getAppPath();
  const iconPath = path.join(basePath, 'assets', 'icons', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath);

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
      backgroundThrottling: true,
    },
  });

  window.setMenu(null);

  window.once('ready-to-show', () => {
    window.show();
  });

  window.on('minimize', () => {
    window.webContents.setAudioMuted(true);
    window.webContents.setBackgroundThrottling(true);
  });

  window.on('restore', () => {
    window.webContents.setAudioMuted(false);
    window.webContents.setBackgroundThrottling(false);
  });

  await window.loadURL('https://web.whatsapp.com/', { userAgent });

  setupWebSecurity(window);
  setupExternalNavigation(window);

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
