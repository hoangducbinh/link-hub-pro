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
}

const WebViewManager: React.FC<WebViewManagerProps> = ({ webViews, layout, activeIds, passwordHash, recoveryHash, isGlobalLocked, onUnlockTab }) => {
    const lockStatesRef = React.useRef<Record<string, boolean>>({})

    React.useEffect(() => {
        webViews.forEach(wv => {
            const webview = document.getElementById(`webview-${wv.instanceId}`) as any
            if (webview) {
                const shouldLock = isGlobalLocked || wv.isLocked
                const prevLockState = lockStatesRef.current[wv.instanceId]

                if (shouldLock && !prevLockState) {
                    // Transition: Unlocked -> Locked
                    webview.setAudioMuted(true)
                    // Attempt to pause media
                    webview.executeJavaScript(`
                        (function() {
                            try {
                                const media = document.querySelectorAll('video, audio');
                                media.forEach(m => { if (!m.paused) m.pause(); });
                                
                                // YouTube player API
                                const ytPlayer = document.getElementById('movie_player');
                                if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
                                
                                // Generic buttons (Spotify etc)
                                const pauseBtn = document.querySelector('[aria-label="Pause"], [data-testid="control-button-pause"]');
                                if (pauseBtn) pauseBtn.click();
                            } catch(e) {}
                        })()
                    `).catch(() => { })
                } else if (!shouldLock && prevLockState) {
                    // Transition: Locked -> Unlocked
                    webview.setAudioMuted(false)
                }

                // Update ref
                lockStatesRef.current[wv.instanceId] = !!shouldLock
            }
        })
    }, [isGlobalLocked, webViews])

    const getStyleForWebView = (instanceId: string): React.CSSProperties => {
        const slotIndex = activeIds.indexOf(instanceId)
        const isActive = slotIndex !== -1

        // Determine layout styles
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
            style.width = '50%'; style.height = '100%'; style.top = 0
            style.left = slotIndex === 0 ? 0 : '50%'
            style.borderRight = slotIndex === 0 ? '1px solid var(--border-color)' : 'none'
        } else if (layout === 'split-v') {
            style.width = '100%'; style.height = '50%'; style.left = 0
            style.top = slotIndex === 0 ? 0 : '50%'
            style.borderBottom = slotIndex === 0 ? '1px solid var(--border-color)' : 'none'
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
