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

  // Register global shortcut
  const shortcut = 'CommandOrControl+O'
  globalShortcut.unregister(shortcut) // Ensure no duplicates
  globalShortcut.register(shortcut, () => {
    mainWindow?.webContents.send('toggle-launcher')
  })

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

app.on('web-contents-created', (_, contents) => {
  if (contents.getType() === 'webview') {
    contents.setWindowOpenHandler(({ url }) => {
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
