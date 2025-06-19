import { Tray, Menu, app, BrowserWindow } from 'electron';
import * as path from 'path';

export function createTray(window: BrowserWindow): Tray {
  const tray = new Tray(path.join(__dirname, '..', 'assets/icons', 'icon.png'));

  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show', click: () => window.show() },
    { label: 'Hide', click: () => window.hide() },
    {
      label: 'Quit',
      click: () => {
        window.removeAllListeners();
        tray.destroy();
        app.quit();
      },
    },
  ]));

  tray.setToolTip('zap-elec');
  tray.on('click', () => window.show());

  return tray;
}
