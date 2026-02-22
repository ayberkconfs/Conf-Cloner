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
  deleteWebhook: (url: string) => ipcRenderer.invoke('delete-webhook', url),
  changeHypeSquad: (data: { token: string; houseId: number }) => ipcRenderer.invoke('change-hypesquad', data),
  mirror: (data: any) => ipcRenderer.invoke('initiate-mirror', data),
  // Önceki dinleyicileri temizleyip yenisini ekleyen güvenli yapı
  onLog: (callback: any) => {
    ipcRenderer.removeAllListeners('clone-log');
    ipcRenderer.on('clone-log', (_event, value) => callback(value));
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Bridge Error:', error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
