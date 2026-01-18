import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Globe } from 'lucide-react'
import { WebViewInfo } from './WebViewManager'

interface MissionControlProps {
    isOpen: boolean
    onClose: () => void
    webViews: WebViewInfo[]
    screenshots: Record<string, string>
    onSelect: (id: string) => void
    onCloseWebView: (id: string) => void
}

const MissionControl: React.FC<MissionControlProps> = ({
    isOpen,
    onClose,
    webViews,
    screenshots,
    onSelect,
    onCloseWebView
}) => {
    const count = webViews.length
    let cols = 1
    if (count > 1) cols = 2
    if (count > 4) cols = 3
    if (count > 9) cols = 4
    if (count > 16) cols = 5

    let containerMaxWidth = '1200px'
    if (count === 1) containerMaxWidth = '400px'
    if (count === 2) containerMaxWidth = '800px'
    if (count === 3) containerMaxWidth = '800px'
    if (count === 4) containerMaxWidth = '800px'

    return (
        <div className={`mission-control-overlay ${isOpen ? 'open' : ''}`}>
            {/* Background overlay for clicks */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                }}
                onClick={onClose}
            />

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 450, mass: 0.8 }}
                        className="mission-control-content"
                        style={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            zIndex: 1,
                            pointerEvents: 'none'
                        }}
                    >
                        <div style={{ marginBottom: '32px', textAlign: 'center', pointerEvents: 'auto' }}>
                            <h2 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.8px' }}>Mission Control</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>Manage your active windows</p>
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                                gap: '24px',
                                width: '100%',
                                maxWidth: containerMaxWidth,
                                maxHeight: '80vh',
                                padding: '20px',
                                pointerEvents: 'auto',
                                boxSizing: 'border-box',
                                alignContent: 'center',
                                justifyItems: 'center',
                            }}
                        >
                            <AnimatePresence mode='popLayout'>
                                {webViews.length === 0 ? (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '40px' }}>
                                        No active pages
                                    </div>
                                ) : (
                                    webViews.map((wv) => (
                                        <motion.div
                                            key={wv.instanceId}
                                            layout
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                                            whileHover={{
                                                scale: 1.03,
                                                zIndex: 10,
                                                boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.8), 0 20px 40px rgba(0,0,0,0.4)', // Blue border glow + shadow
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onSelect(wv.instanceId)
                                            }}
                                            onContextMenu={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                onCloseWebView(wv.instanceId)
                                            }}
                                            style={{
                                                backgroundColor: 'var(--card-bg)',
                                                borderRadius: 'var(--radius-premium)',
                                                cursor: 'pointer',
                                                border: '1px solid var(--border-color)',
                                                position: 'relative',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                backdropFilter: 'blur(var(--blur-medium))',
                                                boxShadow: 'var(--shadow-premium)',
                                                overflow: 'hidden',
                                                width: '100%',
                                                aspectRatio: '16/10',
                                            }}
                                        >
                                            {/* Header */}
                                            <div style={{
                                                padding: '10px 14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                borderBottom: '1px solid var(--border-color)',
                                                backgroundColor: 'var(--btn-hover-bg)'
                                            }}>
                                                <div style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '5px',
                                                    backgroundColor: 'var(--btn-active-bg)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    {wv.icon ? (
                                                        <img src={wv.icon} style={{ width: '16px', height: '16px', borderRadius: '2px' }} alt="" />
                                                    ) : (
                                                        <Globe size={12} color="var(--text-secondary)" />
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <div style={{
                                                        fontSize: '12px',
                                                        fontWeight: 500,
                                                        color: 'var(--text-primary)',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {wv.name}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Preview Area */}
                                            <div style={{
                                                flex: 1,
                                                backgroundColor: 'var(--bg-color)',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}>
                                                {screenshots[wv.instanceId] ? (
                                                    <img
                                                        src={screenshots[wv.instanceId]}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            objectPosition: 'top left',
                                                            opacity: 0.9
                                                        }}
                                                        alt="Preview"
                                                    />
                                                ) : (
                                                    <div style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '12px',
                                                        backgroundColor: 'rgba(255,255,255,0.02)'
                                                    }}>
                                                        <Globe size={32} color="rgba(255,255,255,0.1)" />
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>

                                    ))
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={onClose}
                            className="tool-btn"
                            style={{
                                position: 'fixed',
                                top: '40px',
                                right: '40px',
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--btn-hover-bg)',
                                border: '1px solid var(--border-color)',
                                backdropFilter: 'blur(var(--blur-light))',
                                pointerEvents: 'auto',
                                opacity: 1
                            }}
                        >
                            <X size={24} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default MissionControl
