import React from 'react'
import AppLockOverlay from './AppLockOverlay'
import { AnimatePresence } from 'framer-motion'

export interface WebViewInfo {
    instanceId: string
    appId: string
    url: string
    name: string
    icon?: string
    partition?: string
    isLocked?: boolean
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
    onResizeSplit
}) => {
    const lockStatesRef = React.useRef<Record<string, boolean>>({})
    const isResizingRef = React.useRef(false)

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

    // Resize Logic
    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current || !onResizeSplit) return
            e.preventDefault() // prevent selection

            const width = window.innerWidth
            // Titlebar usually ~40px. clientY starts from 0 at top of window.
            // Our WebViewManager starts at top:0 of main-content (which is flex:1 below titlebar).
            // Actually WebViewManager is fixed/absolute in main-content.
            // Let's assume full window coords for simplicity or adjust based on container.

            // To be precise:
            // We need relative position to the container. But here we can just use percentage of window for now
            // or better, percentage of the container size.
            // Since WebViewManager takes full available space below TitleBar:

            // Let's get container dimensions? changing state inside mousemove is expensive if we query DOM.
            // We'll trust window.innerWidth/Height for now as a simplified approach, 
            // OR we can assume top offset.

            const titleBarHeight = 38 // Approximate

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

        const handleMouseUp = () => {
            isResizingRef.current = false
            document.body.style.cursor = 'default'
            // Re-enable pointer events on webviews if we disabled them during drag (optional optimization)
            const overlay = document.getElementById('resize-overlay-blocker');
            if (overlay) overlay.style.display = 'none';
        }

        if (layout.startsWith('split')) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [layout, onResizeSplit])

    const startResizing = () => {
        isResizingRef.current = true
        document.body.style.cursor = layout === 'split-h' ? 'col-resize' : 'row-resize'
        // Create/Show a transparent overlay to capture events over iframes/webviews
        const overlay = document.getElementById('resize-overlay-blocker');
        if (overlay) overlay.style.display = 'block';
    }

    const getStyleForWebView = (instanceId: string): React.CSSProperties => {
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

            {/* Resize Handle */}
            {layout === 'split-h' && (
                <div
                    onMouseDown={startResizing}
                    style={{
                        position: 'absolute',
                        left: `calc(${splitRatio * 100}% - 4px)`,
                        top: 0,
                        bottom: 0,
                        width: '8px',
                        cursor: 'col-resize',
                        zIndex: 100,
                        // Debug color: backgroundColor: 'rgba(255,0,0,0.5)'
                    }}
                />
            )}
            {layout === 'split-v' && (
                <div
                    onMouseDown={startResizing}
                    style={{
                        position: 'absolute',
                        top: `calc(${splitRatio * 100}% - 4px)`,
                        left: 0,
                        right: 0,
                        height: '8px',
                        cursor: 'row-resize',
                        zIndex: 100,
                    }}
                />
            )}

            {webViews.map((wv) => (
                <div key={wv.instanceId} style={getStyleForWebView(wv.instanceId)}>
                    <webview
                        id={`webview-${wv.instanceId}`}
                        src={wv.url}
                        partition={wv.partition || 'persist:main'}
                        allowpopups="true"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: 'none',
                        }}
                    />
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
            ))}
        </div>
    )
}

export default WebViewManager
