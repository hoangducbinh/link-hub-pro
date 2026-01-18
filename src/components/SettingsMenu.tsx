import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Share2, Layout, HelpCircle } from 'lucide-react'

interface SettingsMenuProps {
    isOpen: boolean
    onClose: () => void
    anchorRect: DOMRect | null
    onOpenConfig: () => void
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose, anchorRect, onOpenConfig }) => {
    const itemStyle: React.CSSProperties = {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        border: 'none',
        background: 'none',
        borderRadius: '10px',
        color: 'var(--text-primary)',
        fontSize: '13.5px',
        fontWeight: 400,
        cursor: 'pointer',
        transition: 'all var(--duration-fast) var(--standard-easing)'
    }

    const hoverStyle = (e: React.MouseEvent) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--btn-hover-bg)';
        (e.currentTarget as HTMLElement).style.transform = 'translateX(2px)';
    }

    const leaveStyle = (e: React.MouseEvent) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
        (e.currentTarget as HTMLElement).style.transform = 'translateX(0)';
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
                            backgroundColor: 'var(--menu-bg)',
                            backdropFilter: 'blur(var(--blur-medium))',
                            border: '1px solid var(--border-bright)',
                            borderRadius: '16px',
                            boxShadow: 'var(--shadow-premium)',
                            padding: '8px',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-color)', padding: '10px 14px', letterSpacing: '0.12em', opacity: 0.9 }}>Configuration</div>

                        <button
                            onClick={() => { onOpenConfig(); onClose(); }}
                            style={itemStyle}
                            onMouseEnter={hoverStyle}
                            onMouseLeave={leaveStyle}
                        >
                            <Settings size={16} color="#3b82f6" />
                            <span>Manage Websites</span>
                        </button>


                        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '6px 4px' }} />
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary)', padding: '10px 14px', letterSpacing: '0.12em' }}>System</div>

                        <button style={{ ...itemStyle, opacity: 0.5, cursor: 'not-allowed' }}>
                            <Layout size={16} color="var(--text-secondary)" />
                            <span>UI Preferences</span>
                        </button>

                        <button style={{ ...itemStyle, opacity: 0.5, cursor: 'not-allowed' }}>
                            <Share2 size={16} color="var(--text-secondary)" />
                            <span>Sync Settings</span>
                        </button>

                        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '6px 4px' }} />

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
