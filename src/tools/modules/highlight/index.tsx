import { Tool, ToolContext } from '../../types';
import { Highlighter } from 'lucide-react';

interface Point { x: number, y: number }
interface Path { points: Point[], color: string }

const toolStates: Record<string, { paths: Path[], currentPath: Point[] | null, color: string }> = {};

export const highlightTool: Tool = {
    id: 'highlight',
    name: 'Highlight',
    icon: <Highlighter size={18} />,
    description: 'Highlight content with semi-transparent colors',

    onMouseDown: (e, ctx) => {
        const rect = ctx.containerEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (!toolStates[ctx.webviewId]) {
            toolStates[ctx.webviewId] = { paths: [], currentPath: null, color: 'rgba(255, 255, 0, 0.4)' };
        }

        toolStates[ctx.webviewId].currentPath = [{ x, y }];
    },

    onMouseMove: (e, ctx) => {
        const state = toolStates[ctx.webviewId];
        if (!state || !state.currentPath) return;

        const rect = ctx.containerEl.getBoundingClientRect();
        state.currentPath.push({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });

        const canvas = ctx.canvasEl;
        const g = canvas.getContext('2d');
        if (g) {
            g.clearRect(0, 0, canvas.width, canvas.height);

            const drawPath = (p: Path) => {
                if (p.points.length < 2) return;
                g.beginPath();
                g.strokeStyle = p.color;
                g.lineWidth = 15;
                g.lineCap = 'square';
                g.lineJoin = 'round';
                g.moveTo(p.points[0].x, p.points[0].y);
                for (let i = 1; i < p.points.length; i++) {
                    g.lineTo(p.points[i].x, p.points[i].y);
                }
                g.stroke();
            };

            state.paths.forEach(drawPath);
            drawPath({ points: state.currentPath, color: state.color });
        }
    },

    onMouseUp: (_e, ctx) => {
        const state = toolStates[ctx.webviewId];
        if (state && state.currentPath) {
            state.paths.push({ points: state.currentPath, color: state.color });
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

        const colors = [
            'rgba(255, 255, 0, 0.4)', // Yellow
            'rgba(0, 255, 0, 0.4)',   // Green
            'rgba(0, 255, 255, 0.4)', // Cyan
            'rgba(255, 0, 255, 0.4)', // Pink
            'rgba(255, 165, 0, 0.4)'  // Orange
        ];

        return (
            <div style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                display: 'flex',
                gap: '8px',
                backgroundColor: 'rgba(0,0,0,0.85)',
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                pointerEvents: 'auto',
                zIndex: 1002
            }}>
                {colors.map(c => (
                    <div
                        key={c}
                        onClick={() => state.color = c}
                        style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            backgroundColor: c,
                            cursor: 'pointer',
                            border: state.color === c ? '2px solid white' : 'none'
                        }}
                    />
                ))}
            </div>
        );
    }
};
