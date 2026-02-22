import { app, shell, BrowserWindow, ipcMain, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { cloneGuild, checkToken, mirrorChannel, deleteWebhook, changeHypeSquad } from './cloner'
import os from 'os'

// Disable GPU to avoid window rendering issues
// app.commandLine.appendSwitch('disable-gpu')
// app.commandLine.appendSwitch('disable-software-rasterizer')

// Force a clean userData path to avoid permission issues with OneDrive/Desktop
if (is.dev) {
  const customUserData = join(os.tmpdir(), 'conf-cloner-dev-data')
  app.setPath('userData', customUserData)
}

let isStreamerModeEnabled = false

function createWindow(): void {
  const iconPath = join(__dirname, '../../resources/taskbar_icon.png')
  const icon = nativeImage.createFromPath(iconPath)

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Don't show until ready-to-show
    autoHideMenuBar: true,
    frame: false,
    icon: icon, 
    transparent: false, 
    backgroundColor: '#0a0a0c',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      devTools: true // Keep DevTools enabled for F12 manual use, just don't auto-open
    }
  })

  // Open maximized instead of regular window
  mainWindow.maximize()

  // Apply streamer mode if it was already enabled
  if (isStreamerModeEnabled) {
    mainWindow.setContentProtection(true)
  }

  // Fallback to show window if ready-to-show is too slow
  const showTimeout = setTimeout(() => {
    if (!mainWindow.isVisible()) mainWindow.show()
  }, 5000)

  mainWindow.once('ready-to-show', () => {
    clearTimeout(showTimeout)
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (is.dev && devUrl) {
    console.log(`Loading Dev URL: ${devUrl}`)
    mainWindow.loadURL(devUrl)
  } else {
    const filePath = join(__dirname, '../renderer/index.html')
    console.log(`Loading File Path: ${filePath}`)
    mainWindow.loadFile(filePath)
  }
}

app.whenReady().then(() => {
  console.log('App is ready, creating window...')
  electronApp.setAppUserModelId('com.conf.cloner')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  console.log('Creating window...')
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('Activating and creating window...')
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  console.log('All windows closed.')
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
  isStreamerModeEnabled = enabled
  BrowserWindow.getAllWindows().forEach((win) => {
    try {
      win.setContentProtection(enabled)
    } catch (e) {
      console.error('Failed to set content protection:', e)
    }
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

ipcMain.handle('initiate-mirror', async (event, { token, channelId, webhookUrl, options }) => {
  currentCloneSignal = { cancelled: false }
  const webContents = event.sender
  const log = (msg: string, type: 'info' | 'success' | 'error') => {
    webContents.send('clone-log', { msg, type })
  }
  
  try {
    await mirrorChannel(token, channelId, webhookUrl, options, log, currentCloneSignal)
  } catch (error: any) {
    log(error.message, 'error')
  }
})

ipcMain.handle('check-token', async (_event, token: string) => {
  return await checkToken(token)
})

ipcMain.handle('delete-webhook', async (_event, url: string) => {
  return await deleteWebhook(url)
})

ipcMain.handle('change-hypesquad', async (_event, { token, houseId }) => {
  return await changeHypeSquad(token, houseId)
})
