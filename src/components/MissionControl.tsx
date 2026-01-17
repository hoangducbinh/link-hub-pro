import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Globe, ExternalLink } from 'lucide-react'
import { WebViewInfo } from './WebViewManager'

interface MissionControlProps {
    isOpen: boolean
    onClose: () => void
    webViews: WebViewInfo[]
    onSelect: (id: string) => void
    onCloseWebView: (id: string) => void
}

const MissionControl: React.FC<MissionControlProps> = ({
    isOpen,
    onClose,
    webViews,
    onSelect,
    onCloseWebView
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="mission-control-overlay"
                    initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
                    exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9998,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '60px',
                    }}
                >
                    <motion.div
                        className="mission-control-header"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        style={{ marginBottom: '40px', textAlign: 'center' }}
                    >
                        <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'white', margin: 0 }}>Mission Control</h2>
                        <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: '8px' }}>Manage your active sessions</p>
                    </motion.div>

                    <div
                        className="mission-control-grid"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '24px',
                            width: '100%',
                            maxWidth: '1200px',
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
                                    key={wv.id}
                                    layoutId={wv.id}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onSelect(wv.id)
                                    }}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                        borderRadius: '16px',
                                        padding: '16px',
                                        cursor: 'pointer',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px',
                                        backdropFilter: 'blur(10px)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Globe size={18} color="rgba(255,255,255,0.7)" />
                                        </div>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                color: 'white',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {wv.name}
                                            </div>
                                            <div style={{
                                                fontSize: '11px',
                                                color: 'rgba(255,255,255,0.4)',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {wv.url}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{
                                        height: '140px',
                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}>
                                        {wv.screenshot ? (
                                            <img
                                                src={wv.screenshot}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    objectPosition: 'top'
                                                }}
                                                alt="Preview"
                                            />
                                        ) : (
                                            <ExternalLink size={24} color="rgba(255,255,255,0.1)" />
                                        )}
                                    </div>

                                    <button
                                        className="close-wv-btn"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onCloseWebView(wv.id)
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: '-8px',
                                            right: '-8px',
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            backgroundColor: '#e81123',
                                            border: 'none',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                            zIndex: 2,
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default MissionControl
