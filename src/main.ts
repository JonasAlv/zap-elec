import { app, BrowserWindow, Tray } from 'electron';
import { createTray } from './tray';
import { createMainWindow } from './window';

app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=128');
app.commandLine.appendSwitch('disk-cache-size', '104857600');

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const instanceLock = app.requestSingleInstanceLock();

if (!instanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    await initializeApp();
    setupLifecycle();
  });
}

async function initializeApp() {
  if (process.platform === 'linux') {
    (app as any).setDesktopName('whatsapp.desktop');
  }

  mainWindow = await createMainWindow();
  
  if (!tray) {
    tray = createTray(mainWindow);
  }
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