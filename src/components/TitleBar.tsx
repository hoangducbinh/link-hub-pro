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
    Square
} from 'lucide-react'

interface TitleBarProps {
    onBack: () => void
    onForward: () => void
    onReload: () => void
    onToggleLauncher: () => void
    onSetLayout: (layout: string) => void
    currentLayout: string
}

const TitleBar: React.FC<TitleBarProps> = ({
    onBack,
    onForward,
    onReload,
    onToggleLauncher,
    onSetLayout,
    currentLayout
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
                <button className="launcher-trigger" onClick={onToggleLauncher}>
                    <LayoutGrid size={14} strokeWidth={1.5} />
                    <span>Launchpad</span>
                    <span className="shortcut-hint">⌘O</span>
                </button>
            </div>

            <div className="title-bar-layouts no-drag">
                <button
                    className={currentLayout === 'single' ? 'active' : ''}
                    onClick={() => onSetLayout('single')}
                    title="Single View"
                >
                    <Square size={15} strokeWidth={1.5} />
                </button>
                <button
                    className={currentLayout === 'split-h' ? 'active' : ''}
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
