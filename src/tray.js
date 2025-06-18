const { Tray, Menu, app } = require('electron');
const path = require('path');

let tray = null;

/**
 * @param {BrowserWindow} mainWindow - The main Electron window instance.
 * @returns {Tray} The tray instance.
 */
function createTray(mainWindow) {
  if (!mainWindow) {
    throw new Error('Main window is required to create tray');
  }

  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => mainWindow.show(),
    },
    {
      label: 'Hide',
      click: () => mainWindow.hide(),
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        if (tray) tray.destroy();  
        app.quit();
      },
    },
  ]);

  tray.setToolTip('zap-elec');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow.show();
  });

  return tray;
}

module.exports = createTray;
