import React from 'react'
import AppLockOverlay from './AppLockOverlay'
import { AnimatePresence } from 'framer-motion'
import { Maximize2, Minimize2 } from 'lucide-react'

export interface WebViewInfo {
    instanceId: string
    appId: string
    url: string
    name: string
    icon?: string
    partition?: string
    isLocked?: boolean
}

export interface FloatingState {
    instanceId: string
    rect: { x: number; y: number; width: number; height: number }
    isCollapsed: boolean
}

interface WebViewManagerProps {
    webViews: WebViewInfo[]
    layout: string
    activeIds: string[]
    passwordHash: string
    recoveryHash?: string
    isGlobalLocked: boolean
    onUnlockTab: (instanceId: string) => void
    splitRatio?: number
    onResizeSplit?: (ratio: number) => void
    activeFloating: FloatingState | null
    onToggleFloating: (instanceId: string) => void
    onUpdateFloatingRect: (rect: Partial<FloatingState['rect']>) => void
    onToggleFloatingCollapse: () => void
}

const WebViewManager: React.FC<WebViewManagerProps> = ({
    webViews,
    layout,
    activeIds,
    passwordHash,
    recoveryHash,
    isGlobalLocked,
    onUnlockTab,
    splitRatio = 0.5,
    onResizeSplit,
    activeFloating,
    onToggleFloating,
    onUpdateFloatingRect,
    onToggleFloatingCollapse
}) => {
    const lockStatesRef = React.useRef<Record<string, boolean>>({})
    const isResizingRef = React.useRef(false)
    const isDraggingFloating = React.useRef(false)
    const isResizingFloating = React.useRef(false)
    const dragOffset = React.useRef({ x: 0, y: 0 })
    const resizeStart = React.useRef({ x: 0, y: 0, width: 0, height: 0 })

    React.useEffect(() => {
        webViews.forEach(wv => {
            const webview = document.getElementById(`webview-${wv.instanceId}`) as any
            if (webview) {
                const shouldLock = isGlobalLocked || wv.isLocked
                const prevLockState = lockStatesRef.current[wv.instanceId]

                if (shouldLock && !prevLockState) {
                    webview.setAudioMuted(true)
                    webview.executeJavaScript(`
                        (function() {
                            try {
                                const media = document.querySelectorAll('video, audio');
                                media.forEach(m => { if (!m.paused) m.pause(); });
                                const ytPlayer = document.getElementById('movie_player');
                                if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
                                const pauseBtn = document.querySelector('[aria-label="Pause"], [data-testid="control-button-pause"]');
                                if (pauseBtn) pauseBtn.click();
                            } catch(e) {}
                        })()
                    `).catch(() => { })
                } else if (!shouldLock && prevLockState) {
                    webview.setAudioMuted(false)
                }
                lockStatesRef.current[wv.instanceId] = !!shouldLock
            }
        })
    }, [isGlobalLocked, webViews])

    // Layout Resize Logic (Split View) & Floating Logic
    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Split Resize
            if (isResizingRef.current && onResizeSplit) {
                e.preventDefault()
                const width = window.innerWidth
                const titleBarHeight = 38
                if (layout === 'split-h') {
                    const newRatio = e.clientX / width
                    const clamped = Math.min(Math.max(newRatio, 0.2), 0.8)
                    onResizeSplit(clamped)
                } else if (layout === 'split-v') {
                    const relativeY = e.clientY - titleBarHeight
                    const availableHeight = window.innerHeight - titleBarHeight
                    const newRatio = relativeY / availableHeight
                    const clamped = Math.min(Math.max(newRatio, 0.2), 0.8)
                    onResizeSplit(clamped)
                }
            }

            // Floating Drag
            if (isDraggingFloating.current && activeFloating && !activeFloating.isCollapsed) {
                e.preventDefault()
                const newX = e.clientX - dragOffset.current.x
                const newY = e.clientY - dragOffset.current.y
                onUpdateFloatingRect({ x: newX, y: newY })
            }

            // Floating Resize
            if (isResizingFloating.current && activeFloating && !activeFloating.isCollapsed) {
                e.preventDefault()
                const deltaX = e.clientX - resizeStart.current.x
                const deltaY = e.clientY - resizeStart.current.y
                const newWidth = Math.max(300, resizeStart.current.width + deltaX)
                const newHeight = Math.max(200, resizeStart.current.height + deltaY)
                onUpdateFloatingRect({ width: newWidth, height: newHeight })
            }
        }

        const handleMouseUp = () => {
            if (isResizingRef.current || isDraggingFloating.current || isResizingFloating.current) {
                isResizingRef.current = false
                isDraggingFloating.current = false
                isResizingFloating.current = false
                document.body.style.cursor = 'default'
                const overlay = document.getElementById('resize-overlay-blocker');
                if (overlay) overlay.style.display = 'none';
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [layout, onResizeSplit, activeFloating])

    const startResizing = () => {
        isResizingRef.current = true
        document.body.style.cursor = layout === 'split-h' ? 'col-resize' : 'row-resize'
        const overlay = document.getElementById('resize-overlay-blocker');
        if (overlay) overlay.style.display = 'block';
    }

    const startFloatingDrag = (e: React.MouseEvent) => {
        if (!activeFloating) return
        isDraggingFloating.current = true
        dragOffset.current = {
            x: e.clientX - activeFloating.rect.x,
            y: e.clientY - activeFloating.rect.y
        }
        const overlay = document.getElementById('resize-overlay-blocker');
        if (overlay) overlay.style.display = 'block';
    }

    const startFloatingResize = (e: React.MouseEvent) => {
        if (!activeFloating) return
        e.stopPropagation()
        isResizingFloating.current = true
        resizeStart.current = {
            x: e.clientX,
            y: e.clientY,
            width: activeFloating.rect.width,
            height: activeFloating.rect.height
        }
        const overlay = document.getElementById('resize-overlay-blocker');
        if (overlay) overlay.style.display = 'block';
    }

    const getStyleForWebView = (instanceId: string): React.CSSProperties => {
        // Floating Logic
        if (activeFloating && activeFloating.instanceId === instanceId) {
            const { x, y, width, height } = activeFloating.rect
            if (activeFloating.isCollapsed) {
                return {
                    display: 'block',
                    position: 'fixed',
                    zIndex: 2000,
                    right: '20px',
                    bottom: '20px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '30px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    transition: 'all 0.3s ease'
                }
            }
            return {
                display: 'block',
                position: 'fixed',
                zIndex: 2000,
                left: x,
                top: y,
                width: width,
                height: height,
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                animation: 'float-in 0.2s ease-out'
            }
        }

        const slotIndex = activeIds.indexOf(instanceId)
        const isActive = slotIndex !== -1

        const style: React.CSSProperties = {
            display: isActive ? 'block' : 'none',
            position: 'absolute',
            zIndex: isActive ? 10 : 0,
            transform: 'none',
            filter: 'none',
            backdropFilter: 'none',
            opacity: 1,
        }

        if (layout === 'single') {
            style.top = 0; style.left = 0; style.width = '100%'; style.height = '100%'
        } else if (layout === 'split-h') {
            style.top = 0
            style.height = '100%'
            if (slotIndex === 0) {
                style.left = 0
                style.width = `${splitRatio * 100}%`
                style.borderRight = '1px solid var(--border-color)'
            } else {
                style.left = `${splitRatio * 100}%`
                style.width = `${(1 - splitRatio) * 100}%`
            }
        } else if (layout === 'split-v') {
            style.left = 0
            style.width = '100%'
            if (slotIndex === 0) {
                style.top = 0
                style.height = `${splitRatio * 100}%`
                style.borderBottom = '1px solid var(--border-color)'
            } else {
                style.top = `${splitRatio * 100}%`
                style.height = `${(1 - splitRatio) * 100}%`
            }
        }

        return style
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            background: 'linear-gradient(180deg, #ffffff 0%, #bcd9f6ff 100%)',
            filter: 'none',
            transform: 'none'
        }}>
            {/* Blocker overlay for smooth dragging over webviews */}
            <div id="resize-overlay-blocker" style={{
                display: 'none', position: 'absolute', inset: 0, zIndex: 9999, background: 'transparent'
            }} />

            {/* Resize Handle for Split Layout */}
            {!activeFloating && layout === 'split-h' && (
                <div
                    onMouseDown={startResizing}
                    style={{
                        position: 'absolute', left: `calc(${splitRatio * 100}% - 4px)`, top: 0, bottom: 0, width: '8px', cursor: 'col-resize', zIndex: 100
                    }}
                />
            )}
            {!activeFloating && layout === 'split-v' && (
                <div
                    onMouseDown={startResizing}
                    style={{
                        position: 'absolute', top: `calc(${splitRatio * 100}% - 4px)`, left: 0, right: 0, height: '8px', cursor: 'row-resize', zIndex: 100
                    }}
                />
            )}

            {webViews.map((wv) => {
                const isFloating = activeFloating?.instanceId === wv.instanceId
                const isCollapsed = isFloating && activeFloating?.isCollapsed

                return (
                    <div key={wv.instanceId} style={getStyleForWebView(wv.instanceId)} className={isFloating ? "floating-webview" : ""}>
                        {/* Floating Header */}
                        {isFloating && !isCollapsed && (
                            <div
                                onMouseDown={startFloatingDrag}
                                style={{
                                    height: '32px',
                                    background: '#1a1a1a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 8px',
                                    cursor: 'grab',
                                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <span style={{ fontSize: '12px', color: '#999', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {wv.name}
                                </span>
                                <div style={{ display: 'flex', gap: '6px' }} onMouseDown={e => e.stopPropagation()}>
                                    <button className="icon-btn" onClick={onToggleFloatingCollapse} title="Collapse" style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '2px' }}>
                                        <Minimize2 size={14} />
                                    </button>
                                    <button className="icon-btn" onClick={() => onToggleFloating(wv.instanceId)} title="Dock back" style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '2px' }}>
                                        <Maximize2 size={14} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Floating Collapsed View */}
                        {isFloating && isCollapsed && (
                            <div
                                onClick={onToggleFloatingCollapse}
                                style={{ width: '100%', height: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#333' }}
                            >
                                {wv.icon && <img src={wv.icon} style={{ width: '32px', height: '32px', borderRadius: '4px' }} alt="" />}
                            </div>
                        )}

                        <webview
                            id={`webview-${wv.instanceId}`}
                            src={wv.url}
                            partition={wv.partition || 'persist:main'}
                            allowpopups="true"
                            style={{
                                position: 'absolute',
                                top: isFloating && !isCollapsed ? '32px' : 0,
                                left: 0,
                                width: '100%',
                                height: isFloating && !isCollapsed ? 'calc(100% - 32px)' : '100%',
                                border: 'none',
                                opacity: isCollapsed ? 0 : 1,
                                pointerEvents: isCollapsed ? 'none' : 'auto'
                            }}
                        />

                        {/* Floating Resize Handle */}
                        {isFloating && !isCollapsed && (
                            <div
                                onMouseDown={startFloatingResize}
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    bottom: 0,
                                    width: '16px',
                                    height: '16px',
                                    cursor: 'nwse-resize',
                                    zIndex: 20,
                                    background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.1) 50%)'
                                }}
                            />
                        )}

                        <AnimatePresence>
                            {wv.isLocked && !isGlobalLocked && (
                                <AppLockOverlay
                                    hash={passwordHash}
                                    recoveryHash={recoveryHash || ''}
                                    onUnlock={() => onUnlockTab(wv.instanceId)}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                )
            })}
        </div>
    )
}

export default WebViewManager
