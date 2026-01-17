import { useState, useEffect } from 'react'
import Launcher, { AppIcon } from './components/Launcher'
import WebViewManager, { WebViewInfo } from './components/WebViewManager'
import TitleBar from './components/TitleBar'
import MissionControl from './components/MissionControl'
import './App.css'

const DEFAULT_APPS: AppIcon[] = [
  { id: 'google', name: 'Google', url: 'https://www.google.com' },
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com' },
  { id: 'github', name: 'GitHub', url: 'https://github.com' },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com' },
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
      partition: 'persist:main'
    }]
  })
  const [activeIds, setActiveIds] = useState<string[]>(() => [`inst-${DEFAULT_APPS[0].id}-default`])
  const [currentUrl, setCurrentUrl] = useState('')
  const [activeTools, setActiveTools] = useState<Record<string, string[]>>({}) // instanceId -> toolIds

  // Sync URL from primary active webview
  useEffect(() => {
    const activeId = activeIds[0]
    if (!activeId) {
      setCurrentUrl('')
      return
    }

    const wv = activeWebViews.find(w => w.instanceId === activeId)
    if (wv) setCurrentUrl(wv.url)

    const webviewEl = document.getElementById(`webview-${activeId}`) as any
    if (!webviewEl) return

    const updateUrl = () => {
      if (!webviewEl.isDestroyed?.()) {
        const newUrl = webviewEl.getURL()
        setCurrentUrl(newUrl)
        // Update URL in our state list too so it's fresh for Mission Control/reloads
        setActiveWebViews(prev => prev.map(w =>
          w.instanceId === activeId ? { ...w, url: newUrl } : w
        ))
      }
    }

    webviewEl.addEventListener('did-navigate', updateUrl)
    webviewEl.addEventListener('did-navigate-in-page', updateUrl)

    return () => {
      webviewEl.removeEventListener('did-navigate', updateUrl)
      webviewEl.removeEventListener('did-navigate-in-page', updateUrl)
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

  const handleToggleTool = (toolId: string) => {
    const activeId = activeIds[0]
    if (!activeId) return

    setActiveTools(prev => {
      const currentTools = prev[activeId] || []
      const isToolActive = currentTools.includes(toolId)

      const updatedTools = isToolActive
        ? currentTools.filter(id => id !== toolId)
        : [...currentTools, toolId]

      return {
        ...prev,
        [activeId]: updatedTools
      }
    })
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

  // Proactive snapshot capture for visible webviews
  useEffect(() => {
    const timer = setInterval(async () => {
      if (isMissionControlOpen || activeIds.length === 0) return

      const updatedWebViews = [...activeWebViews]

      for (let i = 0; i < updatedWebViews.length; i++) {
        const wv = updatedWebViews[i]
        // Only refresh visible ones or those without a snapshot
        if (activeIds.includes(wv.instanceId) || !wv.screenshot) {
          const webviewEl = document.getElementById(`webview-${wv.instanceId}`) as any
          if (webviewEl && webviewEl.tagName === 'WEBVIEW') {
            try {
              // Vital checks for sequential stability
              if (webviewEl.isDestroyed?.() || webviewEl.isLoading?.()) {
                continue
              }

              const image = await webviewEl.capturePage()
              updatedWebViews[i] = { ...wv, screenshot: image.toDataURL() }

              // Small yield to main thread to prevent UI lock and race conditions
              await new Promise(r => setTimeout(r, 50))
            } catch (e: any) {
              // Ignore common disposed race condition
              if (!e.message?.includes('disposed')) {
                console.warn(`Snapshot capture failed for ${wv.instanceId}:`, e.message)
              }
            }
          }
        }
      }

      // Only update if there's an actual change 
      setActiveWebViews((prev) => {
        const hasChanged = JSON.stringify(prev) !== JSON.stringify(updatedWebViews)
        return hasChanged ? updatedWebViews : prev
      })
    }, 5000)

    return () => clearInterval(timer)
  }, [activeIds, activeWebViews, isMissionControlOpen])

  const handleToggleMissionControl = () => {
    setIsMissionControlOpen(!isMissionControlOpen)
    setIsLauncherOpen(false)
  }

  return (
    <div className="app-container">
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
        activeToolIds={activeTools[activeIds[0]] || []}
        onToggleTool={handleToggleTool}
      />

      <div className="main-content">
        <WebViewManager
          webViews={activeWebViews}
          layout={layout}
          activeIds={activeIds}
          activeTools={activeTools}
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
