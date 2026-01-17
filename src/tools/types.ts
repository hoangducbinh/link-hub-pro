import React from 'react';

export interface ToolContext {
    webviewId: string;
    webviewEl: any; // Electron webview element
    containerEl: HTMLDivElement;
    canvasEl: HTMLCanvasElement;
    activeToolIds: string[];
}

export interface Tool {
    id: string;
    name: string;
    icon: React.ReactNode;
    description?: string;
    // Lifecycle
    onEnable?: (context: ToolContext) => void;
    onDisable?: (context: ToolContext) => void;
    // Events
    onMouseDown?: (e: React.MouseEvent, context: ToolContext) => void;
    onMouseMove?: (e: React.MouseEvent, context: ToolContext) => void;
    onMouseUp?: (e: React.MouseEvent, context: ToolContext) => void;
    onKeyDown?: (e: React.KeyboardEvent, context: ToolContext) => void;
    // Rendering
    render?: (context: ToolContext) => React.ReactNode;
}
