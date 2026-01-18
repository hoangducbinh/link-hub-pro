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
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="mission-control-content"
                        style={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            maxWidth: '1200px',
                            zIndex: 1
                        }}
                    >
                        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'white', margin: 0 }}>Mission Control</h2>
                            <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: '8px' }}>Manage your active sessions</p>
                        </div>

                        <div
                            className="mission-control-grid"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '24px',
                                width: '100%',
                                maxHeight: '70vh',
                                overflowY: 'auto',
                                padding: '10px',
                            }}
                        >
                            {webViews.length === 0 ? (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '40px' }}>
                                    No active pages
                                </div>
                            ) : (
                                webViews.map((wv) => (
                                    <motion.div
                                        key={wv.instanceId}
                                        whileHover={{ y: -5, scale: 1.02 }}
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
                                            backgroundColor: 'rgba(30, 30, 30, 0.6)',
                                            borderRadius: '16px',
                                            padding: '0',
                                            cursor: 'pointer',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0',
                                            backdropFilter: 'blur(20px)',
                                            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                                            overflow: 'hidden',
                                            transition: 'transform 0.2s',
                                            height: '240px'
                                        }}
                                    >
                                        {/* Header */}
                                        <div style={{
                                            padding: '12px 16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            backgroundColor: 'rgba(255,255,255,0.02)'
                                        }}>
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '6px',
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <Globe size={14} color="rgba(255,255,255,0.8)" />
                                            </div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <div style={{
                                                    fontSize: '13px',
                                                    fontWeight: 500,
                                                    color: 'rgba(255,255,255,0.9)',
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
                                            backgroundColor: '#000',
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
                                                    <div style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        borderRadius: '12px',
                                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <Globe size={24} color="rgba(255,255,255,0.2)" />
                                                    </div>
                                                    <span style={{ fontSize: '12px', color: 'rgba(129, 205, 243, 0.2)' }}>Chưa chụp kịp, lướt chậm thôi!</span>
                                                </div>
                                            )}
                                        </div>


                                    </motion.div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            style={{
                                position: 'fixed',
                                top: '40px',
                                right: '40px',
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                opacity: 0.5,
                            }}
                        >
                            <X size={32} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default MissionControl
