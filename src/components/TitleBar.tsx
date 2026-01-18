import React from 'react'
import {
    Minus,
    X,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    LayoutGrid,
    Maximize2,
    Square,
    Layout,
    Settings,
    Download,
    Lock,
    Unlock
} from 'lucide-react'
import LayoutMenu from './LayoutMenu'

interface TitleBarProps {
    onBack: () => void
    onForward: () => void
    onReload: () => void
    onToggleLauncher: () => void
    onToggleMissionControl: () => void
    onSetLayout: (layout: string) => void
    onOpenSettingsMenu: (rect: DOMRect) => void
    onToggleDownloads: () => void
    currentLayout: string
    currentUrl: string
    onNavigate: (url: string) => void
    isCurrentTabLockable?: boolean
    isCurrentTabLocked?: boolean
    onToggleLockTab?: () => void
    onFloatCurrentTab: () => void
}

const TitleBar: React.FC<TitleBarProps> = ({
    onBack,
    onForward,
    onReload,
    onToggleLauncher,
    onToggleMissionControl,
    onSetLayout,
    onOpenSettingsMenu,
    onToggleDownloads,
    currentLayout,
    currentUrl,
    onNavigate,
    isCurrentTabLockable,
    isCurrentTabLocked,
    onToggleLockTab,
    onFloatCurrentTab
}) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const [inputValue, setInputValue] = React.useState(currentUrl)

    React.useEffect(() => {
        setInputValue(currentUrl)
    }, [currentUrl])

    const [openLayoutMenu, setOpenLayoutMenu] = React.useState(false)
    const [layoutMenuRect, setLayoutMenuRect] = React.useState<DOMRect | null>(null)

    const handleOpenLayoutMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setLayoutMenuRect(rect)
        setOpenLayoutMenu(!openLayoutMenu)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const query = inputValue.trim()
            if (!query) return

            // URL detection logic
            const isUrl = query.includes('.') && !query.includes(' ') || query.startsWith('http') || query.startsWith('localhost')
            if (isUrl) {
                const url = query.startsWith('http') ? query : `https://${query}`
                onNavigate(url)
            } else {
                // Fallback to Google Search
                onNavigate(`https://www.google.com/search?q=${encodeURIComponent(query)}`)
            }
            // Blur the input after navigation
            ; (e.target as HTMLInputElement).blur()
        }
    }

    const handleOpenSettings = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        onOpenSettingsMenu(rect)
    }

    return (
        <div className="title-bar">
            {/* Clickable spacer for macOS traffic lights */}
            {isMac && <div className="macos-traffic-lights-spacer"></div>}

            <div className="title-bar-actions no-drag">
                <button onClick={onBack} title="Back">
                    <ChevronLeft size={16} strokeWidth={1.5} />
                </button>
                <button onClick={onForward} title="Forward">
                    <ChevronRight size={16} strokeWidth={1.5} />
                </button>
                <button onClick={onReload} title="Reload">
                    <RotateCcw size={15} strokeWidth={1.5} />
                </button>
            </div>

            <div className="title-bar-center no-drag" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 20px', gap: '8px' }}>
                <button
                    className="tool-btn"
                    onClick={onToggleLauncher}
                    title="Launcher (Cmd+O)"
                >
                    <LayoutGrid size={18} strokeWidth={1.5} />
                </button>

                {isCurrentTabLockable && (
                    <button
                        className={`tool-btn ${isCurrentTabLocked ? 'active' : ''}`}
                        onClick={() => !isCurrentTabLocked && onToggleLockTab?.()}
                        title={isCurrentTabLocked ? "Locked (Enter password to unlock)" : "Lock Tab Manually"}
                        style={{
                            color: isCurrentTabLocked ? '#ef4444' : 'inherit',
                            cursor: isCurrentTabLocked ? 'default' : 'pointer',
                            opacity: isCurrentTabLocked ? 0.8 : 1
                        }}
                    >
                        {isCurrentTabLocked ? <Lock size={18} strokeWidth={1.5} /> : <Unlock size={18} strokeWidth={1.5} />}
                    </button>
                )}

                <div style={{ flex: 1, maxWidth: '600px', position: 'relative' }}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={(e) => e.target.select()}
                        placeholder="Search or enter address"
                        style={{
                            width: '100%',
                            height: '28px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '0 12px',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                            outline: 'none',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                        }}
                        className="address-bar-input"
                    />
                </div>

                <button
                    className="tool-btn"
                    onClick={onToggleMissionControl}
                    title="Mission Control"
                >
                    <Square size={18} strokeWidth={1.5} />
                </button>
            </div>

            <div className="layout-group no-drag" style={{ display: 'flex', gap: '4px', borderLeft: '1px solid var(--border-color)', paddingLeft: '8px', paddingRight: '8px' }}>
                <button
                    className={`tool-btn ${openLayoutMenu ? 'active' : ''}`}
                    onClick={handleOpenLayoutMenu}
                    title="Change Layout"
                >
                    <Layout size={18} strokeWidth={1.5} />
                </button>

                <button
                    className="tool-btn"
                    onClick={onToggleDownloads}
                    title="Downloads"
                >
                    <Download size={18} strokeWidth={1.5} />
                </button>

                <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)', margin: 'auto 4px' }} />

                <button
                    className="tool-btn"
                    onClick={handleOpenSettings}
                    title="Settings"
                >
                    <Settings size={18} strokeWidth={1.5} />
                </button>
            </div>

            <LayoutMenu
                isOpen={openLayoutMenu}
                onClose={() => setOpenLayoutMenu(false)}
                anchorRect={layoutMenuRect}
                currentLayout={currentLayout}
                onSetLayout={onSetLayout}
                onFloatCurrent={onFloatCurrentTab}
            />

            {
                !isMac && (
                    <div className="window-controls no-drag">
                        <button className="control-btn" onClick={() => (window as any).electronAPI.minimize()}>
                            <Minus size={14} strokeWidth={1.5} />
                        </button>
                        <button className="control-btn" onClick={() => (window as any).electronAPI.maximize()}>
                            <Maximize2 size={14} strokeWidth={1.5} />
                        </button>
                        <button className="control-btn close" onClick={() => (window as any).electronAPI.close()}>
                            <X size={14} strokeWidth={1.5} />
                        </button>
                    </div>
                )
            }
        </div >
    )
}

export default TitleBar
