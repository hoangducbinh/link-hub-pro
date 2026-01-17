import React, { useRef, useEffect, useState } from 'react';
import { ToolContext, registry } from '../tools';

interface ToolOverlayProps {
    webviewId: string;
    activeToolIds: string[];
}

const ToolOverlay: React.FC<ToolOverlayProps> = ({ webviewId, activeToolIds }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [context, setContext] = useState<ToolContext | null>(null);

    useEffect(() => {
        const webviewEl = document.getElementById(`webview-${webviewId}`);
        if (containerRef.current && canvasRef.current && webviewEl) {
            setContext({
                webviewId,
                webviewEl,
                containerEl: containerRef.current,
                canvasEl: canvasRef.current,
                activeToolIds
            });
        }
    }, [webviewId, activeToolIds]);

    // Handle Resize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current && canvasRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                canvasRef.current.width = width;
                canvasRef.current.height = height;
            }
        };

        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, [context]);

    const handleMouseEvent = (e: React.MouseEvent, type: 'onMouseDown' | 'onMouseMove' | 'onMouseUp') => {
        if (!context) return;
        activeToolIds.forEach(id => {
            const tool = registry.getTool(id);
            if (tool && tool[type]) {
                tool[type]!(e, context);
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
                pointerEvents: activeToolIds.length > 0 ? 'auto' : 'none',
                zIndex: 100,
                overflow: 'hidden'
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                }}
            />
            {context && activeToolIds.map(toolId => {
                const tool = registry.getTool(toolId);
                return tool?.render ? (
                    <div
                        key={toolId}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none' // Allow events to pass through to the overlay div
                        }}
                    >
                        {tool.render(context)}
                    </div>
                ) : null;
            })}
        </div>
    );
};

export default ToolOverlay;
