import { Menu, MenuItemConstructorOptions, BrowserWindow, clipboard, WebContents, webContents } from 'electron'

export function buildContextMenu(
    params: Electron.ContextMenuParams & { instanceId: string, webContentsId?: number },
    hostWebContents: WebContents
): Menu {
    const template: MenuItemConstructorOptions[] = []

    // Resolve target content: either the guest webview (if ID provided) or the host (fallback)
    // Note: hostWebContents is the Renderer (App), params.webContentsId is the Webview (Guest)
    let targetContents = hostWebContents
    if (params.webContentsId) {
        const guest = webContents.fromId(params.webContentsId)
        if (guest) targetContents = guest
    }

    const hasSelection = params.selectionText.trim().length > 0
    const isEditable = params.isEditable
    const hasLink = params.linkURL.length > 0
    const hasImage = params.mediaType === 'image' && params.srcURL.length > 0

    // --- Edit Actions ---
    if (isEditable) {
        template.push(
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'pasteAndMatchStyle' },
            { role: 'selectAll' },
            { type: 'separator' }
        )
    } else if (hasSelection) {
        template.push(
            { role: 'copy' },
            {
                label: `Search Google for "${params.selectionText.length > 25 ? params.selectionText.substring(0, 25) + '...' : params.selectionText}"`,
                click: () => {
                    const url = `https://www.google.com/search?q=${encodeURIComponent(params.selectionText)}`
                    // Open New Tab - This must be handled by HOST (Renderer)
                    const win = BrowserWindow.fromWebContents(hostWebContents)
                    win?.webContents.send('trigger-new-tab', url)
                }
            },
            { type: 'separator' }
        )
    }

    // --- Link Actions ---
    if (hasLink) {
        template.push(
            {
                label: 'Open Link in New Tab',
                click: () => {
                    // Host Action
                    const win = BrowserWindow.fromWebContents(hostWebContents)
                    win?.webContents.send('trigger-new-tab', params.linkURL)
                }
            },
            { type: 'separator' },
            {
                label: 'Copy Link Address',
                click: () => {
                    clipboard.writeText(params.linkURL)
                }
            },
            { type: 'separator' }
        )
    }

    // --- Image Actions ---
    if (hasImage) {
        template.push(
            {
                label: 'Open Image in New Tab',
                click: () => {
                    // Host Action
                    const win = BrowserWindow.fromWebContents(hostWebContents)
                    win?.webContents.send('trigger-new-tab', params.srcURL)
                }
            },
            {
                label: 'Save Image As...',
                click: () => {
                    // Download can happen on guest or host.
                    // If guest handles it, it might trigger session download handler?
                    // Safe to use targetContents here.
                    targetContents.downloadURL(params.srcURL)
                }
            },
            {
                label: 'Copy Image',
                click: () => {
                    // Must be done on GUEST contents to access the image data/bitmap
                    targetContents.copyImageAt(params.x, params.y)
                }
            },
            {
                label: 'Copy Image Address',
                click: () => {
                    clipboard.writeText(params.srcURL)
                }
            },
            { type: 'separator' }
        )
    }

    // --- Page Actions (Nav) ---
    if (!isEditable) {
        const navTemplate: MenuItemConstructorOptions[] = [
            {
                label: 'Back',
                enabled: targetContents.canGoBack(),
                click: () => targetContents.goBack()
            },
            {
                label: 'Forward',
                enabled: targetContents.canGoForward(),
                click: () => targetContents.goForward()
            },
            {
                label: 'Reload',
                click: () => targetContents.reload()
            },
            { type: 'separator' }
        ]

        if (!hasSelection) {
            template.push(...navTemplate)
        }
    }

    // --- Inspect ---
    template.push({
        label: 'Inspect Element',
        click: () => {
            // Native inspection on the target contents
            if (targetContents.id !== hostWebContents.id) {
                // It's a guest
                targetContents.inspectElement(params.x, params.y)
            } else {
                // Fallback to IPC if somehow we failed to get guest contents?
                // Or just use host inspection (which the user dislikes).
                // We should try to use the guest inspection.
                // The previous IPC fix was because we couldn't get guest contents here.
                // Now that we can, we can call directly!
                // BUT: inspectElement on a guest WebContents might open a new DevTools window
                // detached from the UI if not configured properly?
                // Let's stick to the direct call first, as it's cleaner.
                targetContents.inspectElement(params.x, params.y)
            }
        }
    })

    return Menu.buildFromTemplate(template)
}
