import { Tray, Menu, app, BrowserWindow, nativeImage } from 'electron';
import path from 'path';

export function createTray(window: BrowserWindow): Tray {
  const basePath = app.isPackaged ? process.resourcesPath : app.getAppPath();
  
  let iconPath = path.join(basePath, 'assets/icons/icon.png');
  let trayImage = nativeImage.createFromPath(iconPath).resize({ width: 22, height: 22 });
  
  const tray = new Tray(trayImage);

  function toggleWindow() {
    if (window.isVisible()) {
      window.hide();
    } else {
      window.show();
      window.focus();
    }
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

  app.on('before-quit', () => {
    tray.destroy();
  });

  return tray;
}