import { useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import Launcher from './components/Launcher'
import WebViewManager, { WebViewInfo } from './components/WebViewManager'
import TitleBar from './components/TitleBar'
import MissionControl from './components/MissionControl'
import SettingsModal from './components/SettingsModal'
import SettingsMenu from './components/SettingsMenu'
import DownloadManager, { DownloadItem } from './components/DownloadManager'
import AppLockOverlay from './components/AppLockOverlay'
import './App.css'

import { getFavicon } from './utils/favicon'
import { AppConfig, WebsiteConfig } from './types/Config'

const INITIAL_CONFIG: AppConfig = {
  version: '1.0.0',
  websites: [
    { id: 'google', name: 'Google', url: 'https://www.google.com/', icon: getFavicon('https://www.google.com/'), sessionType: 'shared', group: 'General' },
    { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/?app=desktop&hl=vi', icon: getFavicon('https://www.youtube.com/'), sessionType: 'shared', group: 'Entertainment' },
    { id: 'github', name: 'GitHub', url: 'https://github.com/', icon: getFavicon('https://github.com/'), sessionType: 'shared', group: 'Dev' },
    { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', icon: getFavicon('https://chatgpt.com/'), sessionType: 'shared', group: 'AI' },
    { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/', icon: getFavicon('https://gemini.google.com/'), sessionType: 'shared', group: 'AI' },
  ],
  settings: {
    theme: 'dark',
    defaultLayout: 'single'
  },
  shortcuts: [
    { id: 'toggle-launcher', label: 'Toggle Launcher', keys: 'CommandOrControl+O', isGlobal: true, enabled: true },
    { id: 'toggle-mission-control', label: 'Toggle Mission Control', keys: 'CommandOrControl+Shift+M', isGlobal: false, enabled: true },
    { id: 'toggle-downloads', label: 'Toggle Downloads', keys: 'CommandOrControl+J', isGlobal: false, enabled: true }
  ],
  security: {
    appLockEnabled: false,
    autoLockTimer: 0
  }
}

function App() {
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG)
  const [isLauncherOpen, setIsLauncherOpen] = useState(false)
  const [isMissionControlOpen, setIsMissionControlOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [settingsMenuRect, setSettingsMenuRect] = useState<DOMRect | null>(null)
  const [layout, setLayout] = useState('single')
  const [isLocked, setIsLocked] = useState(false)
  const lastActivityRef = useRef(Date.now())

  useEffect(() => {
    if (config.security.appLockEnabled && config.security.passwordHash) {
      setIsLocked(true)
    }
  }, [])

  useEffect(() => {
    if (!config.security.appLockEnabled || config.security.autoLockTimer <= 0) return

    const checkInactivity = () => {
      if (isLocked) return
      const now = Date.now()
      const diff = (now - lastActivityRef.current) / 1000 / 60
      if (diff >= config.security.autoLockTimer) {
        setIsLocked(true)
      }
    }

    const interval = setInterval(checkInactivity, 10000)

    const activityListener = () => {
      lastActivityRef.current = Date.now()
    }

    const blurListener = () => {
      // When the main window loses focus, lock all active tabs that require a password
      setActiveWebViews(prev => prev.map(wv => {
        const site = config.websites.find(s => s.id === wv.appId)
        if (site?.requirePassword) {
          return { ...wv, isLocked: true }
        }
        return wv
      }))
    }

    window.addEventListener('mousemove', activityListener)
    window.addEventListener('keydown', activityListener)
    window.addEventListener('mousedown', activityListener)
    window.addEventListener('blur', blurListener)

    return () => {
      clearInterval(interval)
      window.removeEventListener('mousemove', activityListener)
      window.removeEventListener('keydown', activityListener)
      window.removeEventListener('mousedown', activityListener)
      window.removeEventListener('blur', blurListener)
    }
  }, [config.security.appLockEnabled, config.security.autoLockTimer, isLocked, config.websites])

  // Initialize with the first app from config
  const [activeWebViews, setActiveWebViews] = useState<WebViewInfo[]>([])
  const [activeIds, setActiveIds] = useState<string[]>([])
  const [currentUrl, setCurrentUrl] = useState('')
  const [screenshots, setScreenshots] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [isDownloadManagerOpen, setIsDownloadManagerOpen] = useState(false)

  // Load configuration on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const configs = await (window as any).electronAPI.loadConfigs()
        if (configs && configs.length > 0) {
          const loadedData = configs[0].data
          // Ensure we have all the required fields and migrate old configs
          setConfig({
            ...INITIAL_CONFIG,
            ...loadedData,
            settings: { ...INITIAL_CONFIG.settings, ...(loadedData.settings || {}) },
            shortcuts: loadedData.shortcuts || INITIAL_CONFIG.shortcuts
          })
        } else {
          await (window as any).electronAPI.saveConfig({ name: 'default.json', data: INITIAL_CONFIG })
        }

        const history = await (window as any).electronAPI.getDownloadHistory()
        if (history) setDownloads(history)
      } catch (e) {
        console.error('Failed to load initial data:', e)
      }
    }
    loadData()
  }, [])

  // Setup initial webview after config is loaded
  useEffect(() => {
    if (activeWebViews.length === 0 && config.websites.length > 0) {
      const firstApp = config.websites[0]
      const defaultId = `inst-${firstApp.id}-default`
      setActiveWebViews([{
        instanceId: defaultId,
        appId: firstApp.id,
        url: firstApp.url,
        name: firstApp.name,
        icon: firstApp.icon,
        partition: firstApp.sessionType === 'isolated' ? `persist:iso-${defaultId}` :
          firstApp.sessionType === 'grouped' ? `persist:grp-${firstApp.group || 'default'}` :
            'persist:main'
      }])
      setActiveIds([defaultId])
    }
  }, [config.websites])

  // Sync URL from primary active webview
  useEffect(() => {
    const activeId = activeIds[0]
    if (!activeId) {
      setCurrentUrl('')
      setIsLoading(false)
      return
    }

    const wv = activeWebViews.find(w => w.instanceId === activeId)
    if (wv) setCurrentUrl(wv.url)

    const webviewEl = document.getElementById(`webview-${activeId}`) as any
    if (!webviewEl) return

    const updateUrl = () => {
      if (!webviewEl.isDestroyed?.()) {
        const newUrl = webviewEl.getURL()
        const newIcon = getFavicon(newUrl)
        setCurrentUrl(newUrl)
        setActiveWebViews(prev => prev.map(w =>
          w.instanceId === activeId ? { ...w, url: newUrl, icon: newIcon } : w
        ))
      }
    }

    const handleStartLoading = () => setIsLoading(true)
    const handleStopLoading = () => setIsLoading(false)

    setTimeout(() => {
      try {
        setIsLoading(webviewEl.isLoading?.() || false)
      } catch (e) { }
    }, 100)

    webviewEl.addEventListener('did-navigate', updateUrl)
    webviewEl.addEventListener('did-navigate-in-page', updateUrl)
    webviewEl.addEventListener('did-start-loading', handleStartLoading)
    webviewEl.addEventListener('did-stop-loading', handleStopLoading)

    return () => {
      webviewEl.removeEventListener('did-navigate', updateUrl)
      webviewEl.removeEventListener('did-navigate-in-page', updateUrl)
      webviewEl.removeEventListener('did-start-loading', handleStartLoading)
      webviewEl.removeEventListener('did-stop-loading', handleStopLoading)
    }
  }, [activeIds[0], activeWebViews.length])

  const handleNavigate = (url: string) => {
    const activeId = activeIds[0]
    if (!activeId) return
    const webviewEl = document.getElementById(`webview-${activeId}`) as any
    if (webviewEl && !webviewEl.isDestroyed?.()) {
      webviewEl.loadURL(url)
    }
  }

  useEffect(() => {
    const removeListener = (window as any).electronAPI.onToggleLauncher(() => {
      setIsLauncherOpen((prev: boolean) => !prev)
      setIsMissionControlOpen(false)
    })
    return () => removeListener()
  }, [])

  useEffect(() => {
    if (activeWebViews.length === 0 && isMissionControlOpen) {
      setIsMissionControlOpen(false)
    }
  }, [activeWebViews.length, isMissionControlOpen])

  // Auto-restore if all tabs are closed
  useEffect(() => {
    if (activeWebViews.length === 0 && config.websites.length > 0) {
      const firstApp = config.websites[0]
      const defaultId = `inst-${firstApp.id}-restore-${Date.now()}`
      setActiveWebViews([{
        instanceId: defaultId,
        appId: firstApp.id,
        url: firstApp.url,
        name: firstApp.name,
        partition: firstApp.sessionType === 'isolated' ? `persist:iso-${defaultId}` :
          firstApp.sessionType === 'grouped' ? `persist:grp-${firstApp.group || 'default'}` :
            'persist:main'
      }])
      setActiveIds([defaultId])
      setIsMissionControlOpen(false)
    }
  }, [activeWebViews.length])

  const handleSelectApp = (app: any, forceNewInstance = false) => {
    setIsLauncherOpen(false)
    setIsMissionControlOpen(false)

    let instanceToFocus: WebViewInfo | undefined
    if (!forceNewInstance) {
      instanceToFocus = activeWebViews.find((wv) => wv.appId === app.id)
    }

    if (!instanceToFocus) {
      const instanceId = `inst-${app.id}-${Date.now()}`
      const newInstance: WebViewInfo = {
        instanceId,
        appId: app.id,
        url: app.url,
        name: app.name,
        partition: (app as WebsiteConfig).sessionType === 'isolated' ? `persist:iso-${instanceId}` :
          (app as WebsiteConfig).sessionType === 'grouped' ? `persist:grp-${(app as WebsiteConfig).group || 'default'}` :
            'persist:main'
      }
      if (activeIds.length > 0) {
        activeIds.forEach(id => captureSnapshot(id))
      }
      setActiveWebViews((prev) => [...prev, newInstance])
      instanceToFocus = newInstance
    }

    const instanceId = instanceToFocus.instanceId
    setActiveIds((prev) => {
      if (layout === 'single') return [instanceId]
      if (prev.includes(instanceId)) return prev
      if (prev.length < 2) return [...prev, instanceId]
      return [instanceId, prev[0]]
    })
  }

  const handleSelectFromMissionControl = (instanceId: string) => {
    setIsMissionControlOpen(false)
    setActiveIds((prev) => {
      if (layout === 'single') return [instanceId]
      if (prev.includes(instanceId)) return prev
      return [instanceId, ...prev.slice(0, 1)]
    })
  }

  const handleCloseWebView = (instanceId: string) => {
    setActiveWebViews((prev) => prev.filter((wv) => wv.instanceId !== instanceId))
    setActiveIds((prev) => prev.filter((id) => id !== instanceId))
    setScreenshots((prev) => {
      const newState = { ...prev }
      delete newState[instanceId]
      return newState
    })
  }

  const handleBrowserAction = (type: string) => {
    const activeInstanceId = activeIds[0]
    if (!activeInstanceId) return
    const wv = document.getElementById(`webview-${activeInstanceId}`) as any
    if (!wv || wv.tagName !== 'WEBVIEW' || wv.isDestroyed?.()) return
    try {
      if (type === 'back' && wv.canGoBack()) wv.goBack()
      if (type === 'forward' && wv.canGoForward()) wv.goForward()
      if (type === 'reload') wv.reload()
    } catch (e) { }
  }

  const captureSnapshot = async (instanceId: string) => {
    const webviewEl = document.getElementById(`webview-${instanceId}`) as any
    if (!webviewEl || webviewEl.tagName !== 'WEBVIEW' || webviewEl.isDestroyed?.() || webviewEl.isLoading?.()) return
    try {
      const image = await webviewEl.capturePage()
      const dataUrl = image.resize({ width: 400 }).toDataURL()
      setScreenshots(prev => ({ ...prev, [instanceId]: dataUrl }))
    } catch (e) { }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      if (isMissionControlOpen || activeIds.length === 0) return
      activeIds.forEach(id => captureSnapshot(id))
    }, 5000)
    return () => clearInterval(timer)
  }, [activeIds, isMissionControlOpen])

  // Download listeners
  useEffect(() => {
    const api = (window as any).electronAPI
    if (!api) return

    api.onDownloadStart((item: DownloadItem) => {
      setDownloads(prev => {
        if (prev.some(dl => dl.id === item.id)) return prev
        return [...prev, { ...item, fileExists: true }]
      })
      setIsDownloadManagerOpen(true)
    })

    api.onDownloadProgress((data: { id: string, receivedBytes: number }) => {
      setDownloads(prev => prev.map(dl =>
        dl.id === data.id ? { ...dl, receivedBytes: data.receivedBytes } : dl
      ))
    })

    api.onDownloadState((data: { id: string, state: DownloadItem['state'], path?: string }) => {
      setDownloads(prev => prev.map(dl =>
        dl.id === data.id ? { ...dl, state: data.state, path: data.path || dl.path, fileExists: true } : dl
      ))
    })
  }, [])

  // Shortcut logic
  useEffect(() => {
    const api = (window as any).electronAPI
    if (!api) return

    // helper to execute actions based on shortcut ID
    const executeAction = (id: string) => {
      switch (id) {
        case 'toggle-launcher':
          setIsLauncherOpen(prev => !prev)
          break
        case 'toggle-mission-control':
          setIsMissionControlOpen(prev => !prev)
          break
        case 'focus-url-bar':
          const urlInput = document.getElementById('url-input')
          urlInput?.focus()
          break
        case 'new-tab':
          // We don't have a direct "new blank tab" button yet, but we can open Google
          const googleApp = config.websites.find(w => w.id === 'google')
          if (googleApp) handleSelectApp(googleApp)
          break
        case 'close-tab':
          // Close active tab in single layout
          if (layout === 'single' && activeIds.length > 0) {
            handleCloseWebView(activeIds[0])
          }
          break
        case 'toggle-downloads':
          setIsDownloadManagerOpen(prev => !prev)
          break
      }
    }

    // 1. Register Global Shortcuts
    api.unregisterAllGlobalShortcuts()
    const shortcuts = config.shortcuts || []
    shortcuts.filter(s => s.isGlobal && s.enabled && s.keys).forEach(s => {
      api.registerGlobalShortcut(s.id, s.keys)
    })

    // 2. Listen for Global/Local triggers from Main Process
    const cleanup = api.onShortcutTrigger((id: string) => {
      executeAction(id)
    })

    // 3. Local shortcuts (Renderer only)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input (unless it's the Escape key or something specific)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const shortcuts = config.shortcuts || []
      const activeShortcuts = shortcuts.filter(s => !s.isGlobal && s.enabled && s.keys)

      for (const s of activeShortcuts) {
        const parts = s.keys.split('+').map(p => p.toLowerCase().trim())
        const isCtrl = parts.includes('control') || parts.includes('commandorcontrol') || parts.includes('cmdorctrl')
        const isAlt = parts.includes('alt')
        const isShift = parts.includes('shift')
        const isMeta = parts.includes('command') || parts.includes('meta') || parts.includes('commandorcontrol') || parts.includes('cmdorctrl')
        const key = parts[parts.length - 1]

        const matchKey = e.key.toLowerCase() === key

        // Simplify for common patterns (Cmd/Ctrl + Key)
        const isCmdCtrl = e.metaKey || e.ctrlKey
        const sHasCmdCtrl = isCtrl || isMeta

        if (matchKey && (isCmdCtrl === sHasCmdCtrl) && (e.shiftKey === isShift) && (e.altKey === isAlt)) {
          e.preventDefault()
          executeAction(s.id)
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      cleanup()
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [config.shortcuts, activeIds, layout])

  const handleSaveConfig = async (newConfig: AppConfig) => {
    setConfig(newConfig)
    await (window as any).electronAPI.saveConfig({ name: 'default.json', data: newConfig })
  }

  const handleImportConfig = async () => {
    const result = await (window as any).electronAPI.importConfig()
    if (result) {
      setConfig(result.data)
    }
  }

  const handleExportConfig = async () => {
    await (window as any).electronAPI.exportConfig({ data: config, defaultName: 'linkhub-config.json' })
  }

  const handleRemoveDownloadItem = async (id: string) => {
    const success = await (window as any).electronAPI.removeDownloadItem(id)
    if (success) {
      setDownloads(prev => prev.filter(dl => dl.id !== id))
    }
  }

  const handleClearDownloadHistory = async () => {
    const remaining = await (window as any).electronAPI.clearDownloadHistory()
    if (remaining) {
      setDownloads(remaining)
    }
  }

  return (
    <div className={`app-container theme-${config.settings.theme}`}>
      {isLoading && (
        <div className="loading-bar-container">
          <div className="loading-bar-progress" />
        </div>
      )}

      <TitleBar
        onBack={() => handleBrowserAction('back')}
        onForward={() => handleBrowserAction('forward')}
        onReload={() => handleBrowserAction('reload')}
        onToggleLauncher={() => {
          setIsLauncherOpen(!isLauncherOpen)
          setIsMissionControlOpen(false)
        }}
        onToggleMissionControl={() => setIsMissionControlOpen(!isMissionControlOpen)}
        onSetLayout={(l: string) => setLayout(l)}
        onOpenSettingsMenu={(rect) => setSettingsMenuRect(rect)}
        onToggleDownloads={async () => {
          if (!isDownloadManagerOpen) {
            const history = await (window as any).electronAPI.getDownloadHistory()
            if (history) setDownloads(history)
          }
          setIsDownloadManagerOpen(!isDownloadManagerOpen)
        }}
        currentLayout={layout}
        currentUrl={currentUrl}
        onNavigate={handleNavigate}
        isCurrentTabLockable={!!config.websites.find(s => s.id === activeWebViews.find(w => w.instanceId === activeIds[0])?.appId)?.requirePassword}
        isCurrentTabLocked={!!activeWebViews.find(w => w.instanceId === activeIds[0])?.isLocked}
        onToggleLockTab={() => {
          const activeId = activeIds[0]
          if (!activeId) return
          setActiveWebViews(prev => prev.map(wv =>
            wv.instanceId === activeId ? { ...wv, isLocked: true } : wv
          ))
        }}
      />

      <div className="main-content">
        <WebViewManager
          webViews={activeWebViews}
          layout={layout}
          activeIds={activeIds}
          passwordHash={config.security.passwordHash || ''}
          recoveryHash={config.security.recoveryHash || ''}
          isGlobalLocked={isLocked}
          onUnlockTab={(instanceId) => {
            setActiveWebViews(prev => prev.map(wv =>
              wv.instanceId === instanceId ? { ...wv, isLocked: false } : wv
            ))
          }}
        />

        <Launcher
          isOpen={isLauncherOpen}
          onClose={() => setIsLauncherOpen(false)}
          onSelect={handleSelectApp}
          apps={config.websites}
        />

        <MissionControl
          isOpen={isMissionControlOpen}
          onClose={() => setIsMissionControlOpen(false)}
          webViews={activeWebViews}
          screenshots={screenshots}
          onSelect={handleSelectFromMissionControl}
          onCloseWebView={handleCloseWebView}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          config={config}
          onSave={handleSaveConfig}
        />

        <DownloadManager
          isOpen={isDownloadManagerOpen}
          onClose={() => {
            setIsDownloadManagerOpen(false)
          }}
          downloads={downloads}
          onRemoveItem={handleRemoveDownloadItem}
          onClearHistory={handleClearDownloadHistory}
        />

        <SettingsMenu
          isOpen={!!settingsMenuRect}
          onClose={() => setSettingsMenuRect(null)}
          anchorRect={settingsMenuRect}
          onOpenConfig={() => setIsSettingsModalOpen(true)}
          onImport={handleImportConfig}
          onExport={handleExportConfig}
        />

        {!isLauncherOpen && !isMissionControlOpen && activeWebViews.length === 0 && (
          <div className="placeholder-text">
            Press Cmd + O to open Launcher
          </div>
        )}
      </div>
      <AnimatePresence>
        {isLocked && (
          <AppLockOverlay
            hash={config.security.passwordHash || ''}
            recoveryHash={config.security.recoveryHash || ''}
            onUnlock={() => {
              setIsLocked(false)
              lastActivityRef.current = Date.now()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
