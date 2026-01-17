import React, { useState, useEffect } from 'react';
import { Tool, ToolContext } from '../../types';
import { StickyNote as NoteIcon, X } from 'lucide-react';

interface Note {
    id: string;
    text: string;
    x: number;
    y: number;
}

const StoreKey = 'linkhub-notes-v1';

const StickyNotesUI: React.FC<{ url: string }> = ({ url }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [dragState, setDragState] = useState<{ id: string, offsetX: number, offsetY: number } | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem(`${StoreKey}-${url}`);
        if (saved) setNotes(JSON.parse(saved));
    }, [url]);

    const save = (updated: Note[]) => {
        setNotes(updated);
        localStorage.setItem(`${StoreKey}-${url}`, JSON.stringify(updated));
    };

    const addNote = (x: number, y: number) => {
        // Offset so it spawns under cursor better
        const newNote: Note = { id: Date.now().toString(), text: '', x: x - 10, y: y - 10 };
        save([...notes, newNote]);
    };

    const updateNote = (id: string, text: string) => {
        save(notes.map(n => n.id === id ? { ...n, text } : n));
    };

    const deleteNote = (id: string) => {
        save(notes.filter(n => n.id !== id));
    };

    const handleMouseDown = (e: React.MouseEvent, note: Note) => {
        // Don't start drag if clicking textarea (user wants to type)
        if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;

        setDragState({
            id: note.id,
            offsetX: e.clientX - note.x,
            offsetY: e.clientY - note.y
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragState) return;
        const newX = e.clientX - dragState.offsetX;
        const newY = e.clientY - dragState.offsetY;
        setNotes(prev => prev.map(n => n.id === dragState.id ? { ...n, x: newX, y: newY } : n));
    };

    const handleMouseUp = () => {
        if (dragState) {
            save(notes);
            setDragState(null);
        }
    };

    return (
        <div
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <div
                style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}
                onDoubleClick={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    addNote(e.clientX - rect.left, e.clientY - rect.top);
                }}
            />
            {notes.map(note => (
                <div
                    key={note.id}
                    onMouseDown={(e) => handleMouseDown(e, note)}
                    style={{
                        position: 'absolute',
                        left: note.x,
                        top: note.y,
                        width: '200px',
                        minHeight: '100px',
                        backgroundColor: '#fff7ac',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        padding: '10px',
                        borderRadius: '4px',
                        zIndex: 1003,
                        pointerEvents: 'auto',
                        cursor: dragState?.id === note.id ? 'grabbing' : 'move',
                        display: 'flex',
                        flexDirection: 'column',
                        border: '1px solid rgba(0,0,0,0.05)',
                        transition: dragState?.id === note.id ? 'none' : 'transform 0.1s'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
                        <X
                            size={14}
                            style={{ cursor: 'pointer', opacity: 0.5 }}
                            onClick={() => deleteNote(note.id)}
                        />
                    </div>
                    <textarea
                        value={note.text}
                        onChange={(e) => updateNote(note.id, e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()} // Critical: allow text interaction
                        placeholder="Type here..."
                        style={{
                            flex: 1,
                            background: 'none',
                            border: 'none',
                            outline: 'none',
                            resize: 'none',
                            fontSize: '13px',
                            color: '#333',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>
            ))}
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                opacity: 0.7,
                pointerEvents: 'none'
            }}>
                Double click to add a sticky note
            </div>
        </div>
    );
};

export const stickyNoteTool: Tool = {
    id: 'notes',
    name: 'Sticky Notes',
    icon: <NoteIcon size={18} />,
    description: 'Add persistent notes to the page',

    render: (ctx: ToolContext) => {
        // We use a small hack to get the URL from the webview state or similar
        // For now, we'll use a placeholder or try to access it via context if we expanded it.
        // Let's assume we can get it from the webview element.
        const url = ctx.webviewEl?.getURL?.() || 'global';
        return <StickyNotesUI url={url} />;
    }
};
