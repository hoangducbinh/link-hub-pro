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
  const [activeIds, setActiveIds] = useState<string[]>([]) // IDs assigned to panes

  useEffect(() => {
    const removeListener = window.electronAPI.onToggleLauncher(() => {
      setIsLauncherOpen((prev) => !prev)
      setIsMissionControlOpen(false)
    })
    return () => removeListener()
  }, [])

  const handleSelectApp = (app: AppIcon) => {
    setIsLauncherOpen(false)
    setIsMissionControlOpen(false)

    // Check if webview already exists in registry
    setActiveWebViews((prev) => {
      if (prev.find((wv) => wv.id === app.id)) return prev
      return [...prev, { id: app.id, url: app.url, name: app.name }]
    })

    // Assign to a slot
    setActiveIds((prev) => {
      if (layout === 'single') return [app.id]

      if (prev.includes(app.id)) return prev
      if (prev.length < 2) return [...prev, app.id]

      return [app.id, prev[0]]
    })
  }

  const handleSelectFromMissionControl = (id: string) => {
    setIsMissionControlOpen(false)
    setActiveIds((prev) => {
      if (layout === 'single') return [id]
      if (prev.includes(id)) return prev
      return [id, ...prev.slice(0, 1)]
    })
  }

  const handleCloseWebView = (id: string) => {
    setActiveWebViews((prev) => prev.filter((wv) => wv.id !== id))
    setActiveIds((prev) => prev.filter((activeId) => activeId !== id))
  }

  const handleBrowserAction = (type: string) => {
    const activeId = activeIds[0]
    if (!activeId) return

    const wv = document.getElementById(`webview-${activeId}`) as any
    if (!wv) return

    if (wv.tagName !== 'WEBVIEW') return

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
        if (activeIds.includes(wv.id) || !wv.screenshot) {
          const webviewEl = document.getElementById(`webview-${wv.id}`) as any
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

      // Only update if there's an actual change to avoid infinite re-renders
      setActiveWebViews(updatedWebViews)
    }, 5000) // Refresh every 5s in background

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
        onSetLayout={(l) => setLayout(l)}
        currentLayout={layout}
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
