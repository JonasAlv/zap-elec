import { Tray, Menu, app, BrowserWindow, nativeImage } from 'electron';
import path from 'path';


export function createTray(window: BrowserWindow): Tray {
  const basePath = app.isPackaged ? process.resourcesPath : app.getAppPath();
  const iconPath = path.join(basePath, 'assets/icons/32x32.png');
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
        window.focus();
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
      click: () => {
        tray.destroy();
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    setThrottling(false);
    window.show();
    window.focus();
  });

  window.on('close', () => {
    tray.destroy();
  });

  return tray;
}
