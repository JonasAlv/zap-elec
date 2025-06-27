import { app, BrowserWindow } from 'electron';
import { createTray } from './tray';
import { createMainWindow } from './window';

let mainWindow: BrowserWindow | null = null;

async function initializeApp() {
  mainWindow = await createMainWindow();
  createTray(mainWindow);
}

function setupLifecycle() {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      initializeApp();
    }
  });
}

app.whenReady().then(async () => {
  await initializeApp();
  setupLifecycle();
});

