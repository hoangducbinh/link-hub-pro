import React from 'react'
import { motion } from 'framer-motion'
import { Layout, Columns, Rows, LayoutGrid } from 'lucide-react'

interface LayoutMenuProps {
    isOpen: boolean
    onClose: () => void
    anchorRect: DOMRect | null
    currentLayout: string
    onSetLayout: (layout: string) => void
}

const LayoutMenu: React.FC<LayoutMenuProps> = ({ isOpen, onClose, anchorRect, currentLayout, onSetLayout }) => {
    if (!isOpen || !anchorRect) return null

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
        const target = e.currentTarget as HTMLElement
        // Keep active style if it's the active layout, otherwise transparent
        // We will handle active styling via class or inline check in render
        if (!target.classList.contains('active-layout')) {
            target.style.backgroundColor = 'transparent'
        } else {
            target.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'
        }
    }

    const getButtonStyle = (layoutId: string) => {
        const isActive = currentLayout === layoutId
        return {
            ...itemStyle,
            backgroundColor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            color: isActive ? '#60a5fa' : 'white'
        }
    }

    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 10006 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                    position: 'absolute',
                    top: anchorRect.bottom + 8,
                    left: anchorRect.left - 180 + (anchorRect.width / 2), // Center aligned mostly
                    width: '180px',
                    backgroundColor: 'rgba(28, 28, 28, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    padding: '6px',
                    color: 'white'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.3)', padding: '8px 12px', letterSpacing: '0.1em' }}>Layout</div>

                <button
                    className={currentLayout === 'single' ? 'active-layout' : ''}
                    onClick={() => { onSetLayout('single'); onClose(); }}
                    style={getButtonStyle('single')}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={leaveStyle}
                >
                    <Layout size={16} />
                    <span>Single View</span>
                </button>

                <button
                    className={currentLayout === 'split-h' ? 'active-layout' : ''}
                    onClick={() => { onSetLayout('split-h'); onClose(); }}
                    style={getButtonStyle('split-h')}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={leaveStyle}
                >
                    <Columns size={16} />
                    <span>Split Horizontal</span>
                </button>

                <button
                    className={currentLayout === 'split-v' ? 'active-layout' : ''}
                    onClick={() => { onSetLayout('split-v'); onClose(); }}
                    style={getButtonStyle('split-v')}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={leaveStyle}
                >
                    <Rows size={16} />
                    <span>Split Vertical</span>
                </button>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

                <button
                    className={currentLayout === 'grid-2x2' ? 'active-layout' : ''}
                    onClick={() => { onSetLayout('grid-2x2'); onClose(); }}
                    style={getButtonStyle('grid-2x2')}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={leaveStyle}
                >
                    <LayoutGrid size={16} />
                    <span>Grid 2×2</span>
                </button>

                <button
                    className={currentLayout === 'grid-3x3' ? 'active-layout' : ''}
                    onClick={() => { onSetLayout('grid-3x3'); onClose(); }}
                    style={getButtonStyle('grid-3x3')}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={leaveStyle}
                >
                    <LayoutGrid size={16} />
                    <span>Grid 3×3</span>
                </button>

                <button
                    className={currentLayout === 'grid-4x4' ? 'active-layout' : ''}
                    onClick={() => { onSetLayout('grid-4x4'); onClose(); }}
                    style={getButtonStyle('grid-4x4')}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={leaveStyle}
                >
                    <LayoutGrid size={16} />
                    <span>Grid 4×4</span>
                </button>

                <button
                    className={currentLayout === 'grid-mobile-3x4' ? 'active-layout' : ''}
                    onClick={() => { onSetLayout('grid-mobile-3x4'); onClose(); }}
                    style={getButtonStyle('grid-mobile-3x4')}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={leaveStyle}
                >
                    <LayoutGrid size={16} />
                    <span>Mobile 3×4</span>
                </button>

                <button
                    className={currentLayout === 'grid-mobile-8x3' ? 'active-layout' : ''}
                    onClick={() => { onSetLayout('grid-mobile-8x3'); onClose(); }}
                    style={getButtonStyle('grid-mobile-8x3')}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={leaveStyle}
                >
                    <LayoutGrid size={16} />
                    <span>Mobile 8×3</span>
                </button>

                <button
                    className={currentLayout === 'grid-mobile-8x4' ? 'active-layout' : ''}
                    onClick={() => { onSetLayout('grid-mobile-8x4'); onClose(); }}
                    style={getButtonStyle('grid-mobile-8x4')}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={leaveStyle}
                >
                    <LayoutGrid size={16} />
                    <span>Mobile 8×4</span>
                </button>

                <button
                    className={currentLayout === 'grid-mobile-4x6' ? 'active-layout' : ''}
                    onClick={() => { onSetLayout('grid-mobile-4x6'); onClose(); }}
                    style={getButtonStyle('grid-mobile-4x6')}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={leaveStyle}
                >
                    <LayoutGrid size={16} />
                    <span>Mobile 4×6</span>
                </button>

            </motion.div>
        </div>
    )
}

export default LayoutMenu
