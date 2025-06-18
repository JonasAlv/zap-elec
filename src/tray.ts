import { Tray, Menu, app, BrowserWindow } from 'electron';
import * as path from 'path';

let tray: Tray | null = null;

function showWindow(window: BrowserWindow): void {
  if (!window) {
    throw new Error('[window] is required to [showWindow]');
  }

  if (!window.isVisible()) {
    window.show();
  }
}

function hideWindow(window: BrowserWindow): void {
  if (!window) {
    throw new Error('[window] is required to [hideWindow]');
  }

  if (window.isVisible()) {
    window.hide();
  }
}

function quitApp(window: BrowserWindow): void {
  window.removeAllListeners();
  
  if (tray) {
    tray.destroy();
    tray = null;
  }
  app.quit();
}

export function createTray(mainWindow: BrowserWindow): Tray {
  if (!mainWindow) {
    throw new Error('[mainWindow] is required to [createTray]');
  }

  const iconPath = path.join(__dirname, '..', 'assets/icons', 'icon.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => showWindow(mainWindow) },
    { label: 'Hide', click: () => hideWindow(mainWindow) },
    { label: 'Quit', click: () => quitApp(mainWindow) },
  ]);

  tray.setToolTip('zap-elec');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => showWindow(mainWindow));

  return tray;
}