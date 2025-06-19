import { app, BrowserWindow, shell } from 'electron';
import * as path from 'path';
import { createTray } from './tray';
import { URL } from 'url';
import { setMainWindow, setTray } from './windowManager';


export function initializeMainWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '..', 'assets/icons', 'icon.png'),
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  setMainWindow(win);

  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

  win.loadURL('https://web.whatsapp.com/', { userAgent });
  win.setMenuBarVisibility(false);

  win.once('ready-to-show', () => {
    win.show();
  });

  const systemLocale = app.getLocale();
  win.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['Accept-Language'] = systemLocale;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    const currentOrigin = new URL(win.webContents.getURL()).origin;
    const targetOrigin = new URL(url).origin;

    if (currentOrigin !== targetOrigin) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  const tray = createTray(win);
  setTray(tray);

  win.on('show', () => tray.setToolTip('Visible'));
  win.on('hide', () => tray.setToolTip('Hidden'));
}
