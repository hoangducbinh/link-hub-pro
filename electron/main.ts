import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

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

// Window controls IPC - define once
ipcMain.on('window-minimize', () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow
  win?.minimize()
})

ipcMain.on('window-maximize', () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow
  if (win?.isMaximized()) {
    win.unmaximize()
  } else {
    win?.maximize()
  }
})

ipcMain.on('window-close', () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow
  win?.close()
})

app.on('web-contents-created', (_, contents) => {
  // Only apply to guest webviews
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
        // Allow OAuth/Login popups
        return { action: 'allow' }
      }

      // Deny new window and navigate the current webview instead
      // Use setImmediate to avoid "disposed frame" during the event callback
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
