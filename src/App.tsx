import { useState, useEffect } from 'react'
import Launcher, { AppIcon } from './components/Launcher'
import WebViewManager, { WebViewInfo } from './components/WebViewManager'
import TitleBar from './components/TitleBar'
import MissionControl from './components/MissionControl'
import './App.css'

import { getFavicon } from './utils/favicon'

const DEFAULT_APPS: AppIcon[] = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/', icon: getFavicon('https://www.google.com/') },
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/?app=desktop&hl=vi', icon: getFavicon('https://www.youtube.com/') },
  { id: 'github', name: 'GitHub', url: 'https://github.com/', icon: getFavicon('https://github.com/') },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', icon: getFavicon('https://chatgpt.com/') },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/', icon: getFavicon('https://gemini.google.com/') },
]

function App() {
  const [isLauncherOpen, setIsLauncherOpen] = useState(false)
  const [isMissionControlOpen, setIsMissionControlOpen] = useState(false)
  const [layout, setLayout] = useState('single')

  // Initialize with Google by default
  const [activeWebViews, setActiveWebViews] = useState<WebViewInfo[]>(() => {
    const googleApp = DEFAULT_APPS[0]
    return [{
      instanceId: `inst-${googleApp.id}-default`,
      appId: googleApp.id,
      url: googleApp.url,
      name: googleApp.name,
      icon: googleApp.icon,
      partition: 'persist:main'
    }]
  })
  const [activeIds, setActiveIds] = useState<string[]>(() => [`inst-${DEFAULT_APPS[0].id}-default`])
  const [currentUrl, setCurrentUrl] = useState('')
  const [screenshots, setScreenshots] = useState<Record<string, string>>({})

  const [isLoading, setIsLoading] = useState(false)

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
        // Update URL and Icon in our state list
        setActiveWebViews(prev => prev.map(w =>
          w.instanceId === activeId ? { ...w, url: newUrl, icon: newIcon } : w
        ))
      }
    }

    const handleStartLoading = () => setIsLoading(true)
    const handleStopLoading = () => setIsLoading(false)

    // Initial check
    // Initial check - wrap in timeout to ensure webview is ready
    setTimeout(() => {
      try {
        if (webviewEl.isLoading?.()) {
          setIsLoading(true)
        } else {
          setIsLoading(false)
        }
      } catch (e) {
        // Ignore errors if webview is not ready
      }
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
  }, [activeIds[0], activeWebViews.length]) // Re-run when primary shift or lists changes

  const handleNavigate = (url: string) => {
    const activeId = activeIds[0]
    if (!activeId) return

    const webviewEl = document.getElementById(`webview-${activeId}`) as any
    if (webviewEl && !webviewEl.isDestroyed?.()) {
      webviewEl.loadURL(url)
    }
  }

  useEffect(() => {
    const removeListener = window.electronAPI.onToggleLauncher(() => {
      setIsLauncherOpen((prev) => !prev)
      setIsMissionControlOpen(false)
    })
    return () => removeListener()
  }, [])

  useEffect(() => {
    if (activeWebViews.length === 0 && isMissionControlOpen) {
      setIsMissionControlOpen(false)
    }
  }, [activeWebViews.length, isMissionControlOpen])

  // Auto-restore Google if all tabs are closed
  useEffect(() => {
    if (activeWebViews.length === 0) {
      const googleApp = DEFAULT_APPS[0]
      const defaultId = `inst-${googleApp.id}-restore-${Date.now()}`
      setActiveWebViews([{
        instanceId: defaultId,
        appId: googleApp.id,
        url: googleApp.url,
        name: googleApp.name,
        partition: 'persist:main'
      }])
      setActiveIds([defaultId])
      setIsMissionControlOpen(false) // meaningful change: ensure we exit mission control
    }
  }, [activeWebViews.length])

  const handleSelectApp = (app: AppIcon, forceNewInstance = false) => {
    setIsLauncherOpen(false)
    setIsMissionControlOpen(false)

    let instanceToFocus: WebViewInfo | undefined

    if (!forceNewInstance) {
      // Find existing instance for this app
      instanceToFocus = activeWebViews.find((wv) => wv.appId === app.id)
    }

    if (!instanceToFocus) {
      // Create new instance
      const newInstance: WebViewInfo = {
        instanceId: `inst-${app.id}-${Date.now()}`,
        appId: app.id,
        url: app.url,
        name: app.name,
        partition: 'persist:main' // Default partition
      }

      // Capture current before switching?
      if (activeIds.length > 0) {
        activeIds.forEach(id => captureSnapshot(id))
      }

      setActiveWebViews((prev) => [...prev, newInstance])
      instanceToFocus = newInstance
    }

    const instanceId = instanceToFocus.instanceId

    // Assign to a slot
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
    } catch (e) {
      console.warn('Browser action failed:', e)
    }
  }

  const captureSnapshot = async (instanceId: string) => {
    const webviewEl = document.getElementById(`webview-${instanceId}`) as any
    if (!webviewEl || webviewEl.tagName !== 'WEBVIEW' || webviewEl.isDestroyed?.() || webviewEl.isLoading?.()) {
      return
    }

    try {
      const image = await webviewEl.capturePage()
      const resized = image.resize({ width: 400 })
      const dataUrl = resized.toDataURL()

      setScreenshots(prev => {
        if (prev[instanceId] === dataUrl) return prev
        return { ...prev, [instanceId]: dataUrl }
      })
    } catch (e) {
      console.warn('Manual snapshot failed:', e)
    }
  }

  // Proactive snapshot capture for visible webviews
  useEffect(() => {
    const timer = setInterval(() => {
      if (isMissionControlOpen || activeIds.length === 0) return
      // Capture only the active one periodically
      activeIds.forEach(id => captureSnapshot(id))
    }, 3000) // 3s interval

    return () => clearInterval(timer)
  }, [activeIds, isMissionControlOpen])

  const handleToggleMissionControl = () => {
    // If opening, capture current state first
    if (!isMissionControlOpen && activeIds.length > 0) {
      activeIds.forEach(id => captureSnapshot(id))
    }
    setIsMissionControlOpen(!isMissionControlOpen)
    setIsLauncherOpen(false)
  }

  return (
    <div className="app-container">
      {/* System Loading Bar */}
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
        onToggleMissionControl={handleToggleMissionControl}
        onSetLayout={(l: string) => setLayout(l)}
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
          apps={DEFAULT_APPS}
        />

        <MissionControl
          isOpen={isMissionControlOpen}
          onClose={() => setIsMissionControlOpen(false)}
          webViews={activeWebViews}
          screenshots={screenshots}
          onSelect={handleSelectFromMissionControl}
          onCloseWebView={handleCloseWebView}
        />

        {!isLauncherOpen && !isMissionControlOpen && activeWebViews.length === 0 && (
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', opacity: 0.3, fontSize: '12px' }}>
            Press Cmd + O to open Launcher
          </div>
        )}
      </div>
    </div>
  )
}

export default App
