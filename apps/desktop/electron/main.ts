import { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, session } from 'electron'
import { autoUpdater } from 'electron-updater'
import { join } from 'path'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    show: true,
    frame: false,
    transparent: true,
    resizable: false,
    icon: join(__dirname, '../dist/icon.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

function toggleWindow() {
  if (!mainWindow) return
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
    mainWindow.focus()
  }
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(true)
  })
  session.defaultSession.setPermissionCheckHandler((_webContents, _permission) => {
    return true
  })

  createWindow()
  
  // Setup auto-updater
  autoUpdater.checkForUpdatesAndNotify()

  try {
    tray = new Tray(join(__dirname, '../dist/icon.png'))
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open Orbit', click: () => {
          if (mainWindow) {
            mainWindow.show()
            mainWindow.focus()
            mainWindow.webContents.send('expand-window')
          }
      }},
      { label: 'Hide Orbit', click: () => {
          if (mainWindow) {
            mainWindow.hide()
          }
      }},
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ])
    tray.setToolTip('Orbit AI Agent')
    tray.setContextMenu(contextMenu)
    tray.on('click', () => {
      if (mainWindow) {
        mainWindow.show()
        mainWindow.focus()
        mainWindow.webContents.send('expand-window')
      }
    })
  } catch (e) {
    console.error('Could not load Tray icon', e)
  }

  globalShortcut.register('CommandOrControl+Space', toggleWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

ipcMain.handle('send-message-to-agent', async (_event, message) => {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    })
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error talking to agent:', error)
    return { response: "Error: Could not connect to Python agent backend. Is it running?" }
  }
})

ipcMain.on('resize-window', (_event, width, height) => {
  if (mainWindow) {
    mainWindow.setSize(width, height)
  }
})

ipcMain.on('quit-app', () => {
  app.quit()
})

ipcMain.on('show-context-menu', () => {
  const menu = Menu.buildFromTemplate([
    { label: 'Expand Orbit', click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('expand-window')
        }
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])
  menu.popup()
})

ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdatesAndNotify()
})
