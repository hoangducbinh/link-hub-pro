import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Download, Upload, Shield, Globe, Pencil } from 'lucide-react'
import { AppConfig, WebsiteConfig } from '../types/config'

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
    config: AppConfig
    onSave: (newConfig: AppConfig) => void
    onImport: () => void
    onExport: () => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave, onImport, onExport }) => {
    const [localConfig, setLocalConfig] = useState<AppConfig>(config)
    const [activeTab, setActiveTab] = useState<'websites' | 'system'>('websites')
    const [editingSite, setEditingSite] = useState<WebsiteConfig | null>(null)

    useEffect(() => {
        if (isOpen) {
            setLocalConfig(config)
        }
    }, [isOpen, config])

    const handleSaveSite = () => {
        if (!editingSite) return

        const index = localConfig.websites.findIndex(s => s.id === editingSite!.id)
        let newWebsites = [...localConfig.websites]

        if (index >= 0) {
            newWebsites[index] = editingSite
        } else {
            newWebsites.push(editingSite)
        }

        const newConfig = { ...localConfig, websites: newWebsites }
        setLocalConfig(newConfig)
        onSave(newConfig)
        setEditingSite(null)
    }

    const handleDeleteSite = (id: string) => {
        const newWebsites = localConfig.websites.filter(s => s.id !== id)
        const newConfig = { ...localConfig, websites: newWebsites }
        setLocalConfig(newConfig)
        onSave(newConfig)
    }

    const handlePickIcon = async () => {
        if (!editingSite) return
        try {
            const iconData = await (window as any).electronAPI.pickIcon()
            if (iconData) {
                setEditingSite(prev => prev ? { ...prev, icon: iconData } : null)
            }
        } catch (e) {
            console.error('Failed to pick icon:', e)
        }
    }

    const updateSystemSetting = (key: 'theme' | 'defaultLayout', value: string) => {
        const newConfig = {
            ...localConfig,
            settings: {
                ...localConfig.settings,
                [key]: value
            }
        }
        setLocalConfig(newConfig)
        onSave(newConfig)
    }

    if (!isOpen) return null

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="settings-modal"
                onClick={e => e.stopPropagation()}
            >
                <div className="settings-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h2 style={{ fontSize: '18px', margin: 0 }}>Settings</h2>
                        <div className="settings-tabs">
                            <button
                                onClick={() => setActiveTab('websites')}
                                className={`settings-tab-btn ${activeTab === 'websites' ? 'active' : ''}`}
                            >
                                Websites
                            </button>
                            <button
                                onClick={() => setActiveTab('system')}
                                className={`settings-tab-btn ${activeTab === 'system' ? 'active' : ''}`}
                            >
                                System
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon">
                        <X size={20} />
                    </button>
                </div>

                <div className="settings-content">
                    <div className="settings-main">
                        {activeTab === 'websites' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', opacity: 0.5 }}>{localConfig.websites.length} configuration entries</span>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => setEditingSite({
                                            id: `site-${Date.now()}`,
                                            name: '',
                                            url: '',
                                            sessionType: 'shared',
                                            group: 'Default'
                                        })}
                                        style={{ backgroundColor: '#3b82f6', border: 'none' }}
                                    >
                                        <Plus size={16} /> New Entry
                                    </button>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                    gap: '16px'
                                }}>
                                    {localConfig.websites.map(site => (
                                        <div key={site.id} className="site-card">
                                            <div className="site-card-actions">
                                                <button onClick={() => setEditingSite(site)} className="btn-icon"><Pencil size={14} /></button>
                                                <button onClick={() => handleDeleteSite(site.id)} className="btn-icon btn-danger-icon"><Trash2 size={14} /></button>
                                            </div>

                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '48px', height: '48px',
                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                    borderRadius: '10px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    overflow: 'hidden'
                                                }}>
                                                    {site.icon ? (
                                                        <img src={site.icon} style={{ width: '32px', height: '32px', objectFit: 'contain' }} alt="" />
                                                    ) : (
                                                        <Globe size={24} style={{ opacity: 0.2 }} />
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site.name || 'Untitled'}</div>
                                                    <div style={{ fontSize: '11px', opacity: 0.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site.url}</div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                                                <span className="label-tiny" style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>{site.sessionType || 'shared'}</span>
                                                <span className="label-tiny" style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>{site.group || 'General'}</span>
                                                {site.requirePassword && (
                                                    <span className="label-tiny" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', padding: '2px 8px', borderRadius: '4px' }}>Locked</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: '14px' }}>System Settings</h4>
                                    <div className="input-group">
                                        <label className="label-tiny">Theme</label>
                                        <select
                                            value={localConfig.settings.theme}
                                            onChange={(e) => updateSystemSetting('theme', e.target.value)}
                                            className="settings-input"
                                        >
                                            <option value="dark">Dark</option>
                                            <option value="light">Light</option>
                                            <option value="system">System</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="label-tiny">Default Layout</label>
                                        <select
                                            value={localConfig.settings.defaultLayout}
                                            onChange={(e) => updateSystemSetting('defaultLayout', e.target.value)}
                                            className="settings-input"
                                        >
                                            <option value="single">Single View</option>
                                            <option value="split">Split View</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: '14px' }}>Configuration</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <button className="btn-secondary" onClick={onImport}>
                                            <Download size={16} /> Import JSON
                                        </button>
                                        <button className="btn-secondary" onClick={onExport}>
                                            <Upload size={16} /> Export JSON
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <AnimatePresence>
                        {editingSite && (
                            <motion.div
                                initial={{ x: 320 }}
                                animate={{ x: 0 }}
                                exit={{ x: 320 }}
                                className="settings-sidebar"
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ margin: 0, fontSize: '16px' }}>{editingSite.name ? 'Edit Entry' : 'Add Entry'}</h3>
                                    <button onClick={() => setEditingSite(null)} className="btn-icon"><X size={18} /></button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                        <div style={{
                                            width: '80px', height: '80px',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            borderRadius: '16px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)',
                                            position: 'relative'
                                        }} onClick={handlePickIcon}>
                                            {editingSite.icon ? (
                                                <img src={editingSite.icon} style={{ width: '48px', height: '48px', objectFit: 'contain' }} alt="" />
                                            ) : (
                                                <Globe size={32} style={{ opacity: 0.1 }} />
                                            )}
                                        </div>
                                        <button onClick={handlePickIcon} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '11px', cursor: 'pointer' }}>Change Icon</button>
                                    </div>

                                    <div className="input-group">
                                        <label className="label-tiny">Display Name</label>
                                        <input
                                            type="text"
                                            className="settings-input"
                                            value={editingSite.name}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setEditingSite(prev => prev ? { ...prev, name: val } : null);
                                            }}
                                            placeholder="e.g. My Admin"
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="label-tiny">URL</label>
                                        <input
                                            type="text"
                                            className="settings-input"
                                            value={editingSite.url}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setEditingSite(prev => prev ? { ...prev, url: val } : null);
                                            }}
                                            placeholder="https://..."
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="label-tiny">Group Name</label>
                                        <input
                                            type="text"
                                            className="settings-input"
                                            value={editingSite.group || ''}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setEditingSite(prev => prev ? { ...prev, group: val } : null);
                                            }}
                                            placeholder="General, Work, etc."
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="label-tiny">Session Type</label>
                                        <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: '8px', gap: '2px' }}>
                                            <button
                                                onClick={() => setEditingSite(prev => prev ? { ...prev, sessionType: 'shared' } : null)}
                                                style={{
                                                    flex: 1, padding: '6px', fontSize: '11px', border: 'none', borderRadius: '6px',
                                                    backgroundColor: editingSite.sessionType === 'shared' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                                    color: editingSite.sessionType === 'shared' ? 'white' : 'rgba(255,255,255,0.4)',
                                                    cursor: 'pointer'
                                                }}
                                            >Shared</button>
                                            <button
                                                onClick={() => setEditingSite(prev => prev ? { ...prev, sessionType: 'isolated' } : null)}
                                                style={{
                                                    flex: 1, padding: '6px', fontSize: '11px', border: 'none', borderRadius: '6px',
                                                    backgroundColor: editingSite.sessionType === 'isolated' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                                    color: editingSite.sessionType === 'isolated' ? 'white' : 'rgba(255,255,255,0.4)',
                                                    cursor: 'pointer'
                                                }}
                                            >Isolated</button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginTop: '8px' }}>
                                        <input
                                            type="checkbox"
                                            checked={!!editingSite.requirePassword}
                                            onChange={e => {
                                                const val = e.target.checked;
                                                setEditingSite(prev => prev ? { ...prev, requirePassword: val } : null);
                                            }}
                                            style={{ width: '16px', height: '16px' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 500 }}>Require Password</div>
                                            <div style={{ fontSize: '10px', opacity: 0.4 }}>Ask for auth before opening</div>
                                        </div>
                                        <Shield size={16} style={{ color: editingSite.requirePassword ? '#eab308' : 'rgba(255,255,255,0.1)' }} />
                                    </div>

                                    <button
                                        className="primary-btn"
                                        style={{ marginTop: '24px' }}
                                        onClick={handleSaveSite}
                                    >
                                        Save Configuration
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}

export default SettingsModal
