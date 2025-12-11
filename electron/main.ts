import { app, BrowserWindow, ipcMain, globalShortcut, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { mouse, Button, Point, screen as nutScreen, Region, keyboard } from '@nut-tree-fork/nut-js';

// Constants
const DOUBLE_CLICK_DELAY_MS = 10;
const RANDOM_MODE_DELAY_MULTIPLIER = 2;
const SEQUENCES_FILE = path.join(app.getPath('userData'), 'sequences.json');

// Smooth mouse movement constants
const MIN_MOVEMENT_STEPS = 10;
const MAX_MOVEMENT_STEPS = 50;
const PIXELS_PER_STEP = 20;
const MIN_SPEED_FACTOR = 0.3;
const SPEED_RANGE = 0.7;
const TWITCH_PROBABILITY = 0.7;
const TWITCH_CHECK_THRESHOLD = 0.9;
const TWITCH_MAGNITUDE = 6;
const BASE_MOVEMENT_DELAY_MS = 5;
const DEFAULT_RS3_CONFIG: RS3ActionBarConfig = {
  abilityKeys: ['1', '2', '3', '4', '5', '6'],
  minAbilityDelay: 800,
  maxAbilityDelay: 1400,
  shuffleRotation: true,
  pauseChance: 15,
  pauseMin: 1500,
  pauseMax: 3200,
};

interface RS3ActionBarConfig {
  abilityKeys: string[];
  minAbilityDelay: number;
  maxAbilityDelay: number;
  shuffleRotation: boolean;
  pauseChance: number;
  pauseMin: number;
  pauseMax: number;
}

interface ClickerSettings {
  minDelay: number;
  maxDelay: number;
  burstCount: number;
  clickKey: string;
  stopKey: string;
  button: 'left' | 'right' | 'middle';
  mode?: string;
  rs3Config?: RS3ActionBarConfig;
}

interface RecordedAction {
  type: 'click' | 'move';
  x: number;
  y: number;
  button?: string;
  timestamp: number;
  delay?: number;
}

interface RecordedSequence {
  name: string;
  actions: RecordedAction[];
  created: number;
}

interface ScreenRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ColorMatch {
  r: number;
  g: number;
  b: number;
  tolerance: number;
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
  rs3Config: undefined,
};
let rs3LoopController: { cancelled: boolean } | null = null;

// Recording state
let isRecording = false;
let recordedActions: RecordedAction[] = [];
let recordingStartTime = 0;
let isPlayingSequence = false;

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

function getRandomInRange(min: number, max: number): number {
  if (max <= min) {
    return min;
  }
  return Math.random() * (max - min) + min;
}

function shuffleArray<T>(items: T[]): T[] {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function resolveRs3Config(
  incoming?: RS3ActionBarConfig,
  fallback?: RS3ActionBarConfig
): RS3ActionBarConfig {
  const source = incoming ?? fallback ?? DEFAULT_RS3_CONFIG;
  const abilityKeys =
    source.abilityKeys && source.abilityKeys.length > 0
      ? source.abilityKeys
      : DEFAULT_RS3_CONFIG.abilityKeys;

  return {
    ...DEFAULT_RS3_CONFIG,
    ...source,
    abilityKeys,
  };
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

function runRs3ActionMode(): void {
  const rs3Config = mergeRs3Config(settings.rs3Config, settings.rs3Config);
  let rotationActive = false;

  if (rs3LoopController) {
    rs3LoopController.cancelled = true;
  }
  const controller = { cancelled: false };
  rs3LoopController = controller;

  globalShortcut.register(settings.clickKey, () => {
    rotationActive = !rotationActive;
    console.log('RS3 action mode:', rotationActive ? 'ON' : 'OFF');
  });

  const abilityLoop = async () => {
    try {
      while (clickingActive && !controller.cancelled) {
        if (!rotationActive) {
          await sleep(100);
          continue;
        }

        const abilities = rs3Config.shuffleRotation
          ? shuffleArray(rs3Config.abilityKeys)
          : rs3Config.abilityKeys;

        for (const ability of abilities) {
          if (!rotationActive || controller.cancelled || !clickingActive) {
            break;
          }

          await keyboard.type(ability);
          await sleep(getRandomInRange(rs3Config.minAbilityDelay, rs3Config.maxAbilityDelay));
        }

        if (
          rs3Config.pauseChance > 0 &&
          Math.random() * 100 < rs3Config.pauseChance &&
          !controller.cancelled
        ) {
          const pauseDuration = getRandomInRange(rs3Config.pauseMin, rs3Config.pauseMax);
          console.log(`RS3 micro break for ${pauseDuration.toFixed(0)}ms`);
          await sleep(pauseDuration);
        }
      }
    } catch (error) {
      console.error('RS3 action loop error:', error);
    }
  };

  void abilityLoop();
}

// Smooth mouse movement with human-like behavior
async function smoothMoveMouse(targetX: number, targetY: number): Promise<void> {
  try {
    const currentPos = await mouse.getPosition();
    const deltaX = targetX - currentPos.x;
    const deltaY = targetY - currentPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Skip movement if already at target (within 1 pixel tolerance)
    if (distance < 1) {
      return;
    }
    
    // Calculate number of steps based on distance (more steps for longer distances)
    const steps = Math.max(MIN_MOVEMENT_STEPS, Math.min(MAX_MOVEMENT_STEPS, Math.floor(distance / PIXELS_PER_STEP)));
    
    // Randomize movement characteristics
    const speedVariation = MIN_SPEED_FACTOR + Math.random() * SPEED_RANGE;
    const shouldAddTwitch = Math.random() > TWITCH_PROBABILITY;
    
    for (let i = 0; i <= steps; i++) {
      // Skip the initial step where progress=0 (would just set to current position)
      if (i === 0) continue;
      
      const progress = i / steps;
      
      // Ease-in-out curve for more natural movement
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      let x = currentPos.x + deltaX * eased;
      let y = currentPos.y + deltaY * eased;
      
      // Add micro-movements and occasional twitches (but not on first or last step)
      if (i > 1 && i < steps) {
        x += (Math.random() - 0.5) * 2; // ±1 pixel
        y += (Math.random() - 0.5) * 2;
        
        if (shouldAddTwitch && Math.random() > TWITCH_CHECK_THRESHOLD) {
          x += (Math.random() - 0.5) * TWITCH_MAGNITUDE;
          y += (Math.random() - 0.5) * TWITCH_MAGNITUDE;
        }
      } else if (i === steps) {
        // On the final step, go exactly to the target without random deviations
        x = targetX;
        y = targetY;
      }
      
      await mouse.setPosition(new Point(Math.round(x), Math.round(y)));
      
      // Variable delay between movements (but skip delay after the final movement)
      if (i < steps) {
        const delay = BASE_MOVEMENT_DELAY_MS * speedVariation * (1 + Math.random() * 0.5);
        await sleep(delay);
      }
    }
  } catch (error) {
    console.error('Error in smooth mouse movement:', error);
    throw error;
  }
}

// Recording functions
async function startRecording(): Promise<void> {
  if (isRecording) {
    return;
  }
  
  isRecording = true;
  recordedActions = [];
  recordingStartTime = Date.now();
  
  // Register a hotkey to record click positions (Ctrl+Shift+R)
  globalShortcut.register('CommandOrControl+Shift+R', async () => {
    if (!isRecording) return;
    
    try {
      const pos = await mouse.getPosition();
      const now = Date.now();
      const delay = recordedActions.length > 0 
        ? now - recordedActions[recordedActions.length - 1].timestamp 
        : 0;
      
      recordedActions.push({
        type: 'click',
        x: pos.x,
        y: pos.y,
        button: settings.button,
        timestamp: now,
        delay,
      });
      
      console.log(`Recorded click at (${pos.x}, ${pos.y})`);
    } catch (error) {
      console.error('Error recording click position:', error);
    }
  });
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('recording-status', { recording: true });
  }
  
  console.log('Recording started - Press Ctrl+Shift+R to record click positions');
}

function stopRecording(): RecordedSequence {
  isRecording = false;
  
  // Unregister the recording hotkey
  globalShortcut.unregister('CommandOrControl+Shift+R');
  
  const sequence: RecordedSequence = {
    name: `Recording ${new Date().toISOString()}`,
    actions: recordedActions,
    created: recordingStartTime,
  };
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('recording-status', { recording: false });
  }
  
  console.log(`Recording stopped. Captured ${recordedActions.length} actions`);
  return sequence;
}

async function playSequence(sequence: RecordedSequence): Promise<void> {
  if (isPlayingSequence) {
    throw new Error('Already playing a sequence');
  }
  
  isPlayingSequence = true;
  
  try {
    console.log(`Playing sequence: ${sequence.name} with ${sequence.actions.length} actions`);
    
    for (let i = 0; i < sequence.actions.length; i++) {
      if (!isPlayingSequence) break;
      
      const action = sequence.actions[i];
      
      // Apply delay from previous action
      if (action.delay && action.delay > 0) {
        await sleep(action.delay);
      }
      
      if (action.type === 'move') {
        await smoothMoveMouse(action.x, action.y);
      } else if (action.type === 'click') {
        await smoothMoveMouse(action.x, action.y);
        const buttonMap: Record<string, Button> = {
          left: Button.LEFT,
          right: Button.RIGHT,
          middle: Button.MIDDLE,
        };
        await mouse.click(buttonMap[action.button || 'left'] || Button.LEFT);
      }
    }
  } finally {
    isPlayingSequence = false;
  }
}

function saveSequence(sequence: RecordedSequence): void {
  let sequences: RecordedSequence[] = [];
  
  // Load existing sequences
  if (fs.existsSync(SEQUENCES_FILE)) {
    try {
      const data = fs.readFileSync(SEQUENCES_FILE, 'utf8');
      sequences = JSON.parse(data);
    } catch (error) {
      console.error('Error loading sequences:', error);
    }
  }
  
  // Add or update sequence
  const existingIndex = sequences.findIndex(s => s.name === sequence.name);
  if (existingIndex >= 0) {
    sequences[existingIndex] = sequence;
  } else {
    sequences.push(sequence);
  }
  
  // Save to file
  try {
    fs.writeFileSync(SEQUENCES_FILE, JSON.stringify(sequences, null, 2));
  } catch (error) {
    console.error('Error saving sequences:', error);
    throw error;
  }
}

function loadSequences(): RecordedSequence[] {
  if (!fs.existsSync(SEQUENCES_FILE)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(SEQUENCES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading sequences:', error);
    return [];
  }
}

function deleteSequence(name: string): void {
  let sequences = loadSequences();
  sequences = sequences.filter(s => s.name !== name);
  
  try {
    fs.writeFileSync(SEQUENCES_FILE, JSON.stringify(sequences, null, 2));
  } catch (error) {
    console.error('Error deleting sequence:', error);
    throw error;
  }
}

// Image and color recognition
async function captureRegion(region: ScreenRegion): Promise<Buffer> {
  try {
    const nutRegion = new Region(region.x, region.y, region.width, region.height);
    const img = await nutScreen.grabRegion(nutRegion);
    return img.data;
  } catch (error) {
    console.error('Error capturing region:', error);
    throw error;
  }
}

async function findColorInRegion(
  region: ScreenRegion,
  color: ColorMatch
): Promise<{ found: boolean; x?: number; y?: number }> {
  try {
    const nutRegion = new Region(region.x, region.y, region.width, region.height);
    const img = await nutScreen.grabRegion(nutRegion);
    
    const pixelData = img.data;
    const width = region.width;
    const height = region.height;
    
    // Search for color match (RGBA format)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const r = pixelData[index];
        const g = pixelData[index + 1];
        const b = pixelData[index + 2];
        
        // Check if color matches within tolerance
        if (
          Math.abs(r - color.r) <= color.tolerance &&
          Math.abs(g - color.g) <= color.tolerance &&
          Math.abs(b - color.b) <= color.tolerance
        ) {
          return {
            found: true,
            x: region.x + x,
            y: region.y + y,
          };
        }
      }
    }
    
    return { found: false };
  } catch (error) {
    console.error('Error finding color:', error);
    throw error;
  }
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

// Recording IPC handlers
ipcMain.handle('start-recording', async () => {
  try {
    await startRecording();
    return { success: true, message: 'Recording started' };
  } catch (error) {
    console.error('Error starting recording:', error);
    const err = error as Error;
    return { success: false, message: err.message };
  }
});

ipcMain.handle('stop-recording', async () => {
  try {
    const sequence = stopRecording();
    return { success: true, sequence, message: 'Recording stopped' };
  } catch (error) {
    console.error('Error stopping recording:', error);
    const err = error as Error;
    return { success: false, message: err.message };
  }
});

ipcMain.handle('play-sequence', async (event: IpcMainInvokeEvent, sequence: RecordedSequence) => {
  try {
    await playSequence(sequence);
    return { success: true, message: 'Sequence played successfully' };
  } catch (error) {
    console.error('Error playing sequence:', error);
    const err = error as Error;
    return { success: false, message: err.message };
  }
});

ipcMain.handle('save-sequence', async (event: IpcMainInvokeEvent, sequence: RecordedSequence) => {
  try {
    saveSequence(sequence);
    return { success: true, message: 'Sequence saved successfully' };
  } catch (error) {
    console.error('Error saving sequence:', error);
    const err = error as Error;
    return { success: false, message: err.message };
  }
});

ipcMain.handle('load-sequences', async () => {
  try {
    const sequences = loadSequences();
    return { success: true, sequences, message: 'Sequences loaded successfully' };
  } catch (error) {
    console.error('Error loading sequences:', error);
    const err = error as Error;
    return { success: false, message: err.message };
  }
});

ipcMain.handle('delete-sequence', async (event: IpcMainInvokeEvent, name: string) => {
  try {
    deleteSequence(name);
    return { success: true, message: 'Sequence deleted successfully' };
  } catch (error) {
    console.error('Error deleting sequence:', error);
    const err = error as Error;
    return { success: false, message: err.message };
  }
});

// Image and color recognition IPC handlers
ipcMain.handle('capture-region', async (event: IpcMainInvokeEvent, region: ScreenRegion) => {
  try {
    const data = await captureRegion(region);
    return { success: true, data, message: 'Region captured successfully' };
  } catch (error) {
    console.error('Error capturing region:', error);
    const err = error as Error;
    return { success: false, message: err.message };
  }
});

ipcMain.handle('find-color', async (event: IpcMainInvokeEvent, region: ScreenRegion, color: ColorMatch) => {
  try {
    const result = await findColorInRegion(region, color);
    return { success: true, ...result, message: result.found ? 'Color found' : 'Color not found' };
  } catch (error) {
    console.error('Error finding color:', error);
    const err = error as Error;
    return { success: false, found: false, message: err.message };
  }
});

ipcMain.handle('find-image', async (_event: IpcMainInvokeEvent, _region: ScreenRegion, _templatePath: string) => {
  try {
    // Basic implementation - would need opencv or similar for real template matching
    // For now, return a placeholder
    return { success: true, found: false, message: 'Image recognition not yet fully implemented' };
  } catch (error) {
    console.error('Error finding image:', error);
    const err = error as Error;
    return { success: false, found: false, message: err.message };
  }
});

// Smooth mouse movement IPC handler
ipcMain.handle('smooth-move-mouse', async (event: IpcMainInvokeEvent, x: number, y: number) => {
  try {
    await smoothMoveMouse(x, y);
    return { success: true, message: 'Mouse moved successfully' };
  } catch (error) {
    console.error('Error moving mouse:', error);
    const err = error as Error;
    return { success: false, message: err.message };
  }
});
