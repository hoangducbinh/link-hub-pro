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
    Sun,
    Moon,
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
    theme: 'light' | 'dark'
    onToggleTheme: () => void
}

const TitleBar: React.FC<TitleBarProps> = ({
    onBack,
    onForward,
    onReload,
    onToggleLauncher,
    onToggleMissionControl,
    onSetLayout,
    currentLayout,
    theme,
    onToggleTheme
}) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

    return (
        <div className="title-bar">
            {/* Clickable spacer for macOS traffic lights to ensure they aren't dimmed */}
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

            <div className="title-bar-center no-drag">
                <button
                    className="launcher-trigger"
                    onClick={onToggleLauncher}
                    style={{ marginRight: '8px' }}
                >
                    <LayoutGrid size={14} strokeWidth={1.5} />
                    <span>Launchpad</span>
                    <span className="shortcut-hint">⌘O</span>
                </button>
                <button
                    className="launcher-trigger"
                    onClick={onToggleMissionControl}
                    title="Mission Control"
                >
                    <Square size={14} strokeWidth={1.5} />
                    <span>Mission Control</span>
                </button>
            </div>

            <button
                className="tool-btn"
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="layout-group" style={{ display: 'flex', gap: '4px', borderLeft: '1px solid var(--border-color)', paddingLeft: '8px' }}>
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
                    className={currentLayout === 'split-v' ? 'active' : ''}
                    onClick={() => onSetLayout('split-v')}
                    title="Split Vertical"
                >
                    <Rows size={15} strokeWidth={1.5} />
                </button>
            </div>

            {!isMac && (
                <div className="window-controls no-drag">
                    <button className="control-btn" onClick={() => window.electronAPI.minimize()}>
                        <Minus size={14} strokeWidth={1.5} />
                    </button>
                    <button className="control-btn" onClick={() => window.electronAPI.maximize()}>
                        <Maximize2 size={14} strokeWidth={1.5} />
                    </button>
                    <button className="control-btn close" onClick={() => window.electronAPI.close()}>
                        <X size={14} strokeWidth={1.5} />
                    </button>
                </div>
            )}
        </div>
    )
}

export default TitleBar
