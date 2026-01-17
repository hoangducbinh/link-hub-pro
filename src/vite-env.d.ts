/// <reference types="vite/client" />

interface ElectronAPI {
    onToggleLauncher: (callback: () => void) => () => void
    minimize: () => void
    maximize: () => void
    close: () => void
}

interface Window {
    electronAPI: ElectronAPI
}

declare namespace JSX {
    interface IntrinsicElements {
        webview: any
    }
}
