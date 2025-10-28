import { app, BrowserWindow } from 'electron';
import { createTray } from './tray';
import { createMainWindow } from './window';

app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=128');
app.commandLine.appendSwitch('disk-cache-size', '104857600');

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

