import React from 'react'
import {
    Square,
    Minus,
    X,
    ChevronLeft,
    ChevronRight,
    RotateCw,
    LayoutGrid,
    Columns,
    Rows,
    Maximize2
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
            <div className="drag-region"></div>

            {/* Darwin (macOS) window controls are handled by the system but we've hidden them. 
          Actually Electron's trafficLightPosition handles their placement, so we just 
          need to leave space for them on macOS. */}
            {isMac && <div className="macos-traffic-lights-spacer"></div>}

            <div className="title-bar-actions no-drag">
                <button onClick={onBack} title="Back (Alt+Left)"><ChevronLeft size={16} /></button>
                <button onClick={onForward} title="Forward (Alt+Right)"><ChevronRight size={16} /></button>
                <button onClick={onReload} title="Reload (Ctrl+R)"><RotateCw size={16} /></button>
            </div>

            <div className="title-bar-center no-drag">
                <button className="launcher-trigger" onClick={onToggleLauncher}>
                    <LayoutGrid size={16} style={{ marginRight: '8px' }} />
                    <span>Launchpad</span>
                    <span className="shortcut-hint">Cmd+O</span>
                </button>
            </div>

            <div className="title-bar-layouts no-drag">
                <button
                    className={currentLayout === 'single' ? 'active' : ''}
                    onClick={() => onSetLayout('single')}
                    title="Single View"
                >
                    <Square size={16} />
                </button>
                <button
                    className={currentLayout === 'split-h' ? 'active' : ''}
                    onClick={() => onSetLayout('split-h')}
                    title="Split Horizontal"
                >
                    <Columns size={16} />
                </button>
                <button
                    className={currentLayout === 'split-v' ? 'active' : ''}
                    onClick={() => onSetLayout('split-v')}
                    title="Split Vertical"
                >
                    <Rows size={16} />
                </button>
            </div>

            <div className="window-controls no-drag">
                <button className="control-btn" onClick={() => window.electronAPI.minimize()}><Minus size={14} /></button>
                <button className="control-btn" onClick={() => window.electronAPI.maximize()}><Maximize2 size={14} /></button>
                <button className="control-btn close" onClick={() => window.electronAPI.close()}><X size={14} /></button>
            </div>
        </div>
    )
}

export default TitleBar
