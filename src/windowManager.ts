import { BrowserWindow, Tray } from 'electron';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

export function setMainWindow(win: BrowserWindow) {
  mainWindow = win;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function setTray(t: Tray) {
  tray = t;
}

export function getTray(): Tray | null {
  return tray;
}
