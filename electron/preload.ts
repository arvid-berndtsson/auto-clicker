import { contextBridge, ipcRenderer } from 'electron';

interface ClickerConfig {
  mode: string;
  minDelay: number;
  maxDelay: number;
  burstCount: number;
  clickKey: string;
  stopKey: string;
  button: string;
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

interface ElectronAPI {
  startClicker: (config: ClickerConfig) => Promise<{ success: boolean; message?: string }>;
  stopClicker: () => Promise<{ success: boolean; message?: string }>;
  getStatus: () => Promise<{ running: boolean; mode: string; settings: ClickerConfig }>;
  onClickerStatus: (callback: (data: { running: boolean }) => void) => void;
  
  // Recording features
  startRecording: () => Promise<{ success: boolean; message?: string }>;
  stopRecording: () => Promise<{ success: boolean; sequence?: RecordedSequence; message?: string }>;
  playSequence: (sequence: RecordedSequence) => Promise<{ success: boolean; message?: string }>;
  saveSequence: (sequence: RecordedSequence) => Promise<{ success: boolean; message?: string }>;
  loadSequences: () => Promise<{ success: boolean; sequences?: RecordedSequence[]; message?: string }>;
  deleteSequence: (name: string) => Promise<{ success: boolean; message?: string }>;
  onRecordingStatus: (callback: (data: { recording: boolean }) => void) => void;
  
  // Image and color recognition
  captureRegion: (region: ScreenRegion) => Promise<{ success: boolean; data?: Uint8Array; message?: string }>;
  findColor: (region: ScreenRegion, color: ColorMatch) => Promise<{ success: boolean; found: boolean; x?: number; y?: number; message?: string }>;
  findImage: (region: ScreenRegion, templatePath: string) => Promise<{ success: boolean; found: boolean; x?: number; y?: number; message?: string }>;
  
  // Smooth mouse movement
  smoothMoveMouse: (x: number, y: number) => Promise<{ success: boolean; message?: string }>;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  startClicker: (config: ClickerConfig) => ipcRenderer.invoke('start-clicker', config),
  stopClicker: () => ipcRenderer.invoke('stop-clicker'),
  getStatus: () => ipcRenderer.invoke('get-status'),
  onClickerStatus: (callback: (data: { running: boolean }) => void) => {
    ipcRenderer.on('clicker-status', (event, data) => callback(data));
  },
  
  // Recording features
  startRecording: () => ipcRenderer.invoke('start-recording'),
  stopRecording: () => ipcRenderer.invoke('stop-recording'),
  playSequence: (sequence: RecordedSequence) => ipcRenderer.invoke('play-sequence', sequence),
  saveSequence: (sequence: RecordedSequence) => ipcRenderer.invoke('save-sequence', sequence),
  loadSequences: () => ipcRenderer.invoke('load-sequences'),
  deleteSequence: (name: string) => ipcRenderer.invoke('delete-sequence', name),
  onRecordingStatus: (callback: (data: { recording: boolean }) => void) => {
    ipcRenderer.on('recording-status', (event, data) => callback(data));
  },
  
  // Image and color recognition
  captureRegion: (region: ScreenRegion) => ipcRenderer.invoke('capture-region', region),
  findColor: (region: ScreenRegion, color: ColorMatch) => ipcRenderer.invoke('find-color', region, color),
  findImage: (region: ScreenRegion, templatePath: string) => ipcRenderer.invoke('find-image', region, templatePath),
  
  // Smooth mouse movement
  smoothMoveMouse: (x: number, y: number) => ipcRenderer.invoke('smooth-move-mouse', x, y),
} as ElectronAPI);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
