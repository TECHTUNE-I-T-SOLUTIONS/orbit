"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  sendMessageToAgent: (message) => electron.ipcRenderer.invoke("send-message-to-agent", message),
  resizeWindow: (width, height) => electron.ipcRenderer.send("resize-window", width, height),
  onExpandWindow: (callback) => electron.ipcRenderer.on("expand-window", callback),
  quitApp: () => electron.ipcRenderer.send("quit-app"),
  showContextMenu: () => electron.ipcRenderer.send("show-context-menu"),
  checkForUpdates: () => electron.ipcRenderer.send("check-for-updates")
});
