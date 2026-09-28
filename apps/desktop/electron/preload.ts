import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessageToAgent: (message: string) => ipcRenderer.invoke('send-message-to-agent', message),
  resizeWindow: (width: number, height: number) => ipcRenderer.send('resize-window', width, height),
  onExpandWindow: (callback: () => void) => ipcRenderer.on('expand-window', callback),
  quitApp: () => ipcRenderer.send('quit-app'),
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  checkForUpdates: () => ipcRenderer.send('check-for-updates')
})
