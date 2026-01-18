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
    customGrid?: { rows: number, cols: number }
    viewMode?: 'desktop' | 'mobile' | 'tablet'
}

const WebViewManager: React.FC<WebViewManagerProps> = ({
    webViews,
    layout,
    activeIds,
    passwordHash,
    recoveryHash,
    isGlobalLocked,
    onUnlockTab,
    splitRatio,
    onResizeSplit,
    customGrid,
    viewMode = 'desktop'
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

    // Listen for automation events from App.tsx
    React.useEffect(() => {
        const handleReload = (e: any) => {
            const { instanceId } = e.detail
            const webview = document.getElementById(`webview-${instanceId}`) as any
            if (webview && webview.reload) {
                webview.reload()
            }
        }

        const handleScroll = (e: any) => {
            const { instanceId } = e.detail
            const webview = document.getElementById(`webview-${instanceId}`) as any
            if (webview && webview.executeJavaScript) {
                webview.executeJavaScript(`
                    window.scrollBy({
                        top: window.innerHeight / 2,
                        behavior: 'smooth'
                    });
                    // Reset to top if reached bottom
                    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
                        window.scrollTo({ top: 0, behavior: 'instant' });
                    }
                `)
            }
        }

        window.addEventListener('trigger-reload', handleReload)
        window.addEventListener('trigger-scroll', handleScroll)

        return () => {
            window.removeEventListener('trigger-reload', handleReload)
            window.removeEventListener('trigger-scroll', handleScroll)
        }
    }, [])

    // Layout Resize Logic (Split View)
    // Layout Resize Logic (Split View)
    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current || !onResizeSplit) return

            e.preventDefault()

            let ratio
            if (layout === 'split-h') {
                ratio = e.clientX / window.innerWidth
            } else {
                ratio = e.clientY / window.innerHeight
            }

            // Clamp ratio
            ratio = Math.max(0.1, Math.min(0.9, ratio))
            onResizeSplit(ratio)
        }

        const handleMouseUp = () => {
            if (isResizingRef.current) {
                isResizingRef.current = false
                const overlay = document.getElementById('resize-overlay-blocker')
                if (overlay) overlay.style.display = 'none'
                document.body.style.cursor = 'default'
            }
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [layout, onResizeSplit])

    // Auto-Switch Mobile View Logic
    const viewModesRef = React.useRef<Record<string, 'desktop' | 'mobile' | 'tablet'>>({})

    React.useEffect(() => {
        if (layout !== 'split-h' || !splitRatio) return

        webViews.forEach((wv, index) => {
            // Logic: Left tab (0) < 30% OR Right tab (1) > 70% (meaning right width < 30%)
            // Triggers switch to mobile
            let effectiveMode: 'desktop' | 'mobile' | 'tablet' = viewMode

            // Only override if global is desktop (don't override if user explicitly wants tablet/mobile everywhere)
            if (viewMode === 'desktop') {
                if (index === 0 && splitRatio < 0.3) {
                    effectiveMode = 'mobile'
                } else if (index === 1 && splitRatio > 0.7) {
                    effectiveMode = 'mobile'
                }
            }

            const prevMode = viewModesRef.current[wv.instanceId] || 'desktop'

            if (effectiveMode !== prevMode) {
                // Mode changed, update ref and reload
                viewModesRef.current[wv.instanceId] = effectiveMode

                // Only reload if we are not dragging? Or debounced? 
                // Immediate reload might be jarring during drag. 
                // But let's try immediate first as requested "automatically".
                // Ideally we'd wait for drag end, but we don't track drag end state easily here without more state.
                // Assuming user drags and stops. 
                // Actually, if we reload, the webview might flicker.
                // Re-rendering the component below will change the prop.
                // We need to trigger reload manually because just changing prop might not reload page content approriately for some sites.
                const webview = document.getElementById(`webview-${wv.instanceId}`) as any
                if (webview && webview.reload) {
                    webview.reload()
                }
            }
        })
    }, [splitRatio, layout, webViews, viewMode])

    const startResizing = () => {
        isResizingRef.current = true
        document.body.style.cursor = layout === 'split-h' ? 'col-resize' : 'row-resize'
        const overlay = document.getElementById('resize-overlay-blocker');
        if (overlay) overlay.style.display = 'block';
    }

    // DevTools Listener
    React.useEffect(() => {
        const handleOpenDevTools = (_event: any, data: { instanceId: string }) => {
            const webview = document.getElementById(`webview-${data.instanceId}`) as any
            if (webview) {
                if (webview.isDevToolsOpened()) {
                    webview.closeDevTools()
                } else {
                    webview.openDevTools()
                }
            }
        }

        // Listen via window (assuming main process replies to window)
        // Actually, main sends to sender. If sender is renderer window, likely ipcRenderer.
        // We need to verify how we listen in renderer.
        const electronAPI = (window as any).electronAPI
        if (electronAPI && electronAPI.onOpenDevTools) {
            const cleanup = electronAPI.onOpenDevTools(handleOpenDevTools)
            return cleanup
        }

        // Fallback or if using standard window event
        // Note: Electron types for window.api depend on preload. Assuming electronAPI exposes usage.
    }, [])

    const getStyleForWebView = (instanceId: string): React.CSSProperties => {
        const slotIndex = activeIds.indexOf(instanceId)
        const isActive = slotIndex !== -1

        const style: React.CSSProperties = {
            visibility: isActive ? 'visible' : 'hidden',
            position: 'absolute',
            zIndex: isActive ? 10 : 0,
            transform: 'none',
            opacity: isActive ? 1 : 0,
            transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isActive ? 'auto' : 'none',
        }

        if (layout === 'single') {
            style.top = 0; style.left = 0; style.width = '100%'; style.height = '100%'
        } else if (layout === 'split-h') {
            style.top = 0
            style.height = '100%'
            if (slotIndex === 0) {
                style.left = 0
                style.width = `${splitRatio! * 100}%`
                style.borderRight = '1px solid var(--border-color)'
            } else {
                style.left = `${splitRatio! * 100}%`
                style.width = `${(1 - splitRatio!) * 100}%`
            }
        } else if (layout === 'split-v') {
            style.left = 0
            style.width = '100%'
            if (slotIndex === 0) {
                style.top = 0
                style.height = `${splitRatio! * 100}%`
                style.borderBottom = '1px solid var(--border-color)'
            } else {
                style.top = `${splitRatio! * 100}%`
                style.height = `${(1 - splitRatio!) * 100}%`
            }
        } else if (layout === 'grid-2x2') {
            // 2x2 grid (4 cells)
            const cols = 2, rows = 2
            const col = slotIndex % cols
            const row = Math.floor(slotIndex / cols)
            const cellWidth = 100 / cols
            const cellHeight = 100 / rows

            style.left = `${col * cellWidth}%`
            style.top = `${row * cellHeight}%`
            style.width = `${cellWidth}%`
            style.height = `${cellHeight}%`

            if (col < cols - 1) style.borderRight = '1px solid var(--border-color)'
            if (row < rows - 1) style.borderBottom = '1px solid var(--border-color)'
        } else if (layout === 'grid-3x3') {
            // 3x3 grid (9 cells)
            const cols = 3, rows = 3
            const col = slotIndex % cols
            const row = Math.floor(slotIndex / cols)
            const cellWidth = 100 / cols
            const cellHeight = 100 / rows

            style.left = `${col * cellWidth}%`
            style.top = `${row * cellHeight}%`
            style.width = `${cellWidth}%`
            style.height = `${cellHeight}%`

            if (col < cols - 1) style.borderRight = '1px solid var(--border-color)'
            if (row < rows - 1) style.borderBottom = '1px solid var(--border-color)'
        } else if (layout === 'grid-4x4') {
            // 4x4 grid (16 cells)
            const cols = 4, rows = 4
            const col = slotIndex % cols
            const row = Math.floor(slotIndex / cols)
            const cellWidth = 100 / cols
            const cellHeight = 100 / rows

            style.left = `${col * cellWidth}%`
            style.top = `${row * cellHeight}%`
            style.width = `${cellWidth}%`
            style.height = `${cellHeight}%`


            if (col < cols - 1) style.borderRight = '1px solid var(--border-color)'
            if (row < rows - 1) style.borderBottom = '1px solid var(--border-color)'
        } else if (layout === 'grid-mobile-3x4') {
            // Mobile 3x4 grid (12 cells) - 3 columns, 4 rows
            // Each cell should be portrait (9:16 aspect ratio like mobile)
            const cols = 3, rows = 4
            const col = slotIndex % cols
            const row = Math.floor(slotIndex / cols)

            // Calculate cell dimensions to maintain portrait aspect ratio
            // Use 9:16 ratio (mobile portrait)
            const cellWidthPercent = 100 / cols  // ~33.33%
            const aspectRatio = 9 / 16  // width / height
            let cellHeightPercent = (cellWidthPercent / aspectRatio) * (window.innerWidth / window.innerHeight) * 100

            // Scale down if total height exceeds 100%
            const totalHeight = cellHeightPercent * rows
            if (totalHeight > 100) {
                cellHeightPercent *= (100 / totalHeight)
            }

            style.left = `${col * cellWidthPercent}%`
            style.top = `${row * cellHeightPercent}%`
            style.width = `${cellWidthPercent}%`
            style.height = `${cellHeightPercent}%`

            if (col < cols - 1) style.borderRight = '1px solid var(--border-color)'
            if (row < rows - 1) style.borderBottom = '1px solid var(--border-color)'
        } else if (layout === 'grid-mobile-8x3') {
            // Mobile 8x3 grid (24 cells) - 8 columns, 3 rows
            // Each cell should be portrait (9:16 aspect ratio like mobile)
            const cols = 8, rows = 3
            const col = slotIndex % cols
            const row = Math.floor(slotIndex / cols)

            // Calculate cell dimensions to maintain portrait aspect ratio
            const cellWidthPercent = 100 / cols  // 12.5%
            const aspectRatio = 9 / 16  // width / height
            let cellHeightPercent = (cellWidthPercent / aspectRatio) * (window.innerWidth / window.innerHeight) * 100

            // Scale down if total height exceeds 100%
            const totalHeight = cellHeightPercent * rows
            if (totalHeight > 100) {
                cellHeightPercent *= (100 / totalHeight)
            }

            style.left = `${col * cellWidthPercent}%`
            style.top = `${row * cellHeightPercent}%`
            style.width = `${cellWidthPercent}%`
            style.height = `${cellHeightPercent}%`

            if (col < cols - 1) style.borderRight = '1px solid var(--border-color)'
            if (row < rows - 1) style.borderBottom = '1px solid var(--border-color)'
        } else if (layout === 'grid-mobile-8x4') {
            // Mobile 8x4 grid (32 cells) - 8 columns, 4 rows
            // Each cell should be portrait (9:16 aspect ratio like mobile)
            const cols = 8, rows = 4
            const col = slotIndex % cols
            const row = Math.floor(slotIndex / cols)

            // Calculate cell dimensions to maintain portrait aspect ratio
            const cellWidthPercent = 100 / cols  // 25%
            const aspectRatio = 9 / 16  // width / height
            let cellHeightPercent = (cellWidthPercent / aspectRatio) * (window.innerWidth / window.innerHeight) * 100

            // Scale down if total height exceeds 100%
            const totalHeight = cellHeightPercent * rows
            if (totalHeight > 100) {
                cellHeightPercent *= (100 / totalHeight)
            }

            style.left = `${col * cellWidthPercent}%`
            style.top = `${row * cellHeightPercent}%`
            style.width = `${cellWidthPercent}%`
            style.height = `${cellHeightPercent}%`

            if (col < cols - 1) style.borderRight = '1px solid var(--border-color)'
            if (row < rows - 1) style.borderBottom = '1px solid var(--border-color)'
        } else if (layout === 'grid-mobile-4x6') {
            // Mobile 4x6 grid (24 cells) - 4 columns, 6 rows
            // Each cell should be portrait (9:16 aspect ratio like mobile)
            const cols = 4, rows = 6
            const col = slotIndex % cols
            const row = Math.floor(slotIndex / cols)

            // Calculate cell dimensions to maintain portrait aspect ratio
            const cellWidthPercent = 100 / cols  // 25%
            const aspectRatio = 9 / 16  // width / height
            let cellHeightPercent = (cellWidthPercent / aspectRatio) * (window.innerWidth / window.innerHeight) * 100

            // Scale down if total height exceeds 100%
            const totalHeight = cellHeightPercent * rows
            if (totalHeight > 100) {
                cellHeightPercent *= (100 / totalHeight)
            }

            style.left = `${col * cellWidthPercent}%`
            style.top = `${row * cellHeightPercent}%`
            style.width = `${cellWidthPercent}%`
            style.height = `${cellHeightPercent}%`

            if (col < cols - 1) style.borderRight = '1px solid var(--border-color)'
            if (row < rows - 1) style.borderBottom = '1px solid var(--border-color)'
        } else if (layout === 'grid-custom' && customGrid) {
            // Custom grid
            const { cols, rows } = customGrid
            const col = slotIndex % cols
            const row = Math.floor(slotIndex / cols)

            const cellWidth = 100 / cols
            const cellHeight = 100 / rows

            style.left = `${col * cellWidth}%`
            style.top = `${row * cellHeight}%`
            style.width = `${cellWidth}%`
            style.height = `${cellHeight}%`

            if (col < cols - 1) style.borderRight = '1px solid var(--border-color)'
            if (row < rows - 1) style.borderBottom = '1px solid var(--border-color)'
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
            background: '#000',
            overflow: 'hidden'
        }}>
            {/* Blocker overlay for smooth dragging over webviews */}
            <div id="resize-overlay-blocker" style={{
                display: 'none', position: 'absolute', inset: 0, zIndex: 9999, background: 'transparent'
            }} />

            {/* Resize Handle for Split Layout */}
            {layout === 'split-h' && (
                <div
                    onMouseDown={startResizing}
                    style={{
                        position: 'absolute', left: `calc(${splitRatio! * 100}% - 4px)`, top: 0, bottom: 0, width: '8px', cursor: 'col-resize', zIndex: 100
                    }}
                />
            )}
            {layout === 'split-v' && (
                <div
                    onMouseDown={startResizing}
                    style={{
                        position: 'absolute', top: `calc(${splitRatio! * 100}% - 4px)`, left: 0, right: 0, height: '8px', cursor: 'row-resize', zIndex: 100
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
                        // Add ref callback to attach event listeners
                        ref={(el: any) => {
                            if (el) {
                                // Remove old if any (optional, but good practice if ref updates)
                                // el.removeEventListener('context-menu', ...) 

                                // Add context-menu listener
                                el.addEventListener('context-menu', (e: any) => {
                                    e.preventDefault()
                                    const { x, y } = e.params || { x: 0, y: 0 }
                                    // e.params comes from Electron webview event
                                    // Wait, the event structure for 'context-menu' on webview tag:
                                    // event.params: { x, y, linkURL, ... }
                                    // But we need to communicate to main.

                                    const electronAPI = (window as any).electronAPI
                                    if (electronAPI && electronAPI.showContextMenu) {
                                        electronAPI.showContextMenu({
                                            x: x,
                                            y: y,
                                            instanceId: wv.instanceId
                                        })
                                    }
                                })
                            }
                        }}
                        useragent={
                            // Logic duplication for render:
                            // Ideally should extract this to a function or hook result, but inline is fast for now.
                            (() => {
                                if (viewMode !== 'desktop') {
                                    return viewMode === 'mobile'
                                        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
                                        : 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
                                }

                                // Auto-switch override
                                if (layout === 'split-h' && splitRatio) {
                                    // Find index
                                    const index = webViews.findIndex(w => w.instanceId === wv.instanceId)
                                    if (index === 0 && splitRatio < 0.3) {
                                        return 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
                                    }
                                    if (index === 1 && splitRatio > 0.7) {
                                        return 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
                                    }
                                }

                                return undefined // Desktop
                            })()
                        }
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: 'none'
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
