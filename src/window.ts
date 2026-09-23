import { BrowserWindow, shell, nativeImage, NativeImage, app, nativeTheme, screen } from 'electron';
import path from 'path';
import fs from 'fs';
import { URL } from 'url';

function getUserAgent(): string {
  if (process.platform === 'win32') {
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0';
  }
  return 'Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0';
}

const userAgent = getUserAgent();

let cachedIcon: NativeImage | null = null;
let isQuitting = false;

app.on('before-quit', () => {
  isQuitting = true;
});

function getBrowserWindowIcon(): NativeImage {
  if (cachedIcon) return cachedIcon;

  const basePath = app.isPackaged ? process.resourcesPath : app.getAppPath();
  const iconFile = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
  let iconPath = path.join(basePath, 'assets', 'icons', iconFile);

  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(basePath, 'assets', 'icons', 'icon.png');
  }

  cachedIcon = nativeImage.createFromPath(iconPath);
  return cachedIcon;
}

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized?: boolean;
}

function getWindowStateFilePath(): string {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState(): WindowState {
  const defaultState: WindowState = { width: 1200, height: 800 };
  try {
    const filePath = getWindowStateFilePath();
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (typeof data.width === 'number' && typeof data.height === 'number') {
        if (typeof data.x === 'number' && typeof data.y === 'number') {
          const visible = screen.getAllDisplays().some(display => {
            const { x, y, width, height } = display.bounds;
            return (
              data.x >= x &&
              data.x < x + width &&
              data.y >= y &&
              data.y < y + height
            );
          });
          if (visible) {
            return data;
          }
        }
        return { width: data.width, height: data.height, isMaximized: data.isMaximized };
      }
    }
  } catch {
    // Fall back to defaults on error
  }
  return defaultState;
}

function saveWindowState(window: BrowserWindow) {
  try {
    const isMaximized = window.isMaximized();
    if (isMaximized) {
      const existing = loadWindowState();
      fs.writeFileSync(getWindowStateFilePath(), JSON.stringify({ ...existing, isMaximized: true }));
      return;
    }

    const bounds = window.getBounds();
    const state: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized: false,
    };
    fs.writeFileSync(getWindowStateFilePath(), JSON.stringify(state));
  } catch {
    // Ignore write errors during shutdown
  }
}

function setupWebSecurity(window: BrowserWindow) {
  window.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = userAgent;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  // Enable notifications and microphone for WhatsApp voice messages
  window.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowedPermissions = ['notifications', 'media'];
    callback(allowedPermissions.includes(permission));
  });
}

function setupExternalNavigation(window: BrowserWindow) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    try {
      const currentUrl = window.webContents.getURL();
      if (!currentUrl) return;

      const currentOrigin = new URL(currentUrl).origin;
      const targetOrigin = new URL(url).origin;

      if (currentOrigin !== targetOrigin) {
        event.preventDefault();
        shell.openExternal(url);
      }
    } catch {
      // Safe fallback if URL parsing fails
    }
  });
}

export async function createMainWindow(): Promise<BrowserWindow> {
  const windowState = loadWindowState();

  const window = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    icon: getBrowserWindowIcon(),
    show: false,
    autoHideMenuBar: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#111b21' : '#ffffff',
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });

  window.setMenu(null);

  if (windowState.isMaximized) {
    window.maximize();
  }

  window.once('ready-to-show', () => {
    window.show();
  });

  let saveTimer: NodeJS.Timeout | null = null;
  const debouncedSave = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveWindowState(window), 500);
  };

  window.on('resize', debouncedSave);
  window.on('move', debouncedSave);

  window.on('close', (event) => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    saveWindowState(window);

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