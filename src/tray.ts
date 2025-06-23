import { Tray, Menu, app, BrowserWindow, nativeImage } from 'electron';
import * as path from 'path';

export function createTray(window: BrowserWindow): Tray {

  const basePath = app.isPackaged
    ? process.resourcesPath           
    : path.resolve(__dirname, '../../');  
  const iconPath = path.join(basePath, 'assets/icons/icon.png');

  const trayIcon = nativeImage.createFromPath(iconPath);

  const tray = new Tray(trayIcon);

  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show', click: () => window.show() },
    { label: 'Hide', click: () => window.hide() },
    { label: 'Quit', click: () => app.quit() }
  ]));

  tray.setToolTip('zap-elec');
  tray.on('click', () => window.show());

  return tray;
}
