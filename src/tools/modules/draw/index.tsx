import React from 'react';
import { Tool, ToolContext } from '../../types';
import { Pencil } from 'lucide-react';

interface Point { x: number, y: number }
interface Path { points: Point[], color: string, width: number }

const toolStates: Record<string, { paths: Path[], currentPath: Point[] | null, color: string, width: number }> = {};

export const drawTool: Tool = {
    id: 'draw',
    name: 'Draw',
    icon: <Pencil size={18} />,
    description: 'Draw directly on the screen overlay',

    onEnable: (ctx) => {
        const state = toolStates[ctx.webviewId];
        if (state && state.paths.length > 0) {
            const g = ctx.canvasEl.getContext('2d');
            if (g) {
                g.clearRect(0, 0, ctx.canvasEl.width, ctx.canvasEl.height);
                state.paths.forEach(p => {
                    if (p.points.length < 2) return;
                    g.beginPath();
                    g.strokeStyle = p.color;
                    g.lineWidth = p.width;
                    g.lineCap = 'round';
                    g.lineJoin = 'round';
                    g.moveTo(p.points[0].x, p.points[0].y);
                    for (let i = 1; i < p.points.length; i++) {
                        g.lineTo(p.points[i].x, p.points[i].y);
                    }
                    g.stroke();
                });
            }
        }
    },

    onMouseDown: (e, ctx) => {
        const rect = ctx.containerEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (!toolStates[ctx.webviewId]) {
            toolStates[ctx.webviewId] = { paths: [], currentPath: null, color: '#ff4444', width: 3 };
        }

        toolStates[ctx.webviewId].currentPath = [{ x, y }];
    },

    onMouseMove: (e, ctx) => {
        const state = toolStates[ctx.webviewId];
        if (!state || !state.currentPath) return;

        const rect = ctx.containerEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        state.currentPath.push({ x, y });

        // Use requestAnimationFrame for smooth drawing
        requestAnimationFrame(() => {
            const canvas = ctx.canvasEl;
            const g = canvas.getContext('2d');
            if (g && state.currentPath) {
                g.clearRect(0, 0, canvas.width, canvas.height);

                const drawPath = (p: Path) => {
                    if (p.points.length < 2) return;
                    g.beginPath();
                    g.strokeStyle = p.color;
                    g.lineWidth = p.width;
                    g.lineCap = 'round';
                    g.lineJoin = 'round';
                    g.moveTo(p.points[0].x, p.points[0].y);
                    for (let i = 1; i < p.points.length; i++) {
                        g.lineTo(p.points[i].x, p.points[i].y);
                    }
                    g.stroke();
                };

                state.paths.forEach(drawPath);
                drawPath({ points: state.currentPath, color: state.color, width: state.width });
            }
        });
    },

    onMouseUp: (e, ctx) => {
        const state = toolStates[ctx.webviewId];
        if (state && state.currentPath) {
            state.paths.push({ points: state.currentPath, color: state.color, width: state.width });
            state.currentPath = null;
        }
    },

    onDisable: (ctx) => {
        delete toolStates[ctx.webviewId];
        const g = ctx.canvasEl.getContext('2d');
        if (g) g.clearRect(0, 0, ctx.canvasEl.width, ctx.canvasEl.height);
    },

    render: (ctx: ToolContext) => {
        const state = toolStates[ctx.webviewId];
        if (!state) return null;

        return (
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                display: 'flex',
                gap: '8px',
                backgroundColor: 'rgba(0,0,0,0.85)',
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                pointerEvents: 'auto',
                zIndex: 1002
            }}>
                {['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ffffff'].map(c => (
                    <div
                        key={c}
                        onClick={() => state.color = c}
                        style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: c,
                            cursor: 'pointer',
                            border: state.color === c ? '2px solid white' : 'none'
                        }}
                    />
                ))}
                <div
                    style={{ marginLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '8px', color: 'white', fontSize: '12px', cursor: 'pointer' }}
                    onClick={() => {
                        state.paths = [];
                        const g = ctx.canvasEl.getContext('2d');
                        if (g) g.clearRect(0, 0, ctx.canvasEl.width, ctx.canvasEl.height);
                    }}
                >
                    Clear
                </div>
            </div>
        );
    }
};
