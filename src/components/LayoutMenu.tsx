import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Layout, Columns, Rows, LayoutGrid, Check } from 'lucide-react'

interface LayoutMenuProps {
    isOpen: boolean
    onClose: () => void
    anchorRect: DOMRect | null
    currentLayout: string
    onSetLayout: (layout: string) => void
}

const LAYOUT_GROUPS = [
    {
        label: 'Basic',
        items: [
            { id: 'single', label: 'Single View', icon: Layout },
            { id: 'split-h', label: 'Split Horizontal', icon: Columns },
            { id: 'split-v', label: 'Split Vertical', icon: Rows },
        ]
    },
    {
        label: 'Desktop Grid',
        items: [
            { id: 'grid-2x2', label: 'Grid 2×2', icon: LayoutGrid },
            { id: 'grid-3x3', label: 'Grid 3×3', icon: LayoutGrid },
            { id: 'grid-4x4', label: 'Grid 4×4', icon: LayoutGrid },
        ]
    },
    {
        label: 'Mobile Grid',
        items: [
            { id: 'grid-mobile-3x4', label: 'Mobile 3×4', icon: LayoutGrid },
            { id: 'grid-mobile-8x3', label: 'Mobile 8×3', icon: LayoutGrid },
            { id: 'grid-mobile-8x4', label: 'Mobile 8×4', icon: LayoutGrid },
            { id: 'grid-mobile-4x6', label: 'Mobile 4×6', icon: LayoutGrid },
        ]
    }
]

const LayoutMenu: React.FC<LayoutMenuProps> = ({ isOpen, onClose, anchorRect, currentLayout, onSetLayout }) => {
    return createPortal(
        <AnimatePresence>
            {isOpen && anchorRect && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100000, // Very high z-index
                        backgroundColor: 'rgba(0,0,0,0.01)',
                        cursor: 'default'
                    }}
                    onMouseDown={onClose} // Use onMouseDown for even faster response
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        style={{
                            position: 'absolute',
                            top: anchorRect.bottom + 12,
                            left: Math.min(window.innerWidth - 240 - 12, Math.max(12, anchorRect.left - 200 + (anchorRect.width / 2))),
                            width: '240px',
                            maxHeight: '80vh',
                            overflowY: 'auto',
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
                        {LAYOUT_GROUPS.map((group, groupIdx) => (
                            <React.Fragment key={group.label}>
                                {groupIdx > 0 && <div style={{ height: '1px', background: 'var(--border-color)', margin: '6px 8px' }} />}
                                <div style={{
                                    fontSize: '10px',
                                    textTransform: 'uppercase',
                                    fontWeight: 700,
                                    color: 'var(--text-tertiary)',
                                    padding: '8px 12px 4px 12px',
                                    letterSpacing: '0.1em'
                                }}>
                                    {group.label}
                                </div>
                                {group.items.map(item => {
                                    const isActive = currentLayout === item.id
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => { onSetLayout(item.id); onClose(); }}
                                            className="layout-menu-item"
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '10px 12px',
                                                border: 'none',
                                                background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                                                borderRadius: '10px',
                                                color: isActive ? 'var(--accent-color)' : 'white',
                                                fontSize: '13px',
                                                fontWeight: isActive ? 600 : 400,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                position: 'relative'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                                            }}
                                        >
                                            <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} style={{ opacity: isActive ? 1 : 0.6 }} />
                                            <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="layout-active-check"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    style={{ display: 'flex', alignItems: 'center' }}
                                                >
                                                    <Check size={14} strokeWidth={3} />
                                                </motion.div>
                                            )}
                                        </button>
                                    )
                                })}
                            </React.Fragment>
                        ))}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}

export default LayoutMenu
