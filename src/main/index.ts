import { app, shell, BrowserWindow, ipcMain, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { cloneGuild, checkToken } from './cloner'

function createWindow(): void {
  const iconPath = join(__dirname, '../../resources/taskbar_icon.png')
  const icon = nativeImage.createFromPath(iconPath)

  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    icon: icon, // Taskbar and Window icon
    transparent: false, 
    backgroundColor: '#0a0a0c',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.setIcon(icon) // Force set the new large icon
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.conf.cloner')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers for window controls
ipcMain.on('window-minimize', () => {
  BrowserWindow.getFocusedWindow()?.minimize()
})

ipcMain.on('window-maximize', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (win?.isMaximized()) {
    win.unmaximize()
  } else {
    win?.maximize()
  }
})

ipcMain.on('window-close', () => {
  BrowserWindow.getFocusedWindow()?.close()
})

ipcMain.on('set-streamer-mode', (_event, enabled: boolean) => {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.setContentProtection(enabled)
  })
  console.log(`Streamer Mode: ${enabled ? 'ENABLED' : 'DISABLED'}`)
})

let currentCloneSignal = { cancelled: false }

ipcMain.handle('start-clone', async (event, { token, sourceId, targetId, options }) => {
  currentCloneSignal = { cancelled: false }
  const webContents = event.sender
  const log = (msg: string, type: 'info' | 'success' | 'error') => {
    webContents.send('clone-log', { msg, type })
  }
  
  try {
    await cloneGuild(token, sourceId, targetId, options, log, currentCloneSignal)
  } catch (error: any) {
    log(error.message, 'error')
  }
})

ipcMain.on('stop-clone', () => {
  currentCloneSignal.cancelled = true
})

ipcMain.handle('check-token', async (_event, token: string) => {
  return await checkToken(token)
})
