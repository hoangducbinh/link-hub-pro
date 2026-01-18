import { useState, useEffect } from 'react'
import Launcher from './components/Launcher'
import WebViewManager, { WebViewInfo } from './components/WebViewManager'
import TitleBar from './components/TitleBar'
import MissionControl from './components/MissionControl'
import SettingsModal from './components/SettingsModal'
import SettingsMenu from './components/SettingsMenu'
import DownloadManager, { DownloadItem } from './components/DownloadManager'
import './App.css'

import { getFavicon } from './utils/favicon'
import { AppConfig, WebsiteConfig } from './types/config'

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
  }
}

function App() {
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG)
  const [isLauncherOpen, setIsLauncherOpen] = useState(false)
  const [isMissionControlOpen, setIsMissionControlOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [settingsMenuRect, setSettingsMenuRect] = useState<DOMRect | null>(null)
  const [layout, setLayout] = useState('single')

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
          setConfig(configs[0].data)
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
      />

      <div className="main-content">
        <WebViewManager
          webViews={activeWebViews}
          layout={layout}
          activeIds={activeIds}
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
          onImport={handleImportConfig}
          onExport={handleExportConfig}
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
    </div>
  )
}

export default App
