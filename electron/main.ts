import { app, BrowserWindow, ipcMain, globalShortcut, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { mouse, Button } from '@nut-tree-fork/nut-js';

// Constants
const DOUBLE_CLICK_DELAY_MS = 10;
const RANDOM_MODE_DELAY_MULTIPLIER = 2;

interface ClickerSettings {
  minDelay: number;
  maxDelay: number;
  burstCount: number;
  clickKey: string;
  stopKey: string;
  button: 'left' | 'right' | 'middle';
  mode?: string;
}

let mainWindow: BrowserWindow | null = null;
let clickerInterval: NodeJS.Timeout | null = null;
let clickingActive = false;
let clickerMode = 'hold';
let settings: ClickerSettings = {
  minDelay: 1,
  maxDelay: 5,
  burstCount: 10,
  clickKey: 'h',
  stopKey: 'esc',
  button: 'left',
};

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 500,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    resizable: true,
    title: 'Auto Clicker',
  });

  mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));

  // Open DevTools in verbose mode
  if (process.env.AUTO_CLICKER_VERBOSE === '1') {
    mainWindow.webContents.openDevTools();
  }

  // Take screenshot after window loads (for testing)
  mainWindow.webContents.once('did-finish-load', () => {
    setTimeout(async () => {
      try {
        const image = await mainWindow!.webContents.capturePage();
        const screenshotPath = path.join(__dirname, '../../screenshot.png');
        fs.writeFileSync(screenshotPath, image.toPNG());
        console.log('Screenshot saved to:', screenshotPath);
      } catch (error) {
        console.error('Failed to capture screenshot:', error);
      }
    }, 1000);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopClicking();
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Utility functions
function getRandomDelay(): number {
  const min = settings.minDelay;
  const max = settings.maxDelay;
  return Math.random() * (max - min) + min;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function performClick(): Promise<void> {
  try {
    const buttonMap: Record<string, Button> = {
      left: Button.LEFT,
      right: Button.RIGHT,
      middle: Button.MIDDLE,
    };
    await mouse.click(buttonMap[settings.button] || Button.LEFT);
  } catch (error) {
    console.error('Error performing click:', error);
  }
}

async function performDoubleClick(): Promise<void> {
  try {
    const buttonMap: Record<string, Button> = {
      left: Button.LEFT,
      right: Button.RIGHT,
      middle: Button.MIDDLE,
    };
    const btn = buttonMap[settings.button] || Button.LEFT;
    await mouse.click(btn);
    await sleep(DOUBLE_CLICK_DELAY_MS);
    await mouse.click(btn);
  } catch (error) {
    console.error('Error performing double click:', error);
  }
}

function stopClicking(): void {
  if (clickerInterval) {
    clearTimeout(clickerInterval);
    clickerInterval = null;
  }
  clickingActive = false;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('clicker-status', { running: false });
  }
}

// Clicker mode implementations
function runToggleMode(): void {
  let clicking = false;

  const toggleClicks = () => {
    clicking = !clicking;
    console.log('Toggle mode:', clicking ? 'ON' : 'OFF');
  };

  globalShortcut.register(settings.clickKey, toggleClicks);

  const clickLoop = () => {
    if (clicking) {
      performClick();
    }
    clickerInterval = setTimeout(clickLoop, getRandomDelay());
  };
  clickLoop();
}

function runHoldMode(): void {
  let isHolding = false;

  globalShortcut.register(settings.clickKey, () => {
    // Toggle clicking on/off when key is pressed
    isHolding = !isHolding;
    console.log('Hold mode:', isHolding ? 'ON' : 'OFF');
  });

  const clickLoop = () => {
    if (isHolding) {
      performClick();
    }
    clickerInterval = setTimeout(clickLoop, getRandomDelay());
  };
  clickLoop();
}

function runDoubleMode(): void {
  let isDoubleClicking = false;

  globalShortcut.register(settings.clickKey, () => {
    // Toggle double-clicking on/off when key is pressed
    isDoubleClicking = !isDoubleClicking;
    console.log('Double mode:', isDoubleClicking ? 'ON' : 'OFF');
  });

  const clickLoop = () => {
    if (isDoubleClicking) {
      performDoubleClick();
    }
    clickerInterval = setTimeout(clickLoop, getRandomDelay());
  };
  clickLoop();
}

function runRandomMode(): void {
  let isRandomClicking = false;

  globalShortcut.register(settings.clickKey, () => {
    // Toggle random clicking on/off when key is pressed
    isRandomClicking = !isRandomClicking;
    console.log('Random mode:', isRandomClicking ? 'ON' : 'OFF');
  });

  const clickLoop = () => {
    if (isRandomClicking) {
      performClick();
    }
    // Extra randomness for random mode
    clickerInterval = setTimeout(clickLoop, getRandomDelay() * RANDOM_MODE_DELAY_MULTIPLIER);
  };
  clickLoop();
}

function runBurstMode(): void {
  globalShortcut.register(settings.clickKey, async () => {
    // Execute burst of clicks with random delays
    for (let i = 0; i < settings.burstCount; i++) {
      await performClick();
      if (i < settings.burstCount - 1) {
        await sleep(getRandomDelay());
      }
    }
  });
}

// IPC handlers
ipcMain.handle('start-clicker', async (event: IpcMainInvokeEvent, config: ClickerSettings) => {
  if (clickingActive && clickerInterval) {
    return { success: false, message: 'Clicker is already running' };
  }

  settings = { ...settings, ...config };
  clickerMode = config.mode || 'hold';
  clickingActive = true;

  // Unregister previous shortcuts
  globalShortcut.unregisterAll();

  // Register stop key
  globalShortcut.register(settings.stopKey, () => {
    stopClicking();
  });

  // Start appropriate mode
  try {
    switch (clickerMode) {
      case 'toggle':
        runToggleMode();
        break;
      case 'hold':
        runHoldMode();
        break;
      case 'double':
        runDoubleMode();
        break;
      case 'random':
        runRandomMode();
        break;
      case 'burst':
        runBurstMode();
        break;
      default:
        runHoldMode();
    }

    mainWindow!.webContents.send('clicker-status', { running: true });
    return { success: true, message: 'Clicker started successfully' };
  } catch (error) {
    console.error('Error starting clicker:', error);
    const err = error as Error;
    return { success: false, message: err.message };
  }
});

ipcMain.handle('stop-clicker', async () => {
  stopClicking();
  globalShortcut.unregisterAll();
  return { success: true, message: 'Clicker stopped' };
});

ipcMain.handle('get-status', async () => {
  return {
    running: clickingActive,
    mode: clickerMode,
    settings: settings,
  };
});
