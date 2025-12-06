const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  startClicker: (config) => ipcRenderer.invoke('start-clicker', config),
  stopClicker: () => ipcRenderer.invoke('stop-clicker'),
  getStatus: () => ipcRenderer.invoke('get-status'),
  onClickerStatus: (callback) => {
    ipcRenderer.on('clicker-status', (event, data) => callback(data));
  }
});
