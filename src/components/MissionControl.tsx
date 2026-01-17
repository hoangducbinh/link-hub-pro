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
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
                                                    {wv.instanceId}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{
                                            height: '140px',
                                            backgroundColor: 'rgba(0,0,0,0.3)',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '1px solid rgba(255,255,255,0.1)',
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
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onCloseWebView(wv.instanceId)
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
