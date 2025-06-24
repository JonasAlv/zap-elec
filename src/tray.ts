import { Tray, Menu, app, BrowserWindow, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';

export function createTray(window: BrowserWindow): Tray {
  const basePath = app.isPackaged ? process.resourcesPath : app.getAppPath();
  const iconPath = path.join(basePath, 'assets/icons/32x32.png');

  if (!fs.existsSync(iconPath)) {
    console.warn(`Tray icon not found at ${iconPath}`);
  }

  const trayIcon = nativeImage.createFromPath(iconPath);
  const tray = new Tray(trayIcon);

  let isThrottled = false;
  function setThrottling(throttle: boolean) {
    if (isThrottled !== throttle) {
      window.webContents.setBackgroundThrottling(throttle);
      isThrottled = throttle;
    }
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        setThrottling(false);
        window.show();
      },
    },
    {
      label: 'Hide',
      click: () => {
        setThrottling(true);
        window.hide();
      },
    },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ]);
  tray.setContextMenu(contextMenu);

  tray.setToolTip('App is running');

  tray.on('click', () => {
    setThrottling(false);
    window.show();
  });

  window.on('hide', () => {
    tray.setToolTip('Hidden');
  });

  window.on('show', () => {
    tray.setToolTip('App is running');
  });

  window.on('close', () => {
    tray.destroy();
  });

  return tray;
}
