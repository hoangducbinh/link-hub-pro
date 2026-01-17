import { Tool, ToolContext } from '../../types';
import { Pipette } from 'lucide-react';

const toolStates: Record<string, { color: string, sampling: boolean, lastPos: { x: number, y: number } }> = {};

export const colorPickerTool: Tool = {
    id: 'color-picker',
    name: 'Color Picker',
    icon: <Pipette size={18} />,
    description: 'Pick colors from the page',

    onMouseMove: async (e, ctx) => {
        const rect = ctx.containerEl.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);

        if (!toolStates[ctx.webviewId]) {
            toolStates[ctx.webviewId] = { color: 'transparent', sampling: false, lastPos: { x, y } };
        }

        const state = toolStates[ctx.webviewId];
        state.lastPos = { x, y };

        // We can't easily sample pixel from webview directly in real-time mouse move 
        // without heavy performance hit (capturePage is async and somewhat slow).
        // Solution: Capture once on move or use a debounced approach.
        // For now, let's just update the UI helper.
    },

    onMouseDown: async (e, ctx) => {
        const state = toolStates[ctx.webviewId];
        if (!state) return;

        try {
            state.sampling = true;
            const webview = ctx.webviewEl;
            if (webview && webview.capturePage) {
                const image = await webview.capturePage();
                const canvas = document.createElement('canvas');
                const img = new Image();
                img.src = image.toDataURL();

                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const g = canvas.getContext('2d');
                    if (g) {
                        g.drawImage(img, 0, 0);
                        const rect = ctx.containerEl.getBoundingClientRect();

                        // Calculate relative scale if any
                        const scaleX = img.width / rect.width;
                        const scaleY = img.height / rect.height;

                        const pixelX = Math.round((e.clientX - rect.left) * scaleX);
                        const pixelY = Math.round((e.clientY - rect.top) * scaleY);

                        const data = g.getImageData(pixelX, pixelY, 1, 1).data;
                        const hex = `#${((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2]).toString(16).slice(1)}`;
                        state.color = hex;
                        state.sampling = false;

                        // Copy to clipboard
                        navigator.clipboard.writeText(hex);
                    }
                };
            }
        } catch (err) {
            console.error('Color picker failed:', err);
            state.sampling = false;
        }
    },

    onDisable: (ctx) => {
        delete toolStates[ctx.webviewId];
    },

    render: (ctx: ToolContext) => {
        const state = toolStates[ctx.webviewId];
        if (!state || state.color === 'transparent') return null;

        return (
            <div style={{
                position: 'absolute',
                left: state.lastPos.x + 15,
                top: state.lastPos.y + 15,
                backgroundColor: 'rgba(0,0,0,0.85)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                zIndex: 1001
            }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: state.color }} />
                <span>{state.color.toUpperCase()}</span>
                <span style={{ opacity: 0.5, fontSize: '10px' }}>Copied!</span>
            </div>
        );
    }
};
