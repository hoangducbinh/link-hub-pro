import { Tool } from '../../types';
import { Camera } from 'lucide-react';

const toolStates: Record<string, { start?: { x: number, y: number }, current?: { x: number, y: number }, capturing: boolean }> = {};

export const screenshotTool: Tool = {
    id: 'screenshot',
    name: 'Area Capture',
    icon: <Camera size={18} />,
    description: 'Capture a selected area',

    onMouseDown: (e, ctx) => {
        const rect = ctx.containerEl.getBoundingClientRect();
        toolStates[ctx.webviewId] = {
            start: { x: e.clientX - rect.left, y: e.clientY - rect.top },
            current: { x: e.clientX - rect.left, y: e.clientY - rect.top },
            capturing: false
        };
    },

    onMouseMove: (e, ctx) => {
        const state = toolStates[ctx.webviewId];
        if (!state || !state.start || state.capturing) return;

        const rect = ctx.containerEl.getBoundingClientRect();
        state.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

        const canvas = ctx.canvasEl;
        const g = canvas.getContext('2d');
        if (g) {
            g.clearRect(0, 0, canvas.width, canvas.height);

            const x = Math.min(state.start.x, state.current.x);
            const y = Math.min(state.start.y, state.current.y);
            const w = Math.abs(state.current.x - state.start.x);
            const h = Math.abs(state.current.y - state.start.y);

            // Dim everything else
            g.fillStyle = 'rgba(0,0,0,0.3)';
            g.fillRect(0, 0, canvas.width, canvas.height);

            // Clear the selection area
            g.clearRect(x, y, w, h);

            // Draw border
            g.strokeStyle = '#3b82f6';
            g.lineWidth = 2;
            g.strokeRect(x, y, w, h);
        }
    },

    onMouseUp: async (_e, ctx) => {
        const state = toolStates[ctx.webviewId];
        if (!state || !state.start || !state.current) return;

        const x = Math.min(state.start.x, state.current.x);
        const y = Math.min(state.start.y, state.current.y);
        const w = Math.abs(state.current.x - state.start.x);
        const h = Math.abs(state.current.y - state.start.y);

        if (w < 10 || h < 10) return;

        state.capturing = true;

        try {
            const image = await ctx.webviewEl.capturePage();
            const canvas = document.createElement('canvas');
            const img = new Image();
            img.src = image.toDataURL();

            img.onload = () => {
                const rect = ctx.containerEl.getBoundingClientRect();
                const scaleX = img.width / rect.width;
                const scaleY = img.height / rect.height;

                canvas.width = w * scaleX;
                canvas.height = h * scaleY;
                const g = canvas.getContext('2d');
                if (g) {
                    // 1. Draw the underlying website
                    g.drawImage(img, x * scaleX, y * scaleY, w * scaleX, h * scaleY, 0, 0, w * scaleX, h * scaleY);

                    // 2. Overlay other tool layers (Draw, Highlight, Measure, etc.)
                    // We look for all canvases in the container that are NOT the current screenshot selection canvas
                    const allCanvases = ctx.containerEl.querySelectorAll('canvas');
                    allCanvases.forEach(otherCanvas => {
                        if (otherCanvas !== ctx.canvasEl) {
                            g.drawImage(
                                otherCanvas as HTMLCanvasElement,
                                x, y, w, h, // source (screen coords)
                                0, 0, w * scaleX, h * scaleY // destination (pixel coords)
                            );
                        }
                    });

                    // Copy to clipboard
                    canvas.toBlob(blob => {
                        if (blob) {
                            const item = new ClipboardItem({ 'image/png': blob });
                            navigator.clipboard.write([item]);
                        }
                    });

                    // Cleanup
                    const mainG = ctx.canvasEl.getContext('2d');
                    if (mainG) mainG.clearRect(0, 0, ctx.canvasEl.width, ctx.canvasEl.height);
                    delete toolStates[ctx.webviewId];
                }
            };
        } catch (err) {
            console.error('Screenshot failed:', err);
            state.capturing = false;
        }
    },

    onDisable: (ctx) => {
        delete toolStates[ctx.webviewId];
        const g = ctx.canvasEl.getContext('2d');
        if (g) g.clearRect(0, 0, ctx.canvasEl.width, ctx.canvasEl.height);
    }
};
