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
  const [activeWebViews, setActiveWebViews] = useState<WebViewInfo[]>([])
  const [activeIds, setActiveIds] = useState<string[]>([]) // List of instanceIds assigned to panes

  // Theme state with system default
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const removeListener = window.electronAPI.onToggleLauncher(() => {
      setIsLauncherOpen((prev) => !prev)
      setIsMissionControlOpen(false)
    })
    return () => removeListener()
  }, [])

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
    if (!wv || wv.tagName !== 'WEBVIEW') return

    if (type === 'back' && wv.canGoBack()) wv.goBack()
    if (type === 'forward' && wv.canGoForward()) wv.goForward()
    if (type === 'reload') wv.reload()
  }

  // Proactive snapshot capture for visible webviews
  useEffect(() => {
    const timer = setInterval(async () => {
      if (isMissionControlOpen || activeIds.length === 0) return

      const updatedWebViews = await Promise.all(activeWebViews.map(async (wv) => {
        // Only refresh visible ones or those without a snapshot
        if (activeIds.includes(wv.instanceId) || !wv.screenshot) {
          const webviewEl = document.getElementById(`webview-${wv.instanceId}`) as any
          if (webviewEl && webviewEl.tagName === 'WEBVIEW') {
            try {
              const image = await webviewEl.capturePage()
              return { ...wv, screenshot: image.toDataURL() }
            } catch (e) {
              return wv
            }
          }
        }
        return wv
      }))

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
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
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
