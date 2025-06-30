import { Tray, Menu, app, BrowserWindow, nativeImage } from 'electron';
import path from 'path';

export function createTray(window: BrowserWindow): Tray {
  const basePath = app.isPackaged ? process.resourcesPath : app.getAppPath();
  const iconPath = path.join(basePath, 'assets/icons/tray_64x64.png');
  const trayIcon = nativeImage.createFromPath(iconPath);
  const tray = new Tray(trayIcon);

  let isThrottled = false;

  function setThrottling(throttle: boolean) {
    if (isThrottled !== throttle) {
      window.webContents.setBackgroundThrottling(throttle);
      isThrottled = throttle;
    }
  }

  function showWindow() {
    setThrottling(false);
    window.show();
    window.focus();
  }

  function hideWindow() {
    setThrottling(true);
    window.hide();
  }

  function toggleWindow() {
    if (window.isVisible()) {
      hideWindow();
    } else {
      showWindow();
    }
    updateContextMenu();
  }

  function getToggleLabel() {
    return window.isVisible() ? 'Hide' : 'Show';
  }

  const toggleMenuItem = {
    label: getToggleLabel(),
    click: toggleWindow,
  };

  const quitMenuItem = {
    label: 'Quit',
    click: () => {
      tray.destroy();
      app.quit();
    },
  };

  let contextMenu = Menu.buildFromTemplate([toggleMenuItem, quitMenuItem]);

  function updateContextMenu() {
    toggleMenuItem.label = getToggleLabel();
    contextMenu = Menu.buildFromTemplate([toggleMenuItem, quitMenuItem]);
    tray.setContextMenu(contextMenu);
  }

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    toggleWindow();
  });

  window.on('show', updateContextMenu);
  window.on('hide', updateContextMenu);

  window.on('close', () => {
    tray.destroy();
  });

  app.on('before-quit', () => {
    tray.destroy();
  });

  return tray;
}
