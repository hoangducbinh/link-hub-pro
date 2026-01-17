import React from 'react'

export interface WebViewInfo {
    instanceId: string;
    appId: string;
    url: string;
    name: string;
    partition?: string;
    screenshot?: string;
}

interface WebViewManagerProps {
    webViews: WebViewInfo[]
    layout: string
    activeIds: string[] // List of instanceIds
}

const WebViewManager: React.FC<WebViewManagerProps> = ({ webViews, layout, activeIds }) => {
    // We keep ALL webviews in the DOM to preserve state, 
    // but only some are assigned to "slots" in the layout.

    const getStyleForWebView = (instanceId: string) => {
        const slotIndex = activeIds.indexOf(instanceId)

        // If not in a slot, hide it visually but keep it "active" for capture
        if (slotIndex === -1) {
            return {
                opacity: 0,
                pointerEvents: 'none',
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: -1,
            } as React.CSSProperties
        }

        // Determine layout styles
        const style: React.CSSProperties = {
            display: 'flex',
            position: 'absolute',
            border: activeIds.length > 1 ? '1px solid #333' : 'none',
            backgroundColor: '#000',
            zIndex: 1,
        }

        if (layout === 'single') {
            style.top = 0; style.left = 0; style.width = '100%'; style.height = '100%'
        } else if (layout === 'split-h') {
            style.width = '50%'; style.height = '100%'; style.top = 0
            style.left = slotIndex === 0 ? 0 : '50%'
        } else if (layout === 'split-v') {
            style.width = '100%'; style.height = '50%'; style.left = 0
            style.top = slotIndex === 0 ? 0 : '50%'
        }

        return style
    }

    return (
        <div className="webview-container" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            {webViews.map((wv) => (
                <webview
                    key={wv.instanceId}
                    id={`webview-${wv.instanceId}`}
                    src={wv.url}
                    style={getStyleForWebView(wv.instanceId)}
                    partition={wv.partition || 'persist:main'}
                    allowpopups="true"
                />
            ))}
            {activeIds.length === 0 && (
                <div className="empty-state" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
                    Please open a website from the Launcher (Cmd+O)
                </div>
            )}
        </div>
    )
}

export default WebViewManager
