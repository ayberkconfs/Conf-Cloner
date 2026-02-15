import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  setStreamerMode: (enabled: boolean) => ipcRenderer.send('set-streamer-mode', enabled),
  startClone: (data: any) => ipcRenderer.invoke('start-clone', data),
  stopClone: () => ipcRenderer.send('stop-clone'),
  checkToken: (token: string) => ipcRenderer.invoke('check-token', token),
  onLog: (callback: any) => ipcRenderer.on('clone-log', (_event, value) => callback(value))
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
