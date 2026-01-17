import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Globe, X } from 'lucide-react'

export interface AppIcon {
    id: string
    name: string
    url: string
    icon?: string // URL to icon
}

interface LauncherProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (app: AppIcon) => void
    apps: AppIcon[]
}

const Launcher: React.FC<LauncherProps> = ({ isOpen, onClose, onSelect, apps }) => {
    const [search, setSearch] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
        } else {
            setSearch('')
        }
    }, [isOpen])

    const filteredApps = apps.filter((app) =>
        app.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="launcher-overlay"
                    initial={{ opacity: 0, scale: 1.1, backdropFilter: 'blur(0px)' }}
                    animate={{ opacity: 1, scale: 1, backdropFilter: 'blur(20px)' }}
                    exit={{ opacity: 0, scale: 1.1, backdropFilter: 'blur(0px)' }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '80px 40px',
                        color: 'white',
                    }}
                >
                    {/* Search Bar */}
                    <div
                        className="search-container"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '600px',
                            marginBottom: '60px',
                            position: 'relative',
                        }}
                    >
                        <Search
                            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}
                            size={20}
                        />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search apps or websites..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '16px 16px 16px 48px',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                fontSize: '18px',
                                outline: 'none',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                            }}
                        />
                    </div>

                    {/* Grid */}
                    <motion.div
                        className="apps-grid"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                            gap: '40px',
                            width: '100%',
                            maxWidth: '1000px',
                            overflowY: 'auto',
                        }}
                    >
                        {filteredApps.map((app) => (
                            <motion.div
                                key={app.id}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onSelect(app)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                }}
                            >
                                <div
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '20px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '12px',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                                        backdropFilter: 'blur(5px)',
                                        fontSize: '32px',
                                    }}
                                >
                                    {app.icon ? <img src={app.icon} style={{ width: '48px', height: '48px' }} /> : <Globe size={40} />}
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 500, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                    {app.name}
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>

                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
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
    )
}

export default Launcher
