import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Download, Upload, Share2, Layout, HelpCircle } from 'lucide-react'

interface SettingsMenuProps {
    isOpen: boolean
    onClose: () => void
    anchorRect: DOMRect | null
    onOpenConfig: () => void
    onImport: () => void
    onExport: () => void
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose, anchorRect, onOpenConfig, onImport, onExport }) => {
    const itemStyle: React.CSSProperties = {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        border: 'none',
        background: 'none',
        borderRadius: '8px',
        color: 'white',
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    }

    const hoverStyle = (e: React.MouseEvent) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
    }

    const leaveStyle = (e: React.MouseEvent) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
    }

    return createPortal(
        <AnimatePresence>
            {isOpen && anchorRect && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100000,
                        backgroundColor: 'rgba(0,0,0,0.01)',
                        cursor: 'default'
                    }}
                    onMouseDown={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        style={{
                            position: 'absolute',
                            top: anchorRect.bottom + 12,
                            left: Math.min(window.innerWidth - 240 - 12, Math.max(12, anchorRect.left - 200 + anchorRect.width)),
                            width: '240px',
                            backgroundColor: 'rgba(18, 18, 18, 0.85)',
                            backdropFilter: 'blur(var(--blur-medium))',
                            border: '1px solid var(--border-bright)',
                            borderRadius: '16px',
                            boxShadow: 'var(--shadow-premium)',
                            padding: '8px',
                            color: 'white',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.3)', padding: '8px 12px', letterSpacing: '0.1em' }}>Configuration</div>

                        <button
                            onClick={() => { onOpenConfig(); onClose(); }}
                            style={itemStyle}
                            onMouseEnter={hoverStyle}
                            onMouseLeave={leaveStyle}
                        >
                            <Settings size={16} color="#3b82f6" />
                            <span>Manage Websites</span>
                        </button>

                        {/* <button
                            onClick={() => { onImport(); onClose(); }}
                            style={itemStyle}
                            onMouseEnter={hoverStyle}
                            onMouseLeave={leaveStyle}
                        >
                            <Download size={16} color="#22c55e" />
                            <span>Import Config (JSON)</span>
                        </button>

                        <button
                            onClick={() => { onExport(); onClose(); }}
                            style={itemStyle}
                            onMouseEnter={hoverStyle}
                            onMouseLeave={leaveStyle}
                        >
                            <Upload size={16} color="#a855f7" />
                            <span>Export Config (JSON)</span>
                        </button> */}

                        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.3)', padding: '8px 12px', letterSpacing: '0.1em' }}>System</div>

                        <button style={{ ...itemStyle, opacity: 0.5, cursor: 'not-allowed' }}>
                            <Layout size={16} />
                            <span>UI Preferences</span>
                        </button>

                        <button style={{ ...itemStyle, opacity: 0.5, cursor: 'not-allowed' }}>
                            <Share2 size={16} />
                            <span>Sync Settings</span>
                        </button>

                        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />

                        <button
                            style={itemStyle}
                            onMouseEnter={hoverStyle}
                            onMouseLeave={leaveStyle}
                        >
                            <HelpCircle size={16} color="rgba(255,255,255,0.4)" />
                            <span>Help & Docs</span>
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}

export default SettingsMenu
