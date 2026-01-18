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
    Unlock,
    Sliders,
    Search
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
    onOpenConfig: () => void
    onToggleDownloads: () => void
    currentLayout: string
    currentUrl: string
    onNavigate: (url: string) => void
    isCurrentTabLockable?: boolean
    isCurrentTabLocked?: boolean
    onToggleLockTab?: () => void
}

const TitleBar: React.FC<TitleBarProps> = ({
    onBack,
    onForward,
    onReload,
    onToggleLauncher,
    onToggleMissionControl,
    onSetLayout,
    onOpenConfig,
    onOpenSettingsMenu,
    onToggleDownloads,
    currentLayout,
    currentUrl,
    onNavigate,
    isCurrentTabLockable,
    isCurrentTabLocked,
    onToggleLockTab
}) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const [inputValue, setInputValue] = React.useState(currentUrl)

    React.useEffect(() => {
        setInputValue(currentUrl)
    }, [currentUrl])

    const [openLayoutMenu, setOpenLayoutMenu] = React.useState(false)
    const [layoutMenuRect, setLayoutMenuRect] = React.useState<DOMRect | null>(null)
    const [isAddressBarExpanded, setIsAddressBarExpanded] = React.useState(false)
    const addressInputRef = React.useRef<HTMLInputElement>(null)

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

    const toggleAddressBar = () => {
        setIsAddressBarExpanded(!isAddressBarExpanded)
        if (!isAddressBarExpanded) {
            setTimeout(() => addressInputRef.current?.focus(), 100)
        }
    }

    const WindowControls = () => (
        <div className="window-controls-traffic-lights no-drag">
            <button className="traffic-light close" onClick={() => (window as any).electronAPI.close()} title="Close">
                <X size={8} strokeWidth={4} />
            </button>
            <button className="traffic-light minimize" onClick={() => (window as any).electronAPI.minimize()} title="Minimize">
                <Minus size={8} strokeWidth={4} />
            </button>
            <button className="traffic-light maximize" onClick={() => (window as any).electronAPI.maximize()} title="Maximize">
                <Maximize2 size={8} strokeWidth={4} />
            </button>
        </div>
    )

    return (
        <div className="title-bar">
            {isMac ? <div className="macos-traffic-lights-spacer"></div> : <WindowControls />}

            {/* Left Group: Navigation */}
            <div className="title-bar-actions no-drag" style={{ gap: '2px' }}>
                <button onClick={onBack} title="Back">
                    <ChevronLeft size={16} />
                </button>
                <button onClick={onForward} title="Forward">
                    <ChevronRight size={16} />
                </button>
                <button onClick={onReload} title="Reload">
                    <RotateCcw size={15} />
                </button>
                <button className="tool-btn" onClick={onToggleDownloads} title="Downloads">
                    <Download size={17} />
                </button>
            </div>

            {/* Center Group: Launcher & Expandable Address Bar */}
            <div className="title-bar-center no-drag" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <button
                    className={`tool-btn ${isAddressBarExpanded ? 'hidden' : ''}`}
                    onClick={onToggleLauncher}
                    title="Launcher (Cmd+O)"
                >
                    <LayoutGrid size={18} />
                </button>

                <div
                    className={`address-bar-container ${isAddressBarExpanded ? 'expanded' : ''}`}
                    onClick={toggleAddressBar}
                >
                    {!isAddressBarExpanded ? (
                        <Search size={16} strokeWidth={2} style={{ opacity: 0.6 }} />
                    ) : (
                        <input
                            ref={addressInputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setIsAddressBarExpanded(false)
                                }
                                handleKeyDown(e)
                            }}
                            onBlur={() => setIsAddressBarExpanded(false)}
                            onFocus={(e) => e.target.select()}
                            placeholder="Search or enter address"
                            className="address-bar-input"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                </div>

                <button
                    className={`tool-btn ${isAddressBarExpanded ? 'hidden' : ''}`}
                    onClick={onToggleMissionControl}
                    title="Mission Control"
                >
                    <Square size={18} />
                </button>
            </div>

            {/* Right Group: Layout & Settings */}
            <div className="layout-group no-drag" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                {isCurrentTabLockable && (
                    <button
                        className={`tool-btn ${isCurrentTabLocked ? 'active' : ''}`}
                        onClick={() => !isCurrentTabLocked && onToggleLockTab?.()}
                        title={isCurrentTabLocked ? "Locked" : "Lock Tab"}
                        style={{ color: isCurrentTabLocked ? '#ef4444' : 'inherit' }}
                    >
                        {isCurrentTabLocked ? <Lock size={17} /> : <Unlock size={17} />}
                    </button>
                )}

                <button
                    className={`tool-btn ${openLayoutMenu ? 'active' : ''}`}
                    onClick={handleOpenLayoutMenu}
                    title="Layout"
                >
                    <Layout size={17} />
                </button>

                <button className="tool-btn" onClick={onOpenConfig} title="Configuration">
                    <Sliders size={17} />
                </button>

                <button className="tool-btn" onClick={handleOpenSettings} title="Settings">
                    <Settings size={17} />
                </button>
            </div>

            <LayoutMenu
                isOpen={openLayoutMenu}
                onClose={() => setOpenLayoutMenu(false)}
                anchorRect={layoutMenuRect}
                currentLayout={currentLayout}
                onSetLayout={onSetLayout}
            />
        </div>
    )
}

export default TitleBar
