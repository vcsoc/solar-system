// Preload script for Electron security
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    saveImage: () => ipcRenderer.send('save-image'),
    onSaveImage: (callback) => ipcRenderer.on('save-image', callback),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});