import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      minimize: () => void
      maximize: () => void
      close: () => void
      setStreamerMode: (enabled: boolean) => void
      startClone: (data: { 
        token: string; 
        sourceId: string; 
        targetId: string;
        options: {
          roles: boolean;
          channels: boolean;
          emojis: boolean;
          stickers: boolean;
          serverIcon: boolean;
          serverName: boolean;
        }
      }) => Promise<void>
      stopClone: () => void
      checkToken: (token: string) => Promise<{ 
        valid: boolean; 
        user?: any; 
        hasNitro?: boolean; 
      }>
      deleteWebhook: (url: string) => Promise<{ success: boolean }>
      changeHypeSquad: (data: { token: string; houseId: number }) => Promise<{ success: boolean }>
      mirror: (data: { 
        token: string; 
        channelId: string; 
        webhookUrl: string; 
        options: { pastMessages: boolean; live: boolean } 
      }) => Promise<void>
      onLog: (callback: (log: { msg: string; type: 'info' | 'success' | 'error' }) => void) => void
    }
  }
}
