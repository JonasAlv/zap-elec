"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const url_1 = require("url");
const tray_1 = require("./tray");
//app.disableHardwareAcceleration();
//app.commandLine.appendSwitch('enable-low-end-device-mode');
electron_1.app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform,WaylandVsync');
electron_1.app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform');
electron_1.app.commandLine.appendSwitch('gtk-version', '3');
electron_1.app.commandLine.appendSwitch('enable-gpu-rasterization');
electron_1.app.commandLine.appendSwitch('ignore-gpu-blacklist');
console.log(electron_1.app.getGPUFeatureStatus());
function createMainWindow() {
    return __awaiter(this, void 0, void 0, function* () {
        const window = new electron_1.BrowserWindow({
            width: 1200,
            height: 800,
            icon: path.join(__dirname, '..', 'assets/icons', 'icon.png'),
            show: true,
            autoHideMenuBar: true,
            backgroundColor: '#ffffff',
            webPreferences: {
                contextIsolation: true,
                sandbox: true,
                nodeIntegration: false,
                enableWebSQL: false,
                spellcheck: false,
            },
        });
        const userAgent = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:139.0) Gecko/20100101 Firefox/139.0';
        yield window.loadURL('https://web.whatsapp.com/', { userAgent });
        return window;
    });
}
function setupWebSecurity(window) {
    const locale = electron_1.app.getLocale();
    window.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['Accept-Language'] = locale;
        callback({ cancel: false, requestHeaders: details.requestHeaders });
    });
}
function setupExternalNavigation(window) {
    window.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
    window.webContents.on('will-navigate', (event, url) => {
        const current = new url_1.URL(window.webContents.getURL()).origin;
        const target = new url_1.URL(url).origin;
        if (current !== target) {
            event.preventDefault();
            electron_1.shell.openExternal(url);
        }
    });
}
function attachTrayBehavior(window, tray) {
    window.on('show', () => tray.setToolTip('Visible'));
    window.on('hide', () => tray.setToolTip('Hidden'));
}
function initializeApp() {
    return __awaiter(this, void 0, void 0, function* () {
        const mainWindow = yield createMainWindow();
        setupWebSecurity(mainWindow);
        setupExternalNavigation(mainWindow);
        const tray = (0, tray_1.createTray)(mainWindow);
        attachTrayBehavior(mainWindow, tray);
    });
}
function setupLifecycle() {
    electron_1.app.on('window-all-closed', () => {
        if (process.platform !== 'darwin')
            electron_1.app.quit();
    });
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            initializeApp();
    });
}
electron_1.app.whenReady()
    .then(initializeApp)
    .catch((err) => {
    console.error('Failed to initialize app:', err);
    electron_1.app.quit();
});
setupLifecycle();
