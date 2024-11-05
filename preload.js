const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: async (buffer, filePath) =>
    await ipcRenderer.invoke('save-file', { buffer, filePath }),

  showSaveDialog: async (options) =>
    await ipcRenderer.invoke('show-save-dialog', options),

 getVideoSources: async () => 
    await ipcRenderer.invoke('get-video-sources'),
});