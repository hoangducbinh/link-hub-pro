import { useState, useEffect } from 'react'
import Launcher, { AppIcon } from './components/Launcher'
import WebViewManager, { WebViewInfo } from './components/WebViewManager'
import TitleBar from './components/TitleBar'
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
  const [layout, setLayout] = useState('single')
  const [activeWebViews, setActiveWebViews] = useState<WebViewInfo[]>([])
  const [activeIds, setActiveIds] = useState<string[]>([]) // IDs assigned to panes

  useEffect(() => {
    const removeListener = window.electronAPI.onToggleLauncher(() => {
      setIsLauncherOpen((prev) => !prev)
    })
    return () => removeListener()
  }, [])

  const handleSelectApp = (app: AppIcon) => {
    setIsLauncherOpen(false)

    // Check if webview already exists in registry
    setActiveWebViews((prev) => {
      if (prev.find((wv) => wv.id === app.id)) return prev
      return [...prev, { id: app.id, url: app.url }]
    })

    // Assign to a slot
    setActiveIds((prev) => {
      if (layout === 'single') return [app.id]

      // If split view, update the first slot if it's the same, or fill second slot
      if (prev.includes(app.id)) return prev
      if (prev.length < 2) return [...prev, app.id]

      // If already has 2, replace the "active" or just the first one
      return [app.id, prev[0]]
    })
  }

  const handleBrowserAction = (type: string) => {
    const activeId = activeIds[0]
    if (!activeId) return

    const wv = document.getElementById(`webview-${activeId}`) as any
    if (!wv) return

    if (type === 'back' && wv.canGoBack()) wv.goBack()
    if (type === 'forward' && wv.canGoForward()) wv.goForward()
    if (type === 'reload') wv.reload()
  }

  return (
    <div className="app-container">
      <TitleBar
        onBack={() => handleBrowserAction('back')}
        onForward={() => handleBrowserAction('forward')}
        onReload={() => handleBrowserAction('reload')}
        onToggleLauncher={() => setIsLauncherOpen(!isLauncherOpen)}
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

        {!isLauncherOpen && activeWebViews.length === 0 && (
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', opacity: 0.3, fontSize: '12px' }}>
            Press Cmd + O to open Launcher
          </div>
        )}
      </div>
    </div>
  )
}

export default App
