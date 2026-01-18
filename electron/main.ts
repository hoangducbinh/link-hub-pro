import { app, BrowserWindow, globalShortcut, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

const USER_DATA_PATH = app.getPath('userData')
const CONFIG_DIR = path.join(USER_DATA_PATH, 'configs')
const ASSETS_DIR = path.join(USER_DATA_PATH, 'assets')

// Create directories if not exist
if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true })
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true })

process.on('uncaughtException', (error) => {
  if (error.message?.includes('Render frame was disposed')) {
    return;
  }
  console.error('Uncaught Exception:', error);
});

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.maximize()
    }
  })

  // Dynamic shortcuts will be registered via IPC from the renderer

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Window controls IPC
ipcMain.on('window-minimize', () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow
  win?.minimize()
})

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow
  if (win?.isMaximized()) {
    win.unmaximize()
  } else {
    win?.maximize()
  }
})

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow
  win?.close()
})

// Configuration IPC Handlers
ipcMain.handle('config:load-all', async () => {
  const files = fs.readdirSync(CONFIG_DIR).filter(f => f.endsWith('.json'))
  const configs = files.map(file => {
    const content = fs.readFileSync(path.join(CONFIG_DIR, file), 'utf8')
    return { name: file, data: JSON.parse(content) }
  })
  return configs
})

ipcMain.handle('config:save', async (_, { name, data }) => {
  const filePath = path.join(CONFIG_DIR, name.endsWith('.json') ? name : `${name}.json`)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
  return true
})

ipcMain.handle('config:export', async (_, { data, defaultName }) => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: defaultName || 'config.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })

  if (filePath) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
    return true
  }
  return false
})

ipcMain.handle('config:import', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })

  if (filePaths.length > 0) {
    const content = fs.readFileSync(filePaths[0], 'utf8')
    const fileName = path.basename(filePaths[0])
    const data = JSON.parse(content)

    // Save to internal config dir
    const internalPath = path.join(CONFIG_DIR, fileName)
    fs.writeFileSync(internalPath, content, 'utf8')
    return { name: fileName, data }
  }
  return null
})

// Handle icon selection for custom apps
ipcMain.handle('config:pick-icon', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'svg', 'ico'] }]
  })

  if (filePaths.length > 0) {
    const srcPath = filePaths[0]
    const ext = path.extname(srcPath)
    const fileName = `icon-${Date.now()}${ext}`
    const destPath = path.join(ASSETS_DIR, fileName)

    fs.copyFileSync(srcPath, destPath)
    // Return the "protocol" or absolute path. 
    // Webviews/Renderer might need a custom protocol to access local files if sandbox is on.
    // However, for simplicity here, we'll return the base64 or a path if allowed.
    // Better: return the data URL for small icons or use a file protocol.
    const buffer = fs.readFileSync(destPath)
    const base64 = buffer.toString('base64')
    const mime = ext === '.svg' ? 'image/svg+xml' : `image/${ext.replace('.', '')}`
    return `data:${mime};base64,${base64}`
  }
  return null
})

// Shortcut Management IPC
ipcMain.on('shortcuts:register-global', (_, { id, keys }) => {
  try {
    globalShortcut.unregister(keys) // Unregister if already exists
    const success = globalShortcut.register(keys, () => {
      mainWindow?.webContents.send('shortcut:trigger', id)
    })
    if (!success) console.warn(`Failed to register global shortcut: ${keys}`)
  } catch (e) {
    console.error(`Error registering shortcut ${keys}:`, e)
  }
})

ipcMain.on('shortcuts:unregister-global', (_, keys) => {
  globalShortcut.unregister(keys)
})

ipcMain.on('shortcuts:unregister-all', () => {
  globalShortcut.unregisterAll()
})

// Download Management
interface DownloadItem {
  id: string
  name: string
  url: string
  totalBytes: number
  receivedBytes: number
  state: 'downloading' | 'completed' | 'failed' | 'cancelled'
  path: string
  startTime: number
  fileExists?: boolean
}

const DOWNLOADS_FILE = path.join(USER_DATA_PATH, 'downloads.json')
let downloads: Record<string, DownloadItem> = {}

if (fs.existsSync(DOWNLOADS_FILE)) {
  try {
    downloads = JSON.parse(fs.readFileSync(DOWNLOADS_FILE, 'utf8'))
  } catch (e) {
    console.error('Failed to load downloads:', e)
  }
}

