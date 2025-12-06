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

interface ElectronAPI {
  startClicker: (config: ClickerConfig) => Promise<{ success: boolean; message?: string }>;
  stopClicker: () => Promise<{ success: boolean; message?: string }>;
  getStatus: () => Promise<{ running: boolean; mode: string; settings: ClickerConfig }>;
  onClickerStatus: (callback: (data: { running: boolean }) => void) => void;
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
} as ElectronAPI);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
