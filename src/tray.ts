import { Tray, Menu, app, BrowserWindow, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';

const HOME_DIR = os.homedir();
const IGNORED_FOLDERS = new Set([
    'cursors', 'emotes', 'intl', 'places', 'mimetypes', 
    'devices', 'actions', 'categories', 'emblems', 'animations'
]);

function safeBashExec(command: string): string {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (e: any) {
    console.warn(`[Tray] Warning: Command failed "${command}".`, e.message || '');
    return '';
  }
}

function safeBashExecBuffer(command: string): Buffer {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e: any) {
    console.warn(`[Tray] Warning: Buffer command failed "${command}".`, e.message || '');
    return Buffer.alloc(0);
  }
}

function getLinuxIconTheme(): string {
  if (process.platform !== 'linux') return '';

  // KDE Detection
  if (process.env.XDG_CURRENT_DESKTOP?.toUpperCase().includes('KDE')) {
    const theme6 = safeBashExec('kreadconfig6 --group Icons --key Theme');
    if (theme6) return theme6;

    const theme5 = safeBashExec('kreadconfig5 --group Icons --key Theme');
    if (theme5) return theme5;

    try {
        const configPath = path.join(HOME_DIR, '.config', 'kdeglobals');
        if (fs.existsSync(configPath)) {
            const content = fs.readFileSync(configPath, 'utf8');
            const match = content.match(/Theme=(.+)/);
            if (match && match[1]) return match[1].trim();
        }
    } catch (e) {
        console.warn('[Tray] Failed to read kdeglobals file manually.');
    }
  }

  // GNOME Detection
  const gtkTheme = safeBashExec('gsettings get org.gnome.desktop.interface icon-theme').replace(/'/g, '');
  if (gtkTheme) return gtkTheme;

  if (process.env.GTK_THEME) return process.env.GTK_THEME;

  return 'hicolor'; 
}

function findFileInDir(dir: string, filename: string): string | null {
  if (!fs.existsSync(dir)) return null;

  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      if (file.isDirectory()) {
        if (IGNORED_FOLDERS.has(file.name)) continue;
        
        const fullPath = path.join(dir, file.name);
        const found = findFileInDir(fullPath, filename);
        if (found) return found;
      } else if (file.name === filename) {
        return path.join(dir, file.name);
      }
    }
  } catch (error: any) { 
    console.warn(`[Tray] Skipped scanning directory "${dir}": ${error.code || error.message}`);
  }
  return null;
}

function resolveSystemIconPath(theme: string): string | null {
  const searchRoots = [
    path.join(HOME_DIR, '.icons'),
    path.join(HOME_DIR, '.local/share/icons'),
    '/usr/share/icons',
    '/usr/local/share/icons'
  ];

  const targetFiles = [
    'whatsapp-tray.png',
    'whatsapp-tray.svg', 
    'whatsapp-panel.png',
    'whatsapp-panel.svg',
    'whatsapp.png',
    'whatsapp.svg'
  ];

  const searchTheme = (themeName: string): string | null => {
    for (const root of searchRoots) {
      const themePath = path.join(root, themeName);
      if (fs.existsSync(themePath)) {
        for (const target of targetFiles) {
          const found = findFileInDir(themePath, target);
          if (found) return found;
        }
      }
    }
    return null;
  };

  let found = searchTheme(theme);
  if (found) return found;

  const baseTheme = theme.replace(/[-_]?(Dark|Light|Solid)$/i, '');
  if (baseTheme !== theme && baseTheme.length > 0) {
      found = searchTheme(baseTheme);
      if (found) return found;
  }

  found = searchTheme('hicolor');
  if (found) return found;

  const pixmaps = '/usr/share/pixmaps';
  if (fs.existsSync(pixmaps)) {
    for (const target of targetFiles) {
      const p = path.join(pixmaps, target);
      if (fs.existsSync(p)) return p;
    }
  }

  return null;
}

export function createTray(window: BrowserWindow): Tray {
  const basePath = app.isPackaged ? process.resourcesPath : app.getAppPath();
  
  let iconPath = path.join(basePath, 'assets/icons/icon.png');
  let currentThemeName = '';

  const updateTrayIcon = () => {
    if (process.platform === 'linux') {
      const newTheme = getLinuxIconTheme();
      
      if (newTheme !== currentThemeName || currentThemeName === '') {
        currentThemeName = newTheme;
        const systemIcon = resolveSystemIconPath(newTheme);
        let newIconPath = iconPath;

        if (systemIcon) {
          newIconPath = systemIcon;
        }

        let trayImage = nativeImage.createFromPath(newIconPath);

        if (trayImage.isEmpty() && newIconPath.endsWith('.svg')) {
            const pngBuffer = safeBashExecBuffer(`rsvg-convert -w 22 -h 22 "${newIconPath}"`);
            if (pngBuffer.length > 0) {
                trayImage = nativeImage.createFromBuffer(pngBuffer);
            }
        }

        if (trayImage.isEmpty()) {
            console.warn(`[Tray] Icon empty for path "${newIconPath}". Falling back to default.`);
            trayImage = nativeImage.createFromPath(path.join(basePath, 'assets/icons/icon.png'));
        }
        
        const resized = trayImage.resize({ width: 22, height: 22 });
        tray.setImage(resized);
      }
    }
  };

  let initialImg = nativeImage.createFromPath(iconPath); 
  const tray = new Tray(initialImg.resize({ width: 22, height: 22 }));
  updateTrayIcon(); 

  if (process.platform === 'linux') {
    let configPath = '';
    if (process.env.XDG_CURRENT_DESKTOP?.toUpperCase().includes('KDE')) {
        configPath = path.join(HOME_DIR, '.config', 'kdeglobals');
    } else {
        configPath = path.join(HOME_DIR, '.config', 'gtk-3.0', 'settings.ini');
    }

    if (fs.existsSync(configPath)) {
        let debounceTimer: NodeJS.Timeout;
        
        fs.watchFile(configPath, { interval: 1000 }, (curr, prev) => {
            if (curr.mtime !== prev.mtime) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => updateTrayIcon(), 200);
            }
        });
        
        app.on('before-quit', () => {
            fs.unwatchFile(configPath);
            clearTimeout(debounceTimer);
        });
    }
  }

  function toggleWindow() {
    if (window.isVisible()) {
      window.hide();
    } else {
      window.show();
      window.focus();
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