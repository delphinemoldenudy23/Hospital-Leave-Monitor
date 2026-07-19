const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// selected Electron APIs without exposing the entire API surface
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
});