import { Tray, Menu, app, BrowserWindow, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';

export function createTray(window: BrowserWindow): Tray {
  const basePath = app.isPackaged ? process.resourcesPath : app.getAppPath();
  const iconFile = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
  let iconPath = path.join(basePath, 'assets', 'icons', iconFile);

  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(basePath, 'assets', 'icons', 'icon.png');
  }

  const trayImage = nativeImage.createFromPath(iconPath).resize({ width: 22, height: 22 });
  const tray = new Tray(trayImage);

  tray.setToolTip('zap-elec - WhatsApp Web');

  function isWindowShown(): boolean {
    return window.isVisible() && !window.isMinimized();
  }

  function toggleWindow() {
    if (isWindowShown()) {
      window.hide();
    } else {
      if (window.isMinimized()) window.restore();
      window.show();
      window.focus();
    }
  }

  function getToggleLabel() {
    return isWindowShown() ? 'Hide' : 'Show';
  }

  const toggleMenuItem = {
    label: getToggleLabel(),
    click: toggleWindow,
  };

  const quitMenuItem = {
    label: 'Quit',
    click: () => {
      app.quit();
    },
  };

  const contextMenu = Menu.buildFromTemplate([toggleMenuItem, quitMenuItem]);

  function updateContextMenu() {
    toggleMenuItem.label = getToggleLabel();
    const newMenu = Menu.buildFromTemplate([toggleMenuItem, quitMenuItem]);
    tray.setContextMenu(newMenu);
  }

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    toggleWindow();
  });

  window.on('show', updateContextMenu);
  window.on('hide', updateContextMenu);
  window.on('minimize', updateContextMenu);
  window.on('restore', updateContextMenu);

  app.on('before-quit', () => {
    tray.destroy();
  });

  return tray;
}