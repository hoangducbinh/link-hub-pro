import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Check, Globe, Download } from 'lucide-react'
import { WebsiteConfig } from '../types/Config'

interface SelectiveExportModalProps {
    isOpen: boolean
    onClose: () => void
    websites: WebsiteConfig[]
    onExport: (selectedIds: string[]) => void
}

const SelectiveExportModal: React.FC<SelectiveExportModalProps> = ({ isOpen, onClose, websites, onExport }) => {
    const [selectedIds, setSelectedIds] = useState<string[]>(websites.map(w => w.id))

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const selectAll = () => setSelectedIds(websites.map(w => w.id))
    const selectNone = () => setSelectedIds([])

    if (!isOpen) return null

    return (
        <div className="settings-modal-overlay" style={{ zIndex: 10001 }} onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="settings-modal"
                style={{ width: '480px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="settings-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h2 style={{ fontSize: '18px', margin: 0 }}>Selective Export</h2>
                    </div>
                    <button onClick={onClose} className="btn-icon">
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', opacity: 0.5 }}>Select items to include in export file</span>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={selectAll} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', cursor: 'pointer' }}>All</button>
                            <button onClick={selectNone} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', cursor: 'pointer' }}>None</button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {websites.map(site => (
                            <div
                                key={site.id}
                                onClick={() => toggleSelect(site.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 16px',
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    border: `1px solid ${selectedIds.includes(site.id) ? '#3b82f6' : 'transparent'}`,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '4px',
                                    border: '2px solid rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: selectedIds.includes(site.id) ? '#3b82f6' : 'transparent',
                                    borderColor: selectedIds.includes(site.id) ? '#3b82f6' : 'rgba(255,255,255,0.2)'
                                }}>
                                    {selectedIds.includes(site.id) && <Check size={12} strokeWidth={3} />}
                                </div>

                                <div style={{
                                    width: '24px', height: '24px',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    borderRadius: '6px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden'
                                }}>
                                    {site.icon ? (
                                        <img src={site.icon} style={{ width: '16px', height: '16px', objectFit: 'contain' }} alt="" />
                                    ) : (
                                        <Globe size={14} style={{ opacity: 0.2 }} />
                                    )}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site.name || 'Untitled'}</div>
                                    <div style={{ fontSize: '10px', opacity: 0.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site.url}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn-primary"
                        disabled={selectedIds.length === 0}
                        onClick={() => onExport(selectedIds)}
                        style={{ backgroundColor: '#3b82f6', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Download size={16} /> Export Selected ({selectedIds.length})
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

export default SelectiveExportModal
