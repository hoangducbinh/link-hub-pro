import React from 'react'
import {
    Minus,
    X,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    LayoutGrid,
    Columns,
    Rows,
    Maximize2,
    Square,
    Layout
} from 'lucide-react'

interface TitleBarProps {
    onBack: () => void
    onForward: () => void
    onReload: () => void
    onToggleLauncher: () => void
    onToggleMissionControl: () => void
    onSetLayout: (layout: string) => void
    currentLayout: string
    currentUrl: string
    onNavigate: (url: string) => void
}

const TitleBar: React.FC<TitleBarProps> = ({
    onBack,
    onForward,
    onReload,
    onToggleLauncher,
    onToggleMissionControl,
    onSetLayout,
    currentLayout,
    currentUrl,
    onNavigate,
}) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const [inputValue, setInputValue] = React.useState(currentUrl)

    React.useEffect(() => {
        setInputValue(currentUrl)
    }, [currentUrl])

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

            <div className="layout-group no-drag" style={{ display: 'flex', gap: '4px', borderLeft: '1px solid var(--border-color)', paddingLeft: '8px' }}>
                <button
                    className={`tool-btn ${currentLayout === 'single' ? 'active' : ''}`}
                    onClick={() => onSetLayout('single')}
                    title="Single View"
                >
                    <Layout size={18} />
                </button>
                <button
                    className={`tool-btn ${currentLayout === 'split-h' ? 'active' : ''}`}
                    onClick={() => onSetLayout('split-h')}
                    title="Split Horizontal"
                >
                    <Columns size={15} strokeWidth={1.5} />
                </button>
                <button
                    className={`tool-btn ${currentLayout === 'split-v' ? 'active' : ''}`}
                    onClick={() => onSetLayout('split-v')}
                    title="Split Vertical"
                >
                    <Rows size={15} strokeWidth={1.5} />
                </button>
            </div>

            {!isMac && (
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
            )}
        </div>
    )
}

export default TitleBar
