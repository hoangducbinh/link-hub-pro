import React from 'react'

export interface WebViewInfo {
    instanceId: string
    appId: string
    url: string
    name: string
    icon?: string
    partition?: string
}

interface WebViewManagerProps {
    webViews: WebViewInfo[]
    layout: string
    activeIds: string[]
}

const WebViewManager: React.FC<WebViewManagerProps> = ({ webViews, layout, activeIds }) => {

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
                </div>
            ))}
        </div>
    )
}

export default WebViewManager
