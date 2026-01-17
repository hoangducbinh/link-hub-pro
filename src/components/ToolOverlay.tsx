import React, { useRef, useEffect, useState } from 'react';
import { ToolContext, registry } from '../tools';

interface ToolOverlayProps {
    webviewId: string;
    activeToolIds: string[];
}

const ToolOverlay: React.FC<ToolOverlayProps> = ({ webviewId, activeToolIds }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRefs = useRef<Record<string, HTMLCanvasElement>>({});
    const [webviewEl, setWebviewEl] = useState<any>(null);

    useEffect(() => {
        setWebviewEl(document.getElementById(`webview-${webviewId}`));
    }, [webviewId]);

    // Update canvas sizes on resize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                Object.values(canvasRefs.current).forEach(canvas => {
                    if (canvas) {
                        canvas.width = width;
                        canvas.height = height;
                    }
                });
            }
        };

        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, [activeToolIds, webviewEl]);

    const getToolContext = (toolId: string): ToolContext | null => {
        const canvas = canvasRefs.current[toolId];
        if (!containerRef.current || !canvas || !webviewEl) return null;
        return {
            webviewId,
            webviewEl,
            containerEl: containerRef.current,
            canvasEl: canvas,
            activeToolIds
        };
    };

    const handleMouseEvent = (e: React.MouseEvent, type: 'onMouseDown' | 'onMouseMove' | 'onMouseUp') => {
        activeToolIds.forEach(id => {
            const tool = registry.getTool(id);
            if (tool && tool[type]) {
                const ctx = getToolContext(id);
                if (ctx) tool[type]!(e, ctx);
            }
        });
    };

    if (activeToolIds.length === 0) return null;

    return (
        <div
            ref={containerRef}
            className="tool-overlay"
            onMouseDown={(e) => handleMouseEvent(e, 'onMouseDown')}
            onMouseMove={(e) => handleMouseEvent(e, 'onMouseMove')}
            onMouseUp={(e) => handleMouseEvent(e, 'onMouseUp')}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
                zIndex: 100,
                overflow: 'hidden'
            }}
        >
            {/* Render a dedicated canvas for each active tool */}
            {activeToolIds.map(toolId => (
                <canvas
                    key={toolId}
                    ref={el => { if (el) canvasRefs.current[toolId] = el; }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                    }}
                />
            ))}

            {/* Render any UI elements from tools */}
            {activeToolIds.map(toolId => {
                const tool = registry.getTool(toolId);
                const ctx = getToolContext(toolId);
                return tool?.render && ctx ? (
                    <div
                        key={`ui-${toolId}`}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none'
                        }}
                    >
                        {tool.render(ctx)}
                    </div>
                ) : null;
            })}
        </div>
    );
};

export default ToolOverlay;
