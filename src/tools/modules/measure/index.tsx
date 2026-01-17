import React from 'react';
import { Tool, ToolContext } from '../../types';
import { Ruler } from 'lucide-react';

// Simple global state for the tool instances (keyed by webviewId)
const toolState: Record<string, { start?: { x: number, y: number }, current?: { x: number, y: number } }> = {};

export const measureTool: Tool = {
    id: 'measure',
    name: 'Measure',
    icon: <Ruler size={18} />,
    description: 'Measure distances on the page',

    onMouseDown: (e, ctx) => {
        const rect = ctx.containerEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        toolState[ctx.webviewId] = { start: { x, y }, current: { x, y } };
    },

    onMouseMove: (e, ctx) => {
        const state = toolState[ctx.webviewId];
        if (!state || !state.start) return;

        const rect = ctx.containerEl.getBoundingClientRect();
        state.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        requestAnimationFrame(() => {
            const canvas = ctx.canvasEl;
            const g = canvas.getContext('2d');
            if (g && state.current) {
                g.clearRect(0, 0, canvas.width, canvas.height);
                g.beginPath();
                g.setLineDash([5, 5]);
                g.strokeStyle = '#3b82f6';
                g.lineWidth = 2;
                g.moveTo(state.start!.x, state.start!.y);
                g.lineTo(state.current.x, state.current.y);
                g.stroke();

                // Draw rectangle helper
                g.setLineDash([]);
                g.strokeStyle = 'rgba(59, 130, 246, 0.2)';
                g.strokeRect(
                    Math.min(state.start!.x, state.current.x),
                    Math.min(state.start!.y, state.current.y),
                    Math.abs(state.current.x - state.start!.x),
                    Math.abs(state.current.y - state.start!.y)
                );
            }
        });
    },

    onMouseUp: (e, ctx) => {
        // Clear or keep? User usually wants to see the result.
        // For now, let's keep it until they click again.
    },

    onDisable: (ctx) => {
        delete toolState[ctx.webviewId];
        const g = ctx.canvasEl.getContext('2d');
        if (g) g.clearRect(0, 0, ctx.canvasEl.width, ctx.canvasEl.height);
    },

    render: (ctx: ToolContext) => {
        const state = toolState[ctx.webviewId];
        if (!state || !state.start || !state.current) return null;

        const width = Math.abs(state.current.x - state.start.x);
        const height = Math.abs(state.current.y - state.start.y);
        const distance = Math.sqrt(width * width + height * height);

        return (
            <div style={{
                position: 'absolute',
                left: state.current.x + 10,
                top: state.current.y + 10,
                backgroundColor: 'rgba(0,0,0,0.85)',
                color: 'white',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontFamily: 'monospace',
                zIndex: 1001,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
            }}>
                <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>Measure</div>
                <div>W: {Math.round(width)}px</div>
                <div>H: {Math.round(height)}px</div>
                <div style={{ opacity: 0.6, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px', marginTop: '4px' }}>
                    D: {Math.round(distance)}px
                </div>
            </div>
        );
    }
};
