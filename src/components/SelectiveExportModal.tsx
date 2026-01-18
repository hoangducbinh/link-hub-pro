import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    className="modal-overlay"
                    style={{ zIndex: 10005, display: 'flex' }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        className="modal-content"
                        style={{ width: '480px', maxHeight: '80vh', backgroundColor: '#121212' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                            <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 600 }}>Selective Export</h2>
                            <button onClick={onClose} className="tool-btn" style={{ width: '36px', height: '36px', borderRadius: '50%' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Include in export file</span>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <button onClick={selectAll} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Select All</button>
                                    <button onClick={selectNone} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>Clear</button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {websites.map(site => (
                                    <div
                                        key={site.id}
                                        onClick={() => toggleSelect(site.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            padding: '16px',
                                            backgroundColor: 'rgba(255,255,255,0.03)',
                                            borderRadius: '16px',
                                            cursor: 'pointer',
                                            border: `1px solid ${selectedIds.includes(site.id) ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: selectedIds.includes(site.id) ? '0 4px 12px rgba(0, 122, 255, 0.1)' : 'none'
                                        }}
                                    >
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '6px',
                                            border: '2px solid',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: selectedIds.includes(site.id) ? 'var(--accent-color)' : 'transparent',
                                            borderColor: selectedIds.includes(site.id) ? 'var(--accent-color)' : 'var(--border-color)',
                                            transition: 'all 0.2s ease'
                                        }}>
                                            {selectedIds.includes(site.id) && <Check size={14} strokeWidth={3} color="white" />}
                                        </div>

                                        <div style={{
                                            width: '32px', height: '32px',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            borderRadius: '8px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            overflow: 'hidden',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            {site.icon ? (
                                                <img src={site.icon} style={{ width: '20px', height: '20px', objectFit: 'contain' }} alt="" />
                                            ) : (
                                                <Globe size={18} style={{ opacity: 0.1 }} />
                                            )}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{site.name || 'Untitled'}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site.url}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                            <button className="btn-secondary" onClick={onClose} style={{ height: '40px', padding: '0 24px', borderRadius: '10px' }}>Cancel</button>
                            <button
                                className="btn-primary"
                                disabled={selectedIds.length === 0}
                                onClick={() => onExport(selectedIds)}
                                style={{ height: '40px', padding: '0 24px', borderRadius: '10px' }}
                            >
                                <Download size={16} /> Export ({selectedIds.length})
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default SelectiveExportModal
