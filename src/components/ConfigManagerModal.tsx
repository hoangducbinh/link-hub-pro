import React, { useState } from 'react'
import { motion } from 'framer-motion'
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

    const tabStyle = (id: string) => ({
        padding: '10px 16px',
        cursor: 'pointer',
        borderBottom: activeTab === id ? '2px solid #3b82f6' : '2px solid transparent',
        color: activeTab === id ? 'white' : 'rgba(255,255,255,0.5)',
        fontWeight: activeTab === id ? 600 : 400,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s'
    })

    const inputStyle = {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '8px 12px',
        borderRadius: '6px',
        color: 'white',
        width: '100%',
        marginTop: '8px'
    }

    const buttonStyle = {
        background: '#3b82f6',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        color: 'white',
        cursor: 'pointer',
        fontWeight: 500,
        marginTop: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10010,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(5px)'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                    width: '600px',
                    height: '500px',
                    backgroundColor: '#1c1c1c',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Configuration Manager</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div onClick={() => setActiveTab('grid')} style={tabStyle('grid')}><Grid size={16} /> Dynamic Grid</div>
                    <div onClick={() => setActiveTab('tabs')} style={tabStyle('tabs')}><Layers size={16} /> Tab Manager</div>
                    <div onClick={() => setActiveTab('sequence')} style={tabStyle('sequence')}><Play size={16} /> Automation</div>
                    <div onClick={() => setActiveTab('view')} style={tabStyle('view')}><Monitor size={16} /> View Mode</div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                    {activeTab === 'grid' && (
                        <div>
                            <h3 style={{ marginTop: 0 }}>Custom Grid Layout</h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Define a custom grid layout by specifying rows and columns.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                                <div>
                                    <label>Columns</label>
                                    <input
                                        type="number"
                                        value={cols}
                                        onChange={(e) => setCols(parseInt(e.target.value))}
                                        style={inputStyle}
                                        min="1" max="20"
                                    />
                                </div>
                                <div>
                                    <label>Rows</label>
                                    <input
                                        type="number"
                                        value={rows}
                                        onChange={(e) => setRows(parseInt(e.target.value))}
                                        style={inputStyle}
                                        min="1" max="20"
                                    />
                                </div>
                            </div>

                            <button onClick={() => { onUpdateCustomGrid(rows, cols); onClose(); }} style={buttonStyle}>
                                <Grid size={16} /> Apply Custom Grid ({cols}×{rows})
                            </button>
                        </div>
                    )}

                    {activeTab === 'tabs' && (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <h3 style={{ marginTop: 0 }}>Bulk Open URLs</h3>
                                <textarea
                                    placeholder="Enter URLs (one per line)"
                                    value={bulkUrls}
                                    onChange={(e) => setBulkUrls(e.target.value)}
                                    style={{ ...inputStyle, height: '80px', fontFamily: 'monospace' }}
                                />
                                <div style={{ marginTop: '8px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '14px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={isAutoFill}
                                            onChange={(e) => setIsAutoFill(e.target.checked)}
                                        />
                                        Auto-fill Grid (Replicate 1st URL to fill slots)
                                    </label>
                                </div>
                                <div style={{ marginTop: '8px' }}>
                                    <select
                                        value={selectedLayout}
                                        onChange={(e) => setSelectedLayout(e.target.value)}
                                        style={inputStyle}
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
                                        // Calculate needed slots
                                        let capacity = 1
                                        if (selectedLayout === 'grid-mobile-4x8') capacity = 32 // 8x4
                                        else if (selectedLayout === 'grid-mobile-8x3') capacity = 24 // 8x3
                                        else if (selectedLayout === 'grid-mobile-3x4') capacity = 12
                                        else if (selectedLayout === 'grid-mobile-4x6') capacity = 24
                                        else if (selectedLayout === 'grid-custom') capacity = rows * cols

                                        // If we have 1 URL (or more), we fill up to capacity
                                        // Usually "Auto-fill grid with same 1 url" implies taking the first one
                                        // But if they provided multiple, maybe cycle them?
                                        // For now, let's just cycle through provided URLs to fill capacity
                                        finalUrls = []
                                        for (let i = 0; i < capacity; i++) {
                                            finalUrls.push(rawUrls[i % rawUrls.length])
                                        }
                                    }

                                    onBulkOpen(finalUrls, selectedLayout);
                                    setBulkUrls('');
                                    onClose();
                                }} style={buttonStyle}>
                                    <LayoutList size={16} /> Open All URLs
                                </button>
                            </div>

                            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <h3>Active Tabs ({activeWebViews.length})</h3>
                                <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '8px' }}>
                                    {activeWebViews.map(wv => (
                                        <div key={wv.instanceId} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px',
                                            borderBottom: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {wv.name || wv.url}
                                            </div>
                                            <button
                                                onClick={() => onCloseTab(wv.instanceId)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sequence' && (
                        <div>
                            <h3 style={{ marginTop: 0 }}>Sequential Actions</h3>

                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4>Auto Reload Sequence</h4>
                                    <button
                                        onClick={() => onUpdateSequence({ isReloading: !sequenceConfig.isReloading })}
                                        style={{
                                            ...buttonStyle,
                                            marginTop: 0,
                                            background: sequenceConfig.isReloading ? '#ef4444' : '#22c55e'
                                        }}
                                    >
                                        {sequenceConfig.isReloading ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                        {sequenceConfig.isReloading ? 'Stop' : 'Start'}
                                    </button>
                                </div>
                                <label>Interval (seconds)</label>
                                <input
                                    type="number"
                                    value={sequenceConfig.reloadInterval / 1000}
                                    onChange={(e) => onUpdateSequence({ reloadInterval: parseInt(e.target.value) * 1000 })}
                                    style={inputStyle}
                                    min="1"
                                />
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4>Auto Scroll Sequence</h4>
                                    <button
                                        onClick={() => onUpdateSequence({ isScrolling: !sequenceConfig.isScrolling })}
                                        style={{
                                            ...buttonStyle,
                                            marginTop: 0,
                                            background: sequenceConfig.isScrolling ? '#ef4444' : '#22c55e'
                                        }}
                                    >
                                        {sequenceConfig.isScrolling ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                        {sequenceConfig.isScrolling ? 'Stop' : 'Start'}
                                    </button>
                                </div>
                                <label>Interval (seconds)</label>
                                <input
                                    type="number"
                                    value={sequenceConfig.scrollInterval / 1000}
                                    onChange={(e) => onUpdateSequence({ scrollInterval: parseInt(e.target.value) * 1000 })}
                                    style={inputStyle}
                                    min="1"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'view' && (
                        <div>
                            <h3 style={{ marginTop: 0 }}>View Mode</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                <div
                                    onClick={() => onSetViewMode('desktop')}
                                    style={{
                                        padding: '20px',
                                        border: viewMode === 'desktop' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                                        background: viewMode === 'desktop' ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                                    }}
                                >
                                    <Monitor size={32} />
                                    <span>Desktop</span>
                                </div>
                                <div
                                    onClick={() => onSetViewMode('tablet')}
                                    style={{
                                        padding: '20px',
                                        border: viewMode === 'tablet' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                                        background: viewMode === 'tablet' ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                                    }}
                                >
                                    <Tablet size={32} />
                                    <span>Tablet</span>
                                </div>
                                <div
                                    onClick={() => onSetViewMode('mobile')}
                                    style={{
                                        padding: '20px',
                                        border: viewMode === 'mobile' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                                        background: viewMode === 'mobile' ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                                    }}
                                >
                                    <Smartphone size={32} />
                                    <span>Mobile</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

export default ConfigManagerModal
