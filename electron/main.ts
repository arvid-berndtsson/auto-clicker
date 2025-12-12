import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ClickerController } from './core/clickerController';
import { RecordingController } from './core/recordingController';
import { SequenceStore } from './core/sequenceStore';
import { captureRegion, findColorInRegion, findImageInRegion, ImageMatchOptions } from './core/vision';
import { smoothMoveMouse } from './core/mouseMovement';
import {
  ClickerSettings,
  ClickerStatus,
  RecordedSequence,
  ScreenRegion,
  ColorMatch,
} from './core/types';
import { LeagueHelper, LolWatcherConfig, LolWatcherStatus } from './core/leagueHelper';

let mainWindow: BrowserWindow | null = null;
let clickerController: ClickerController | null = null;
let recordingController: RecordingController | null = null;
let leagueHelper: LeagueHelper | null = null;

function getMainWindow(): BrowserWindow | null {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
}

function sendClickerStatus(status: ClickerStatus): void {
  getMainWindow()?.webContents.send('clicker-status', status);
}

function sendRecordingStatus(recording: boolean): void {
  getMainWindow()?.webContents.send('recording-status', { recording });
}

function sendLolWatcherStatus(status: LolWatcherStatus): void {
  getMainWindow()?.webContents.send('lol-watcher-status', status);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 500,
    resizable: true,
    title: 'Auto Clicker',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));

  if (process.env.AUTO_CLICKER_VERBOSE === '1') {
    mainWindow.webContents.openDevTools();
  }

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

async function setupControllers(): Promise<void> {
  const userDataPath = app.getPath('userData');
  const store = new SequenceStore(userDataPath);
  clickerController = new ClickerController(sendClickerStatus);
  recordingController = new RecordingController(store, sendRecordingStatus);
  leagueHelper = new LeagueHelper(sendLolWatcherStatus);
  sendLolWatcherStatus(leagueHelper.getStatus());
}

function ensureClickerController(): ClickerController {
  if (!clickerController) {
    throw new Error('Clicker controller is not initialized');
  }
  return clickerController;
}

function ensureRecordingController(): RecordingController {
  if (!recordingController) {
    throw new Error('Recording controller is not initialized');
  }
  return recordingController;
}

function ensureLeagueHelper(): LeagueHelper {
  if (!leagueHelper) {
    throw new Error('League helper is not initialized');
  }
  return leagueHelper;
}

function registerIpcHandlers(): void {
  ipcMain.handle('start-clicker', async (_event: IpcMainInvokeEvent, config: ClickerSettings) => {
    try {
      await ensureClickerController().start(config);
      return { success: true, message: 'Clicker started successfully' };
    } catch (error) {
      console.error('Error starting clicker:', error);
      return { success: false, message: (error as Error).message };
    }
  });

  ipcMain.handle('stop-clicker', async () => {
    ensureClickerController().stop();
    return { success: true, message: 'Clicker stopped' };
  });

  ipcMain.handle('get-status', async () => ensureClickerController().getStatus());

  ipcMain.handle('start-recording', async () => {
    try {
      await ensureRecordingController().startRecording();
      return { success: true, message: 'Recording started' };
    } catch (error) {
      console.error('Error starting recording:', error);
      return { success: false, message: (error as Error).message };
    }
  });

  ipcMain.handle('stop-recording', async () => {
    try {
      const sequence = ensureRecordingController().stopRecording();
      return { success: true, sequence, message: 'Recording stopped' };
    } catch (error) {
      console.error('Error stopping recording:', error);
      return { success: false, message: (error as Error).message };
    }
  });

  ipcMain.handle('play-sequence', async (_event, sequence: RecordedSequence) => {
    try {
      await ensureRecordingController().playSequence(sequence);
      return { success: true, message: 'Sequence played successfully' };
    } catch (error) {
      console.error('Error playing sequence:', error);
      return { success: false, message: (error as Error).message };
    }
  });

  ipcMain.handle('save-sequence', async (_event, sequence: RecordedSequence) => {
    try {
      await ensureRecordingController().saveSequence(sequence);
      return { success: true, message: 'Sequence saved successfully' };
    } catch (error) {
      console.error('Error saving sequence:', error);
      return { success: false, message: (error as Error).message };
    }
  });

  ipcMain.handle('load-sequences', async () => {
    try {
      const sequences = ensureRecordingController().loadSequences();
      return { success: true, sequences, message: 'Sequences loaded successfully' };
    } catch (error) {
      console.error('Error loading sequences:', error);
      return { success: false, message: (error as Error).message };
    }
  });

  ipcMain.handle('delete-sequence', async (_event, name: string) => {
    try {
      ensureRecordingController().deleteSequence(name);
      return { success: true, message: 'Sequence deleted successfully' };
    } catch (error) {
      console.error('Error deleting sequence:', error);
      return { success: false, message: (error as Error).message };
    }
  });

  ipcMain.handle('capture-region', async (_event, region: ScreenRegion) => {
    try {
      const data = await captureRegion(region);
      return { success: true, data, message: 'Region captured successfully' };
    } catch (error) {
      console.error('Error capturing region:', error);
      return { success: false, message: (error as Error).message };
    }
  });

  ipcMain.handle('find-color', async (_event, region: ScreenRegion, color: ColorMatch) => {
    try {
      const result = await findColorInRegion(region, color);
      return { success: true, ...result, message: result.found ? 'Color found' : 'Color not found' };
    } catch (error) {
      console.error('Error finding color:', error);
      return { success: false, found: false, message: (error as Error).message };
    }
  });

  ipcMain.handle(
    'find-image',
    async (_event, region: ScreenRegion, templatePath: string, options?: ImageMatchOptions) => {
      try {
        const result = await findImageInRegion(region, templatePath, options);
        return {
          success: true,
          ...result,
          message: result.found ? 'Image found' : 'Image not found',
        };
      } catch (error) {
        console.error('Error finding image:', error);
        return { success: false, found: false, message: (error as Error).message };
      }
    }
  );

  ipcMain.handle('lol-start-watcher', async (_event, config: LolWatcherConfig) => {
    try {
      ensureLeagueHelper().start(config);
      return { success: true, message: 'League watcher started' };
    } catch (error) {
      console.error('Error starting League watcher:', error);
      return { success: false, message: (error as Error).message };
    }
  });

  ipcMain.handle('lol-stop-watcher', async () => {
    try {
      ensureLeagueHelper().stop();
      return { success: true, message: 'League watcher stopped' };
    } catch (error) {
      console.error('Error stopping League watcher:', error);
      return { success: false, message: (error as Error).message };
    }
  });

  ipcMain.handle('lol-get-watcher-status', async () => ensureLeagueHelper().getStatus());

  ipcMain.handle('smooth-move-mouse', async (_event, x: number, y: number) => {
    try {
      await smoothMoveMouse(x, y);
      return { success: true, message: 'Mouse moved successfully' };
    } catch (error) {
      console.error('Error moving mouse:', error);
      return { success: false, message: (error as Error).message };
    }
  });
}

app.whenReady().then(async () => {
  await setupControllers();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  clickerController?.stop();
  recordingController?.cancelPlayback();
  leagueHelper?.stop();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
