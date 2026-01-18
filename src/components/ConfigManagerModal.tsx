import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Grid, LayoutList, Play, Square, Smartphone, Monitor, Tablet, Layers } from 'lucide-react'
import { WebViewInfo } from './WebViewManager'

interface ConfigManagerModalProps {
    isOpen: boolean
    onClose: () => void
    activeWebViews: WebViewInfo[]
    onUpdateCustomGrid: (rows: number, cols: number) => void
    onBulkOpen: (urls: string[], layout: string) => void
    onCloseTab: (id: string) => void
    sequenceConfig: { reloadInterval: number, scrollInterval: number, isReloading: boolean, isScrolling: boolean }
    onUpdateSequence: (config: { reloadInterval?: number, scrollInterval?: number, isReloading?: boolean, isScrolling?: boolean }) => void
    viewMode: 'desktop' | 'mobile' | 'tablet'
    onSetViewMode: (mode: 'desktop' | 'mobile' | 'tablet') => void
}

const ConfigManagerModal: React.FC<ConfigManagerModalProps> = ({
    isOpen,
    onClose,
    activeWebViews,
    onUpdateCustomGrid,
    onBulkOpen,
    onCloseTab,
    sequenceConfig,
    onUpdateSequence,
    viewMode,
    onSetViewMode
}) => {
    const [activeTab, setActiveTab] = useState<'grid' | 'tabs' | 'sequence' | 'view'>('grid')
    const [rows, setRows] = useState(3)
    const [cols, setCols] = useState(3)
    const [bulkUrls, setBulkUrls] = useState('')
    const [selectedLayout, setSelectedLayout] = useState('grid-custom')
    const [isAutoFill, setIsAutoFill] = useState(false)

    if (!isOpen) return null


    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    className="modal-overlay"
                    onClick={onClose}
                    style={{ display: 'flex' }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        className="modal-content"
                        style={{
                            width: '1000px',
                            height: '560px',
                            backgroundColor: '#121212',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '24px 32px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(255,255,255,0.02)',
                            borderBottom: '1px solid var(--border-color)'
                        }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'white' }}>Configuration Manager</h2>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>Advanced controls and automation</p>
                            </div>
                            <button onClick={onClose} className="tool-btn" style={{ width: '36px', height: '36px', borderRadius: '50%' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', padding: '0 32px', gap: '24px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                            <div onClick={() => setActiveTab('grid')} style={{
                                padding: '10px 16px',
                                cursor: 'pointer',
                                borderBottom: activeTab === 'grid' ? '2px solid var(--accent-color)' : '2px solid transparent',
                                color: activeTab === 'grid' ? 'white' : 'var(--text-secondary)',
                                fontWeight: activeTab === 'grid' ? 600 : 400,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}><Grid size={15} /> Dynamic Grid</div>
                            <div onClick={() => setActiveTab('tabs')} style={{
                                padding: '10px 16px',
                                cursor: 'pointer',
                                borderBottom: activeTab === 'tabs' ? '2px solid var(--accent-color)' : '2px solid transparent',
                                color: activeTab === 'tabs' ? 'white' : 'var(--text-secondary)',
                                fontWeight: activeTab === 'tabs' ? 600 : 400,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}><Layers size={15} /> Tab Manager</div>
                            <div onClick={() => setActiveTab('sequence')} style={{
                                padding: '10px 16px',
                                cursor: 'pointer',
                                borderBottom: activeTab === 'sequence' ? '2px solid var(--accent-color)' : '2px solid transparent',
                                color: activeTab === 'sequence' ? 'white' : 'var(--text-secondary)',
                                fontWeight: activeTab === 'sequence' ? 600 : 400,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}><Play size={15} /> Automation</div>
                            <div onClick={() => setActiveTab('view')} style={{
                                padding: '10px 16px',
                                cursor: 'pointer',
                                borderBottom: activeTab === 'view' ? '2px solid var(--accent-color)' : '2px solid transparent',
                                color: activeTab === 'view' ? 'white' : 'var(--text-secondary)',
                                fontWeight: activeTab === 'view' ? 600 : 400,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}><Monitor size={15} /> View Mode</div>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                            {activeTab === 'grid' && (
                                <div style={{ maxWidth: '400px' }}>
                                    <h3 style={{ marginTop: 0, fontSize: '18px' }}>Custom Grid Layout</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Define a custom grid layout by specifying rows and columns.</p>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label className="label-tiny">Columns</label>
                                            <input
                                                type="number"
                                                value={cols}
                                                onChange={(e) => setCols(parseInt(e.target.value))}
                                                className="address-bar-input"
                                                style={{ textAlign: 'left', padding: '0 12px', height: '36px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                                                min="1" max="20"
                                            />
                                        </div>
                                        <div>
                                            <label className="label-tiny">Rows</label>
                                            <input
                                                type="number"
                                                value={rows}
                                                onChange={(e) => setRows(parseInt(e.target.value))}
                                                className="address-bar-input"
                                                style={{ textAlign: 'left', padding: '0 12px', height: '36px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                                                min="1" max="20"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { onUpdateCustomGrid(rows, cols); onClose(); }}
                                        className="btn-primary"
                                        style={{ marginTop: '32px', width: '100%', height: '40px', borderRadius: '10px' }}
                                    >
                                        <Grid size={16} /> Apply Grid Layout ({cols}×{rows})
                                    </button>
                                </div>
                            )}

                            {activeTab === 'tabs' && (
                                <div style={{ height: '100%', display: 'flex', gap: '32px' }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ marginTop: 0, fontSize: '17px' }}>Bulk Open URLs</h3>
                                        <textarea
                                            placeholder="https://example.com&#10;https://google.com"
                                            value={bulkUrls}
                                            onChange={(e) => setBulkUrls(e.target.value)}
                                            style={{
                                                width: '100%',
                                                height: '140px',
                                                backgroundColor: 'rgba(255,255,255,0.03)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '12px',
                                                padding: '12px',
                                                color: 'white',
                                                fontFamily: 'monospace',
                                                fontSize: '13px',
                                                outline: 'none',
                                                resize: 'none',
                                                marginTop: '12px'
                                            }}
                                        />
                                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isAutoFill}
                                                    onChange={(e) => setIsAutoFill(e.target.checked)}
                                                    style={{ width: '16px', height: '16px' }}
                                                />
                                                Auto-fill Grid slots
                                            </label>

                                            <select
                                                value={selectedLayout}
                                                onChange={(e) => setSelectedLayout(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    height: '36px',
                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                    color: 'white',
                                                    padding: '0 8px',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="grid-custom">Current Custom Grid</option>
                                                <option value="grid-mobile-4x8">Mobile 8×4</option>
                                                <option value="grid-mobile-8x3">Mobile 8×3</option>
                                                <option value="grid-mobile-3x4">Mobile 3×4</option>
                                                <option value="grid-mobile-4x6">Mobile 4×6</option>
                                            </select>
                                        </div>
                                        <button onClick={() => {
                                            const rawUrls = bulkUrls.split('\n').filter(u => u.trim())
                                            if (rawUrls.length === 0) return

                                            let finalUrls = rawUrls

                                            if (isAutoFill) {
                                                let capacity = 1
                                                if (selectedLayout === 'grid-mobile-4x8') capacity = 32
                                                else if (selectedLayout === 'grid-mobile-8x3') capacity = 24
                                                else if (selectedLayout === 'grid-mobile-3x4') capacity = 12
                                                else if (selectedLayout === 'grid-mobile-4x6') capacity = 24
                                                else if (selectedLayout === 'grid-custom') capacity = rows * cols

                                                finalUrls = []
                                                for (let i = 0; i < capacity; i++) {
                                                    finalUrls.push(rawUrls[i % rawUrls.length])
                                                }
                                            }

                                            onBulkOpen(finalUrls, selectedLayout);
                                            setBulkUrls('');
                                            onClose();
                                        }} className="btn-primary" style={{ marginTop: '20px', width: '100%', height: '40px', borderRadius: '10px' }}>
                                            <LayoutList size={16} /> Launch All
                                        </button>
                                    </div>

                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{ marginTop: 0, fontSize: '17px' }}>Active Tabs ({activeWebViews.length})</h3>
                                        <div style={{
                                            flex: 1,
                                            overflowY: 'auto',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '12px',
                                            padding: '8px',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            {activeWebViews.length === 0 ? (
                                                <div style={{ padding: '20px', textAlign: 'center', opacity: 0.3, fontSize: '13px' }}>No active tabs</div>
                                            ) : (
                                                activeWebViews.map(wv => (
                                                    <div key={wv.instanceId} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '10px 12px',
                                                        borderRadius: '8px',
                                                        marginBottom: '4px',
                                                        backgroundColor: 'rgba(255,255,255,0.03)'
                                                    }}>
                                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px' }}>
                                                            {wv.name || wv.url}
                                                        </div>
                                                        <button
                                                            onClick={() => onCloseTab(wv.instanceId)}
                                                            className="tool-btn"
                                                            style={{ color: '#ef4444', width: '28px', height: '28px' }}
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'sequence' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                    <div style={{
                                        padding: '24px',
                                        borderRadius: '16px',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'rgba(255,255,255,0.02)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h4 style={{ margin: 0 }}>Auto Reload</h4>
                                            <button
                                                onClick={() => onUpdateSequence({ isReloading: !sequenceConfig.isReloading })}
                                                className={`tool-btn ${sequenceConfig.isReloading ? 'active' : ''}`}
                                                style={{
                                                    width: '40px', height: '40px', borderRadius: '50%',
                                                    backgroundColor: sequenceConfig.isReloading ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                                    color: sequenceConfig.isReloading ? '#ef4444' : '#22c55e'
                                                }}
                                            >
                                                {sequenceConfig.isReloading ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                            </button>
                                        </div>
                                        <label className="label-tiny">Interval (seconds)</label>
                                        <input
                                            type="number"
                                            value={sequenceConfig.reloadInterval / 1000}
                                            onChange={(e) => onUpdateSequence({ reloadInterval: parseInt(e.target.value) * 1000 })}
                                            style={{
                                                width: '100%', height: '36px',
                                                backgroundColor: 'rgba(255,255,255,0.05)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px', padding: '0 12px', color: 'white', marginTop: '8px'
                                            }}
                                            min="1"
                                        />
                                    </div>

                                    <div style={{
                                        padding: '24px',
                                        borderRadius: '16px',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'rgba(255,255,255,0.02)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h4 style={{ margin: 0 }}>Auto Scroll</h4>
                                            <button
                                                onClick={() => onUpdateSequence({ isScrolling: !sequenceConfig.isScrolling })}
                                                className={`tool-btn ${sequenceConfig.isScrolling ? 'active' : ''}`}
                                                style={{
                                                    width: '40px', height: '40px', borderRadius: '50%',
                                                    backgroundColor: sequenceConfig.isScrolling ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                                    color: sequenceConfig.isScrolling ? '#ef4444' : '#22c55e'
                                                }}
                                            >
                                                {sequenceConfig.isScrolling ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                            </button>
                                        </div>
                                        <label className="label-tiny">Interval (seconds)</label>
                                        <input
                                            type="number"
                                            value={sequenceConfig.scrollInterval / 1000}
                                            onChange={(e) => onUpdateSequence({ scrollInterval: parseInt(e.target.value) * 1000 })}
                                            style={{
                                                width: '100%', height: '36px',
                                                backgroundColor: 'rgba(255,255,255,0.05)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px', padding: '0 12px', color: 'white', marginTop: '8px'
                                            }}
                                            min="1"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'view' && (
                                <div>
                                    <h3 style={{ marginTop: 0, fontSize: '18px' }}>View Mode</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Force all tabs to simulate a specific device type.</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                                        {[
                                            { id: 'desktop', icon: Monitor, label: 'Desktop' },
                                            { id: 'tablet', icon: Tablet, label: 'Tablet' },
                                            { id: 'mobile', icon: Smartphone, label: 'Mobile' }
                                        ].map(mode => (
                                            <div
                                                key={mode.id}
                                                onClick={() => onSetViewMode(mode.id as any)}
                                                style={{
                                                    padding: '24px',
                                                    border: viewMode === mode.id ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                                                    borderRadius: '16px',
                                                    cursor: 'pointer',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                                                    background: viewMode === mode.id ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.02)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <mode.icon size={32} strokeWidth={1.5} color={viewMode === mode.id ? 'var(--accent-color)' : 'var(--text-secondary)'} />
                                                <span style={{ fontWeight: 500, color: viewMode === mode.id ? 'white' : 'var(--text-secondary)' }}>{mode.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default ConfigManagerModal
