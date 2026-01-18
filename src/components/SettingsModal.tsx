import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Download, Upload, Shield, Globe, Pencil, Lock, Clock } from 'lucide-react'
import { AppConfig, WebsiteConfig, SecurityConfig } from '../types/Config'
import ShortcutSection from './ShortcutSection'
import { getFavicon } from '../utils/favicon'
import SelectiveExportModal from './SelectiveExportModal'

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
    config: AppConfig
    onSave: (newConfig: AppConfig) => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
    const [localConfig, setLocalConfig] = useState<AppConfig>(config)
    const [activeTab, setActiveTab] = useState<'websites' | 'system' | 'shortcuts' | 'security'>('websites')
    const [editingSite, setEditingSite] = useState<WebsiteConfig | null>(null)
    const [isExportModalOpen, setIsExportModalOpen] = useState(false)
    const [showPasswordSetup, setShowPasswordSetup] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [oldPassword, setOldPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [newRecoveryKey, setNewRecoveryKey] = useState('')
    const [confirmRecoveryKey, setConfirmRecoveryKey] = useState('')
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [passwordError, setPasswordError] = useState('')
    const [importData, setImportData] = useState<AppConfig | null>(null)

    useEffect(() => {
        if (isOpen) {
            setLocalConfig(config)
        }
    }, [isOpen, config])

    const handleSaveSite = () => {
        if (!editingSite) return

        const index = localConfig.websites.findIndex(s => s.id === editingSite.id)
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

    const handleResetIcon = () => {
        if (!editingSite) return
        const defaultIcon = getFavicon(editingSite.url)
        setEditingSite(prev => prev ? { ...prev, icon: defaultIcon } : null)
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

    const updateSecuritySetting = (updates: Partial<SecurityConfig>) => {
        const newConfig = {
            ...localConfig,
            security: {
                ...localConfig.security,
                ...updates
            }
        }
        setLocalConfig(newConfig)
        onSave(newConfig)
    }

    const handleSetPassword = async () => {
        if (!newPassword || newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match')
            return
        }
        if (!newRecoveryKey || newRecoveryKey !== confirmRecoveryKey) {
            setPasswordError('Recovery keys do not match')
            return
        }
        const hash = await (window as any).electronAPI.hashPassword(newPassword)
        const rHash = await (window as any).electronAPI.hashPassword(newRecoveryKey)
        updateSecuritySetting({
            passwordHash: hash,
            recoveryHash: rHash,
            appLockEnabled: true
        })
        setNewPassword('')
        setConfirmPassword('')
        setNewRecoveryKey('')
        setConfirmRecoveryKey('')
        setPasswordError('')
        setShowPasswordSetup(false)
    }

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || newPassword !== confirmPassword) {
            setPasswordError('Please fill all fields correctly')
            return
        }
        if (newRecoveryKey && newRecoveryKey !== confirmRecoveryKey) {
            setPasswordError('Recovery keys do not match')
            return
        }

        const isValid = await (window as any).electronAPI.verifyPassword(oldPassword, localConfig.security.passwordHash || '')
        if (!isValid) {
            setPasswordError('Incorrect old password')
            return
        }

        const newHash = await (window as any).electronAPI.hashPassword(newPassword)
        const updates: Partial<SecurityConfig> = { passwordHash: newHash }

        if (newRecoveryKey) {
            updates.recoveryHash = await (window as any).electronAPI.hashPassword(newRecoveryKey)
        }

        updateSecuritySetting(updates)

        // Reset states
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setNewRecoveryKey('')
        setConfirmRecoveryKey('')
        setIsChangingPassword(false)
        setPasswordError('')
        alert('Security credentials updated successfully!')
    }

    const handleImportFile = async () => {
        const result = await (window as any).electronAPI.importConfig()
        if (result && result.data) {
            setImportData(result.data)
        }
    }

    const handleImportAction = (mode: 'merge' | 'overwrite') => {
        if (!importData) return

        let newConfig: AppConfig
        if (mode === 'overwrite') {
            newConfig = importData
        } else {
            const existingIds = new Set(localConfig.websites.map(w => w.id))
            const newWebsites = [
                ...localConfig.websites,
                ...importData.websites.filter(w => !existingIds.has(w.id))
            ]
            newConfig = { ...localConfig, websites: newWebsites }
        }

        setLocalConfig(newConfig)
        onSave(newConfig)
        setImportData(null)
    }

    const handleExportSelected = (selectedIds: string[]) => {
        const filteredWebsites = localConfig.websites.filter(w => selectedIds.includes(w.id))
        const dataToExport = { ...localConfig, websites: filteredWebsites }
            ; (window as any).electronAPI.exportConfig({ data: dataToExport, defaultName: 'linkhub-config.json' })
        setIsExportModalOpen(false)
    }

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
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            width: editingSite ? '1380px' : '1000px'
                        }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        className="modal-content"
                        style={{
                            height: '860px',
                            backgroundColor: 'var(--modal-bg)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="settings-header" style={{ padding: '24px 32px', background: 'var(--btn-hover-bg)', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 600 }}>Settings</h2>
                                <div className="settings-tabs" style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--btn-hover-bg)', padding: '4px', borderRadius: '10px' }}>
                                    {[
                                        { id: 'websites', label: 'Websites' },
                                        { id: 'system', label: 'System' },
                                        { id: 'shortcuts', label: 'Shortcuts' },
                                        { id: 'security', label: 'Security' }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                            style={{
                                                padding: '6px 16px',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                fontWeight: activeTab === tab.id ? 600 : 400,
                                                backgroundColor: activeTab === tab.id ? 'var(--btn-active-bg)' : 'transparent',
                                                border: 'none',
                                                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button onClick={handleImportFile} className="tool-btn" title="Import"><Upload size={18} /></button>
                                <button onClick={() => setIsExportModalOpen(true)} className="tool-btn" title="Export"><Download size={18} /></button>
                                <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />
                                <button onClick={onClose} className="tool-btn"><X size={20} /></button>
                            </div>
                        </div>

                        <div className="settings-content" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                            <div className="settings-main" style={{ flex: 1, height: '100%', overflowY: 'auto' }}>
                                {activeTab === 'websites' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '12px', opacity: 0.5 }}>{localConfig.websites.length} configuration entries</span>
                                            <button
                                                className="btn-primary"
                                                onClick={() => setEditingSite({ id: `site-${Date.now()}`, name: '', url: '', sessionType: 'shared', group: 'Default' })}
                                                style={{ border: 'none', padding: '8px 12px', borderRadius: '10px' }}
                                            >
                                                <Plus size={16} /> New Entry
                                            </button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                            {localConfig.websites.map(site => (
                                                <div key={site.id} className="site-card" onClick={() => setEditingSite(site)} style={{ cursor: 'pointer' }}>
                                                    <div className="site-card-actions">
                                                        <button onClick={(e) => { e.stopPropagation(); setEditingSite(site); }} className="btn-icon"><Pencil size={14} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this site?')) handleDeleteSite(site.id); }} className="btn-icon btn-danger-icon"><Trash2 size={14} /></button>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                        <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--btn-hover-bg)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                            {site.icon ? <img src={site.icon} style={{ width: '32px', height: '32px', objectFit: 'contain' }} alt="" /> : <Globe size={24} style={{ opacity: 0.2 }} />}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site.name || 'Untitled'}</div>
                                                            <div style={{ fontSize: '11px', opacity: 0.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site.url}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                                                        <span className="label-tiny" style={{ backgroundColor: 'var(--btn-hover-bg)', padding: '2px 8px', borderRadius: '4px' }}>{site.sessionType || 'shared'}</span>
                                                        <span className="label-tiny" style={{ backgroundColor: 'var(--btn-hover-bg)', padding: '2px 8px', borderRadius: '4px' }}>{site.group || 'General'}</span>
                                                        {site.requirePassword && <span className="label-tiny" style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--accent-color)', padding: '2px 8px', borderRadius: '4px' }}>Locked</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'system' && (
                                    <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px' }}>System Settings</h4>
                                            <div className="input-group">
                                                <label className="label-tiny">Theme</label>
                                                <select value={localConfig.settings.theme} onChange={(e) => updateSystemSetting('theme', e.target.value)} className="settings-input">
                                                    <option value="dark">Dark</option>
                                                    <option value="light">Light</option>
                                                    <option value="system">System</option>
                                                </select>
                                            </div>
                                            <div className="input-group">
                                                <label className="label-tiny">Default Layout</label>
                                                <select value={localConfig.settings.defaultLayout} onChange={(e) => updateSystemSetting('defaultLayout', e.target.value)} className="settings-input">
                                                    <option value="single">Single View</option>
                                                    <option value="split">Split View</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'shortcuts' && (
                                    <ShortcutSection
                                        shortcuts={localConfig.shortcuts || []}
                                        onUpdate={(s) => { const newCfg = { ...localConfig, shortcuts: s }; setLocalConfig(newCfg); onSave(newCfg); }}
                                    />
                                )}

                                {activeTab === 'security' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{
                                                    width: '40px', height: '40px',
                                                    backgroundColor: localConfig.security.appLockEnabled ? 'var(--accent-glow)' : 'var(--btn-hover-bg)',
                                                    borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: localConfig.security.appLockEnabled ? 'var(--accent-color)' : 'var(--text-tertiary)'
                                                }}>
                                                    {localConfig.security.appLockEnabled ? <Lock size={20} /> : <Shield size={20} />}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '15px', fontWeight: 600 }}>App Lock</div>
                                                    <div style={{ fontSize: '12px', opacity: 0.5 }}>Requires a password when opening the application</div>
                                                </div>
                                                <div
                                                    onClick={() => localConfig.security.appLockEnabled ? updateSecuritySetting({ appLockEnabled: false }) : setShowPasswordSetup(true)}
                                                    style={{
                                                        width: '44px', height: '24px', backgroundColor: localConfig.security.appLockEnabled ? 'var(--accent-color)' : 'var(--border-color)',
                                                        borderRadius: '12px', padding: '2px', cursor: 'pointer', position: 'relative'
                                                    }}
                                                >
                                                    <motion.div animate={{ x: localConfig.security.appLockEnabled ? 20 : 0 }} style={{ width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%' }} />
                                                </div>
                                            </div>
                                            {showPasswordSetup && (
                                                <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        <div className="input-group">
                                                            <label className="label-tiny">Set Unlock Password</label>
                                                            <input type="password" title="New password" placeholder="New password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPasswordError(''); }} className="settings-input" />
                                                        </div>
                                                        <div className="input-group">
                                                            <label className="label-tiny">Confirm Password</label>
                                                            <input type="password" title="Confirm password" placeholder="Confirm password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPasswordError(''); }} className="settings-input" />
                                                        </div>
                                                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '4px 0', paddingTop: '12px' }}>
                                                            <div className="input-group">
                                                                <label className="label-tiny">Secret Recovery Key</label>
                                                                <input type="password" title="Recovery key" placeholder="Recovery key" value={newRecoveryKey} onChange={e => { setNewRecoveryKey(e.target.value); setPasswordError(''); }} className="settings-input" />
                                                            </div>
                                                            <div className="input-group">
                                                                <label className="label-tiny">Confirm Recovery Key</label>
                                                                <input type="password" title="Confirm recovery key" placeholder="Confirm recovery key" value={confirmRecoveryKey} onChange={e => { setConfirmRecoveryKey(e.target.value); setPasswordError(''); }} className="settings-input" />
                                                            </div>
                                                        </div>
                                                        {passwordError && <div style={{ color: '#ef4444', fontSize: '11px' }}>{passwordError}</div>}
                                                        <button style={{ padding: '12px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }} onClick={handleSetPassword} disabled={!newPassword || !confirmPassword || !newRecoveryKey || !confirmRecoveryKey}>Enable App Lock</button>
                                                    </div>
                                                </div>
                                            )}

                                            {localConfig.security.appLockEnabled && (
                                                <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                                                    <button
                                                        onClick={() => {
                                                            setIsChangingPassword(!isChangingPassword);
                                                            setNewRecoveryKey('');
                                                            setConfirmRecoveryKey('');
                                                        }}
                                                        style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                                                    >
                                                        {isChangingPassword ? 'Cancel Change' : 'Change Password / Recovery Key'}
                                                    </button>

                                                    {isChangingPassword && (
                                                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                            <div className="input-group">
                                                                <label className="label-tiny">Old Password</label>
                                                                <input type="password" title="Old password" placeholder="Old password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="settings-input" />
                                                            </div>
                                                            <div className="input-group">
                                                                <label className="label-tiny">New Password</label>
                                                                <input type="password" title="New password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="settings-input" />
                                                            </div>
                                                            <div className="input-group">
                                                                <label className="label-tiny">Confirm New Password</label>
                                                                <input type="password" title="Confirm new password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="settings-input" />
                                                            </div>
                                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '4px 0', paddingTop: '12px' }}>
                                                                <div className="input-group">
                                                                    <label className="label-tiny">Update Recovery Key (Optional)</label>
                                                                    <input type="password" title="New recovery key" placeholder="Leave empty to keep current" value={newRecoveryKey} onChange={e => setNewRecoveryKey(e.target.value)} className="settings-input" />
                                                                </div>
                                                                {newRecoveryKey && (
                                                                    <div className="input-group">
                                                                        <label className="label-tiny">Confirm Recovery Key</label>
                                                                        <input type="password" title="Confirm recovery key" placeholder="Confirm recovery key" value={confirmRecoveryKey} onChange={e => setConfirmRecoveryKey(e.target.value)} className="settings-input" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {passwordError && <div style={{ color: '#ef4444', fontSize: '11px' }}>{passwordError}</div>}
                                                            <button className="btn-primary" onClick={handleChangePassword}>Update Security Settings</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', padding: '20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <Clock size={20} style={{ color: 'rgba(255,255,255,0.4)' }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '15px', fontWeight: 600 }}>Auto-lock Inactivity</div>
                                                    <div style={{ fontSize: '12px', opacity: 0.5 }}>Lock app after inactivity</div>
                                                </div>
                                                <select className="settings-input" style={{ width: '120px' }} value={localConfig.security.autoLockTimer} onChange={e => updateSecuritySetting({ autoLockTimer: parseInt(e.target.value) })}>
                                                    <option value={0}>Never</option>
                                                    <option value={1}>1 Min</option>
                                                    <option value={5}>5 Min</option>
                                                    <option value={15}>15 Min</option>
                                                    <option value={30}>30 Min</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <AnimatePresence>
                                {editingSite && (
                                    <motion.div
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: '400px' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                        style={{
                                            height: '100%',
                                            backgroundColor: 'var(--menu-bg)',
                                            backdropFilter: 'blur(var(--blur-heavy))',
                                            borderLeft: '1px solid var(--border-color)',
                                            padding: '40px 32px',
                                            boxShadow: 'var(--shadow-premium)',
                                            zIndex: 10,
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{editingSite.name ? 'Edit Website' : 'Add Website'}</h3>
                                            <button onClick={() => setEditingSite(null)} className="tool-btn" style={{ width: '32px', height: '32px', borderRadius: '50%' }}><X size={18} /></button>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {/* Branding Section */}
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                padding: '24px',
                                                backgroundColor: 'var(--card-bg)',
                                                borderRadius: '24px',
                                                border: '1px solid var(--border-color)',
                                                marginBottom: '8px',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(to bottom, var(--accent-glow), transparent)', opacity: 0.3 }} />

                                                <div
                                                    style={{
                                                        width: '88px', height: '88px',
                                                        backgroundColor: 'var(--menu-bg)',
                                                        borderRadius: '22px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        border: '1px solid var(--border-color)',
                                                        boxShadow: 'var(--shadow-premium)',
                                                        transition: 'all var(--duration-standard) var(--spring-easing)',
                                                        zIndex: 2
                                                    }}
                                                    onClick={handlePickIcon}
                                                >
                                                    {editingSite.icon ? <img src={editingSite.icon} style={{ width: '56px', height: '56px', objectFit: 'contain' }} alt="" /> : <Globe size={36} style={{ color: 'var(--accent-color)', opacity: 0.5 }} />}
                                                </div>
                                                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                                                    <button onClick={handlePickIcon} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.2px' }}>CHANGE ICON</button>
                                                    <button onClick={handleResetIcon} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}>RESET</button>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <div className="input-group" style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '4px',
                                                    padding: '12px 16px',
                                                    backgroundColor: 'var(--btn-hover-bg)',
                                                    borderRadius: '16px',
                                                    border: '1px solid var(--border-color)',
                                                    transition: 'border-color 0.2s ease'
                                                }}>
                                                    <label style={{ color: 'var(--accent-color)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Display Name</label>
                                                    <input
                                                        type="text"
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            padding: 0,
                                                            color: 'var(--text-primary)',
                                                            fontSize: '15px',
                                                            outline: 'none',
                                                            width: '100%'
                                                        }}
                                                        placeholder="Enter site name..."
                                                        value={editingSite.name}
                                                        onChange={e => setEditingSite({ ...editingSite, name: e.target.value })}
                                                    />
                                                </div>

                                                <div className="input-group" style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '4px',
                                                    padding: '12px 16px',
                                                    backgroundColor: 'var(--btn-hover-bg)',
                                                    borderRadius: '16px',
                                                    border: '1px solid var(--border-color)'
                                                }}>
                                                    <label style={{ color: 'var(--accent-color)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>URL</label>
                                                    <input
                                                        type="text"
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            padding: 0,
                                                            color: 'var(--text-primary)',
                                                            fontSize: '15px',
                                                            outline: 'none',
                                                            width: '100%'
                                                        }}
                                                        placeholder="https://example.com"
                                                        value={editingSite.url}
                                                        onChange={e => setEditingSite({ ...editingSite, url: e.target.value })}
                                                    />
                                                </div>

                                                <div className="input-group" style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '4px',
                                                    padding: '12px 16px',
                                                    backgroundColor: 'var(--btn-hover-bg)',
                                                    borderRadius: '16px',
                                                    border: '1px solid var(--border-color)'
                                                }}>
                                                    <label style={{ color: 'var(--accent-color)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</label>
                                                    <input
                                                        type="text"
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            padding: 0,
                                                            color: 'var(--text-primary)',
                                                            fontSize: '15px',
                                                            outline: 'none',
                                                            width: '100%'
                                                        }}
                                                        placeholder="e.g. Work, Social, Tools"
                                                        value={editingSite.group || ''}
                                                        onChange={e => setEditingSite({ ...editingSite, group: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '14px',
                                                padding: '16px 20px', backgroundColor: 'var(--btn-hover-bg)',
                                                borderRadius: '16px', border: '1px solid var(--border-color)',
                                                marginTop: '8px'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={!!editingSite.requirePassword}
                                                    onChange={e => setEditingSite({ ...editingSite, requirePassword: e.target.checked })}
                                                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.2px' }}>Security Lock</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Authentication required to open</div>
                                                </div>
                                            </div>

                                            <button
                                                className="btn-primary"
                                                style={{
                                                    marginTop: '20px',
                                                    height: '52px',
                                                    borderRadius: '16px',
                                                    fontSize: '15px',
                                                    fontWeight: 600,
                                                    width: '100%',
                                                    boxShadow: '0 8px 20px var(--accent-glow)'
                                                }}
                                                onClick={handleSaveSite}
                                            >
                                                {editingSite.id.startsWith('site-') ? 'Create Website' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <SelectiveExportModal
                            isOpen={isExportModalOpen}
                            onClose={() => setIsExportModalOpen(false)}
                            websites={localConfig.websites}
                            onExport={handleExportSelected}
                        />

                        <AnimatePresence>
                            {importData && (
                                <div className="modal-overlay" style={{ zIndex: 10002, display: 'flex', opacity: 1, visibility: 'visible' }} onClick={() => setImportData(null)}>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                        className="modal-content"
                                        style={{ width: '400px', padding: '32px', textAlign: 'center' }}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)', margin: '0 auto 20px auto' }}>
                                            <Upload size={28} />
                                        </div>
                                        <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>Import Ready</h3>
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 32px 0' }}>Found {importData.websites.length} website entries.</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <button className="btn-primary" style={{ width: '100%', height: '40px', borderRadius: '10px' }} onClick={() => handleImportAction('merge')}>Merge with existing</button>
                                            <button className="btn-secondary" style={{ width: '100%', height: '40px', borderRadius: '10px', color: '#ef4444' }} onClick={() => handleImportAction('overwrite')}>Replace current config</button>
                                            <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', marginTop: '12px', cursor: 'pointer', fontSize: '13px' }} onClick={() => setImportData(null)}>Cancel</button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default SettingsModal
