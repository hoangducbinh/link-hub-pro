import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Folder, File, Download, CheckCircle, AlertCircle, Clock, Trash2, Eraser } from 'lucide-react'

export interface DownloadItem {
    id: string
    name: string
    url: string
    totalBytes: number
    receivedBytes: number
    state: 'downloading' | 'completed' | 'failed' | 'cancelled'
    path: string
    startTime: number
    fileExists?: boolean
}

interface DownloadManagerProps {
    isOpen: boolean
    onClose: () => void
    downloads: DownloadItem[]
    onRemoveItem: (id: string) => void
    onClearHistory: () => void
}

const DownloadManager: React.FC<DownloadManagerProps> = ({ isOpen, onClose, downloads, onRemoveItem, onClearHistory }) => {
    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const getProgress = (item: DownloadItem) => {
        if (item.totalBytes === 0) return 0
        return Math.round((item.receivedBytes / item.totalBytes) * 100)
    }

    const sortedDownloads = [...downloads].sort((a, b) => b.startTime - a.startTime)

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100010,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'flex-end',
                        padding: '24px',
                        pointerEvents: 'none'
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            width: '400px',
                            maxHeight: '520px',
                            backgroundColor: 'rgba(26, 26, 26, 0.85)',
                            backdropFilter: 'blur(20px) saturate(180%)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '24px',
                            boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.6)',
                            display: 'flex',
                            flexDirection: 'column',
                            pointerEvents: 'auto',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '18px 20px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '10px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Download size={18} color="#3b82f6" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', margin: 0 }}>Downloads</h3>
                                    <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
                                        {downloads.filter(d => d.state === 'downloading').length} active • {downloads.length} total
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {downloads.length > 0 && (
                                    <button
                                        onClick={onClearHistory}
                                        title="Clear finished downloads"
                                        style={{
                                            padding: '8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                            border: 'none',
                                            borderRadius: '10px',
                                            color: 'rgba(255, 255, 255, 0.4)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
                                            e.currentTarget.style.color = '#ef4444'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'
                                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'
                                        }}
                                    >
                                        <Eraser size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    style={{
                                        padding: '8px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                        border: 'none',
                                        borderRadius: '10px',
                                        color: 'rgba(255, 255, 255, 0.4)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
                                        e.currentTarget.style.color = 'white'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'
                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '12px', gap: '6px', display: 'flex', flexDirection: 'column' }}>
                            {sortedDownloads.length === 0 ? (
                                <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.15)', gap: '12px' }}>
                                    <Download size={48} strokeWidth={1} />
                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Your download history is empty</span>
                                </div>
                            ) : (
                                sortedDownloads.map((item) => (
                                    <motion.div
                                        layout
                                        key={item.id}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        style={{
                                            padding: '14px',
                                            borderRadius: '16px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                            transition: 'all 0.2s',
                                            cursor: 'default',
                                            position: 'relative'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                                            const removeBtn = e.currentTarget.querySelector('.remove-btn') as HTMLElement
                                            if (removeBtn) removeBtn.style.opacity = '1'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'
                                            const removeBtn = e.currentTarget.querySelector('.remove-btn') as HTMLElement
                                            if (removeBtn) removeBtn.style.opacity = '0'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                            <div style={{ marginTop: '2px' }}>
                                                {item.state === 'completed' ? (
                                                    <div style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '6px', borderRadius: '8px' }}>
                                                        <CheckCircle size={16} />
                                                    </div>
                                                ) : item.state === 'failed' ? (
                                                    <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '6px', borderRadius: '8px' }}>
                                                        <AlertCircle size={16} />
                                                    </div>
                                                ) : (
                                                    <div style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '6px', borderRadius: '8px' }}>
                                                        <Clock size={16} className="animate-pulse" />
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0, paddingRight: '24px' }}>
                                                <div style={{
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    color: 'white',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    textDecoration: item.state === 'completed' && item.fileExists === false ? 'line-through' : 'none',
                                                    opacity: item.state === 'completed' && item.fileExists === false ? 0.5 : 1
                                                }} title={item.name}>
                                                    {item.name} {item.state === 'completed' && item.fileExists === false && <span style={{ fontSize: '10px', color: '#ef4444', marginLeft: '6px', textDecoration: 'none', display: 'inline-block' }}>(File missing)</span>}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 500 }}>
                                                        {formatSize(item.receivedBytes)} {item.totalBytes > 0 ? `/ ${formatSize(item.totalBytes)}` : ''}
                                                    </span>
                                                    {item.state === 'downloading' && item.totalBytes > 0 && (
                                                        <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 700 }}>
                                                            {getProgress(item)}%
                                                        </span>
                                                    )}
                                                </div>

                                                {item.state === 'downloading' && item.totalBytes > 0 && (
                                                    <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', marginTop: '10px', overflow: 'hidden' }}>
                                                        <motion.div
                                                            style={{ height: '100%', backgroundColor: '#3b82f6', boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${getProgress(item)}%` }}
                                                        />
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '12px' }}>
                                                    <button
                                                        onClick={() => (window as any).electronAPI.openDownloadedFile(item.path)}
                                                        style={{
                                                            fontSize: '11px',
                                                            color: '#3b82f6',
                                                            backgroundColor: 'transparent',
                                                            border: 'none',
                                                            cursor: item.state === 'completed' && item.fileExists !== false ? 'pointer' : 'default',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: 0,
                                                            fontWeight: 700,
                                                            opacity: item.state === 'completed' && item.fileExists !== false ? 1 : 0.3,
                                                            transition: 'opacity 0.2s'
                                                        }}
                                                        disabled={item.state !== 'completed' || item.fileExists === false}
                                                    >
                                                        <File size={12} /> Open File
                                                    </button>
                                                    <button
                                                        onClick={() => (window as any).electronAPI.openDownloadedFolder(item.path)}
                                                        style={{
                                                            fontSize: '11px',
                                                            color: 'rgba(255, 255, 255, 0.4)',
                                                            backgroundColor: 'transparent',
                                                            border: 'none',
                                                            cursor: item.fileExists !== false ? 'pointer' : 'default',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: 0,
                                                            fontWeight: 600,
                                                            transition: 'color 0.2s',
                                                            opacity: item.fileExists !== false ? 1 : 0.3
                                                        }}
                                                        onMouseEnter={(e) => { if (item.fileExists !== false) e.currentTarget.style.color = 'white' }}
                                                        onMouseLeave={(e) => { if (item.fileExists !== false) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)' }}
                                                        disabled={item.fileExists === false}
                                                    >
                                                        <Folder size={12} /> Folder
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Individual Remove Button */}
                                            <button
                                                className="remove-btn"
                                                onClick={() => onRemoveItem(item.id)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '14px',
                                                    right: '14px',
                                                    padding: '6px',
                                                    backgroundColor: 'transparent',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    color: 'rgba(255, 255, 255, 0.2)',
                                                    cursor: 'pointer',
                                                    opacity: 0,
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                                                    e.currentTarget.style.color = '#ef4444'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent'
                                                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.2)'
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    <style>{`
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 6px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 3px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: rgba(255, 255, 255, 0.2);
                        }
                        @keyframes pulse {
                            0%, 100% { opacity: 1; transform: scale(1); }
                            50% { opacity: .6; transform: scale(0.95); }
                        }
                        .animate-pulse {
                            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                        }
                    `}</style>
                </div>
            )}
        </AnimatePresence>
    )
}

export default DownloadManager
