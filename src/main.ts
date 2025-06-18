import { app, BrowserWindow } from 'electron';
import { initializeMainWindow } from './mainWindow';

//desativa renderização por gpu...
// ERROR:ui/gl/gl_surface_presentation_helper.cc:260
app.disableHardwareAcceleration();

function setupAppLifecycle() {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      initializeMainWindow();
    }
  });
}

app.whenReady().then(() => {
  initializeMainWindow();
  setupAppLifecycle();
});
