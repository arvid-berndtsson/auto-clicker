const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const { mouse, Button } = require('@nut-tree-fork/nut-js');

// Constants
const DOUBLE_CLICK_DELAY_MS = 10;
const RANDOM_MODE_DELAY_MULTIPLIER = 2;

let mainWindow;
let clickerInterval = null;
let clickingActive = false;
let clickerMode = 'hold';
let settings = {
  minDelay: 1,
  maxDelay: 5,
  burstCount: 10,
  clickKey: 'h',
  stopKey: 'esc',
  button: 'left'
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    resizable: true,
    title: 'Auto Clicker'
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Open DevTools in development
  // mainWindow.webContents.openDevTools();
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
function getRandomDelay() {
  const min = settings.minDelay;
  const max = settings.maxDelay;
  return Math.random() * (max - min) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function performClick() {
  try {
    const buttonMap = {
      'left': Button.LEFT,
      'right': Button.RIGHT,
      'middle': Button.MIDDLE
    };
    await mouse.click(buttonMap[settings.button] || Button.LEFT);
  } catch (error) {
    console.error('Error performing click:', error);
  }
}

async function performDoubleClick() {
  try {
    const buttonMap = {
      'left': Button.LEFT,
      'right': Button.RIGHT,
      'middle': Button.MIDDLE
    };
    const btn = buttonMap[settings.button] || Button.LEFT;
    await mouse.click(btn);
    await sleep(DOUBLE_CLICK_DELAY_MS);
    await mouse.click(btn);
  } catch (error) {
    console.error('Error performing double click:', error);
  }
}

function stopClicking() {
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
function runToggleMode() {
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

function runHoldMode() {
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

function runDoubleMode() {
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

function runRandomMode() {
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

function runBurstMode() {
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
ipcMain.handle('start-clicker', async (event, config) => {
  if (clickingActive && clickerInterval) {
    return { success: false, message: 'Clicker is already running' };
  }

  settings = { ...settings, ...config };
  clickerMode = config.mode;
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

    mainWindow.webContents.send('clicker-status', { running: true });
    return { success: true, message: 'Clicker started successfully' };
  } catch (error) {
    console.error('Error starting clicker:', error);
    return { success: false, message: error.message };
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
    settings: settings
  };
});
