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

const StickyNotesUI: React.FC<{ _webviewId: string, url: string }> = ({ _webviewId, url }) => {
    const [notes, setNotes] = useState<Note[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem(`${StoreKey}-${url}`);
        if (saved) setNotes(JSON.parse(saved));
    }, [url]);

    const save = (updated: Note[]) => {
        setNotes(updated);
        localStorage.setItem(`${StoreKey}-${url}`, JSON.stringify(updated));
    };

    const addNote = (x: number, y: number) => {
        const newNote: Note = { id: Date.now().toString(), text: '', x, y };
        save([...notes, newNote]);
    };

    const updateNote = (id: string, text: string) => {
        save(notes.map(n => n.id === id ? { ...n, text } : n));
    };

    const deleteNote = (id: string) => {
        save(notes.filter(n => n.id !== id));
    };

    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
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
                        cursor: 'move',
                        display: 'flex',
                        flexDirection: 'column'
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
                opacity: 0.7
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
        return <StickyNotesUI _webviewId={ctx.webviewId} url={url} />;
    }
};