function saveDownloads() {
  fs.writeFileSync(DOWNLOADS_FILE, JSON.stringify(downloads, null, 2), 'utf8')
}

const DOWNLOAD_HANDLERS_SET = new WeakSet()
let downloadCounter = 0

function setupDownloadHandler(session: any) {
  if (DOWNLOAD_HANDLERS_SET.has(session)) return
  DOWNLOAD_HANDLERS_SET.add(session)

  session.on('will-download', (_event: any, item: any, _webContents: any) => {
    // Generate a unique ID
    const id = `dl-${Date.now()}-${++downloadCounter}`

    // Set default save path to Downloads folder
    const downloadsPath = app.getPath('downloads')
    const fileName = item.getFilename()
    const savePath = path.join(downloadsPath, fileName)

    // Handle file name collisions (e.g., file (1).zip)
    let finalPath = savePath
    let counter = 1
    while (fs.existsSync(finalPath)) {
      const ext = path.extname(fileName)
      const base = path.basename(fileName, ext)
      finalPath = path.join(downloadsPath, `${base} (${counter})${ext}`)
      counter++
    }

    item.setSavePath(finalPath)

    const url = item.getURL()
    const totalBytes = item.getTotalBytes()

    downloads[id] = {
      id,
      name: path.basename(finalPath),
      url,
      totalBytes,
      receivedBytes: 0,
      state: 'downloading',
      path: finalPath,
      startTime: Date.now(),
      fileExists: true
    }

    mainWindow?.webContents.send('download:start', downloads[id])

    item.on('updated', (_event: any, state: string) => {
      if (state === 'progressing') {
        downloads[id].receivedBytes = item.getReceivedBytes()
        mainWindow?.webContents.send('download:progress', { id, receivedBytes: downloads[id].receivedBytes })
      } else if (state === 'interrupted') {
        downloads[id].state = 'failed'
        mainWindow?.webContents.send('download:state', { id, state: 'failed' })
        saveDownloads()
      }
    })

    item.once('done', (_event: any, state: string) => {
      downloads[id].state = state === 'completed' ? 'completed' : state === 'cancelled' ? 'cancelled' : 'failed'
      downloads[id].path = item.getSavePath()
      mainWindow?.webContents.send('download:state', { id, state: downloads[id].state, path: downloads[id].path })
      saveDownloads()
    })
  })
}

// Hook into all sessions (including partitions)
app.on('session-created', (session) => {
  setupDownloadHandler(session)
})

ipcMain.handle('download:get-history', () => {
  return Object.values(downloads).map(dl => ({
    ...dl,
    fileExists: dl.path ? fs.existsSync(dl.path) : false
  }))
})
ipcMain.handle('download:open-file', (_, filePath) => {
  if (fs.existsSync(filePath)) {
    import('electron').then(({ shell }) => shell.openPath(filePath))
  }
})
ipcMain.handle('download:open-folder', (_, filePath) => {
  if (fs.existsSync(filePath)) {
    import('electron').then(({ shell }) => shell.showItemInFolder(filePath))
  }
})
ipcMain.handle('download:remove-item', (_, id) => {
  if (downloads[id]) {
    delete downloads[id]
    saveDownloads()
    return true
  }
  return false
})
ipcMain.handle('download:clear-history', () => {
  // Only clear completed/failed/cancelled downloads
  Object.keys(downloads).forEach(id => {
    if (downloads[id].state !== 'downloading') {
      delete downloads[id]
    }
  })
  saveDownloads()
  return Object.values(downloads)
})

app.on('web-contents-created', (_, contents) => {
  if (contents.getType() === 'webview') {
    contents.setWindowOpenHandler(({ url }) => {
      // ... existing auth hosts logic ...
      const allowedHosts = [
        'accounts.google.com',
        'github.com/login',
        'appleid.apple.com',
        'auth.meta.com',
        'facebook.com/v15.0/dialog/oauth',
        'linkedin.com/oauth',
        'microsoftonline.com',
        'amazon.com/ap/signin',
        'twitter.com/oauth',
        'discord.com/oauth2',
        'okta.com',
        'auth0.com'
      ]

      const isAuthFlow = allowedHosts.some(host => url.includes(host))

      if (isAuthFlow) {
        return { action: 'allow' }
      }

      setImmediate(() => {
        if (!contents.isDestroyed()) {
          contents.loadURL(url).catch(e => console.error('Failed to load URL in webview:', e))
        }
      })
      return { action: 'deny' }
    })
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.whenReady().then(() => {
  createWindow()
})
