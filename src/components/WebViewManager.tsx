import React from 'react'

export interface WebViewInfo {
    id: string
    url: string
}

interface WebViewManagerProps {
    webViews: WebViewInfo[]
    layout: string // 'single', 'split-h', 'split-v'
    activeIds: string[] // List of IDs to show in order of panes
}

const WebViewManager: React.FC<WebViewManagerProps> = ({ webViews, layout, activeIds }) => {
    // We keep ALL webviews in the DOM to preserve state, 
    // but only some are assigned to "slots" in the layout.

    const getStyleForWebView = (wvId: string) => {
        const slotIndex = activeIds.indexOf(wvId)

        // If not in a slot, hide it
        if (slotIndex === -1) {
            return {
                display: 'none',
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
            } as React.CSSProperties
        }

        // Determine layout styles
        const style: React.CSSProperties = {
            display: 'flex',
            position: 'absolute',
            border: activeIds.length > 1 ? '1px solid #333' : 'none',
            backgroundColor: '#000',
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
                    key={wv.id}
                    id={`webview-${wv.id}`}
                    src={wv.url}
                    style={getStyleForWebView(wv.id)}
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
