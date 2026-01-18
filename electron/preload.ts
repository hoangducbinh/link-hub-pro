import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  // Context Menu & DevTools
  showContextMenu: (params: { x: number, y: number, instanceId: string }) => ipcRenderer.send('show-context-menu', params),
  onOpenDevTools: (callback: (event: any, data: { instanceId: string }) => void) => {
    const listener = (event: any, data: any) => callback(event, data)
    ipcRenderer.on('open-devtools', listener)
    return () => ipcRenderer.removeListener('open-devtools', listener)
  },
  onToggleLauncher: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('toggle-launcher', listener)
    return () => ipcRenderer.removeListener('toggle-launcher', listener)
  },
  // Basic window controls if needed
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Config APIs
  loadConfigs: () => ipcRenderer.invoke('config:load-all'),
  saveConfig: (payload: { name: string, data: any }) => ipcRenderer.invoke('config:save', payload),
  importConfig: () => ipcRenderer.invoke('config:import'),
  exportConfig: (payload: { data: any, defaultName: string }) => ipcRenderer.invoke('config:export', payload),
  pickIcon: () => ipcRenderer.invoke('config:pick-icon'),

  // Download APIs
  getDownloadHistory: () => ipcRenderer.invoke('download:get-history'),
  openDownloadedFile: (path: string) => ipcRenderer.invoke('download:open-file', path),
  openDownloadedFolder: (path: string) => ipcRenderer.invoke('download:open-folder', path),
  onDownloadStart: (callback: (item: any) => void) => {
    ipcRenderer.on('download:start', (_e, item) => callback(item))
  },
  onDownloadProgress: (callback: (data: { id: string, receivedBytes: number }) => void) => {
    ipcRenderer.on('download:progress', (_e, data) => callback(data))
  },
  onDownloadState: (callback: (data: { id: string, state: string, path?: string }) => void) => {
    ipcRenderer.on('download:state', (_e, data) => callback(data))
  },
  removeDownloadItem: (id: string) => ipcRenderer.invoke('download:remove-item', id),
  clearDownloadHistory: () => ipcRenderer.invoke('download:clear-history'),

  // Custom Shortcuts
  onShortcutTrigger: (callback: (id: string) => void) => {
    const subscription = (_e: any, id: string) => callback(id)
    ipcRenderer.on('shortcut:trigger', subscription)
    return () => ipcRenderer.removeListener('shortcut:trigger', subscription)
  },
  registerGlobalShortcut: (id: string, keys: string) => ipcRenderer.send('shortcuts:register-global', { id, keys }),
  unregisterGlobalShortcut: (keys: string) => ipcRenderer.send('shortcuts:unregister-global', keys),
  unregisterAllGlobalShortcuts: () => ipcRenderer.send('shortcuts:unregister-all'),

  // Security APIs
  hashPassword: (password: string) => ipcRenderer.invoke('security:hash-password', password),
  verifyPassword: (password: string, hash: string) => ipcRenderer.invoke('security:verify-password', { password, hash }),
})

// Keep raw ipcRenderer if the template uses it, but we prefer the explicit API above
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})
