import React, { useState, useEffect, useRef } from 'react'
import { Check, X } from 'lucide-react'
import { Shortcut } from '../types/Config'

interface ShortcutSectionProps {
    shortcuts: Shortcut[]
    onUpdate: (shortcuts: Shortcut[]) => void
}

const ShortcutSection: React.FC<ShortcutSectionProps> = ({ shortcuts, onUpdate }) => {
    const [recordingId, setRecordingId] = useState<string | null>(null)
    const [recordedKeys, setRecordedKeys] = useState<string[]>([])
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!recordingId) return

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault()
            e.stopPropagation()

            const keys: string[] = []
            if (e.ctrlKey || e.metaKey) keys.push('CommandOrControl')
            if (e.altKey) keys.push('Alt')
            if (e.shiftKey) keys.push('Shift')

            // Avoid adding solo modifiers
            const key = e.key
            if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
                // Map some keys to Electron format
                let electronKey = key
                if (key === ' ') electronKey = 'Space'
                if (key === 'ArrowUp') electronKey = 'Up'
                if (key === 'ArrowDown') electronKey = 'Down'
                if (key === 'ArrowLeft') electronKey = 'Left'
                if (key === 'ArrowRight') electronKey = 'Right'
                if (key.length === 1) electronKey = key.toUpperCase()

                if (!keys.includes(electronKey)) {
                    keys.push(electronKey)
                }
            }

            setRecordedKeys(keys)
        }

        window.addEventListener('keydown', handleKeyDown, true)
        return () => window.removeEventListener('keydown', handleKeyDown, true)
    }, [recordingId])

    const handleStartRecording = (id: string) => {
        setRecordingId(id)
        setRecordedKeys([])
    }

    const handleSaveShortcut = () => {
        if (!recordingId || recordedKeys.length === 0) {
            setRecordingId(null)
            return
        }

        const newShortcuts = shortcuts.map(s =>
            s.id === recordingId ? { ...s, keys: recordedKeys.join('+') } : s
        )
        onUpdate(newShortcuts)
        setRecordingId(null)
    }

    const handleToggleEnabled = (id: string) => {
        const newShortcuts = shortcuts.map(s =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
        )
        onUpdate(newShortcuts)
    }


    return (
        <div className="shortcut-section" ref={containerRef}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: 'white' }}>Keybindings</h3>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                    {recordingId ? 'Recording keys...' : 'Configure your shortcuts'}
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {shortcuts.map(s => (
                    <div
                        key={s.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.06)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: s.enabled ? 'white' : 'rgba(255,255,255,0.4)' }}>
                                    {s.label}
                                </span>
                                {s.isGlobal && (
                                    <span style={{
                                        fontSize: '10px',
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        color: '#3b82f6',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase'
                                    }}>
                                        Global
                                    </span>
                                )}
                            </div>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                                {s.id}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {recordingId === s.id ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <div style={{
                                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #3b82f6',
                                        color: 'white',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        minWidth: '100px',
                                        textAlign: 'center'
                                    }}>
                                        {recordedKeys.length > 0 ? recordedKeys.join(' + ') : 'Type key...'}
                                    </div>
                                    <button
                                        onClick={handleSaveShortcut}
                                        style={{ padding: '6px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' }}
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={() => setRecordingId(null)}
                                        style={{ padding: '6px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer' }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleStartRecording(s.id)}
                                    disabled={!s.enabled}
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: s.enabled ? 'white' : 'rgba(255,255,255,0.2)',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        cursor: s.enabled ? 'pointer' : 'default',
                                        minWidth: '100px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (s.enabled) {
                                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (s.enabled) {
                                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                                        }
                                    }}
                                >
                                    {s.keys || 'None'}
                                </button>
                            )}

                            <div
                                onClick={() => handleToggleEnabled(s.id)}
                                style={{
                                    width: '36px',
                                    height: '20px',
                                    backgroundColor: s.enabled ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                <div style={{
                                    width: '14px',
                                    height: '14px',
                                    backgroundColor: 'white',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: '3px',
                                    left: s.enabled ? '19px' : '3px',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ShortcutSection
