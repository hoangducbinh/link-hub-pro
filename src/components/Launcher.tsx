import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Globe, ArrowRight } from 'lucide-react'

export interface AppIcon {
    id: string
    name: string
    url: string
    icon?: string
}

interface LauncherProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (app: AppIcon, forceNewInstance?: boolean) => void
    apps: AppIcon[]
}

const Launcher: React.FC<LauncherProps> = ({ isOpen, onClose, onSelect, apps }) => {
    const [search, setSearch] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50)
        } else {
            setSearch('')
            setActiveIndex(0)
        }
    }, [isOpen])

    const filteredApps = apps.filter((app) =>
        app.name.toLowerCase().includes(search.toLowerCase())
    )

    // Handle arrow key navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return

            if (e.key === 'ArrowRight') {
                setActiveIndex(prev => (prev + 1) % filteredApps.length)
            } else if (e.key === 'ArrowLeft') {
                setActiveIndex(prev => (prev - 1 + filteredApps.length) % filteredApps.length)
            } else if (e.key === 'ArrowDown') {
                // Maybe move focus to grid? Keeping simple for now
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, filteredApps.length])


    return (
        <div className={`launcher-overlay ${isOpen ? 'open' : ''}`} style={{
            backgroundColor: 'transparent',
        }}>
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
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 30,
                            mass: 0.8
                        }}
                        className="launcher-content"
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '900px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            zIndex: 1
                        }}
                    >
                        {/* Search Bar Container */}
                        <div style={{
                            width: '100%',
                            padding: '30px 0',
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <div style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: '500px', // Slimmer width
                            }}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            if (search.trim()) {
                                                const query = search.trim();
                                                const isUrl = query.includes('.') && !query.includes(' ') || query.startsWith('http');
                                                if (isUrl) {
                                                    const url = query.startsWith('http') ? query : `https://${query}`;
                                                    const hostname = new URL(url).hostname;
                                                    onSelect({
                                                        id: `custom-${Date.now()}`,
                                                        name: hostname,
                                                        url: url,
                                                        icon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`
                                                    });
                                                } else if (filteredApps.length > 0) {
                                                    onSelect(filteredApps[activeIndex]);
                                                }
                                            } else {
                                                if (filteredApps.length > 0) onSelect(filteredApps[activeIndex]);
                                            }
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 42px', // Compact padding
                                        borderRadius: 'var(--radius-premium)',
                                        border: '1px solid var(--border-bright)',
                                        backgroundColor: 'rgba(20, 20, 20, 0.8)',
                                        color: 'white',
                                        fontSize: '15px',
                                        fontWeight: 400,
                                        outline: 'none',
                                        boxShadow: 'var(--shadow-premium)',
                                        backdropFilter: 'blur(var(--blur-medium))',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                                <Search
                                    style={{
                                        position: 'absolute',
                                        left: '14px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        opacity: 0.5,
                                        color: 'white'
                                    }}
                                    size={18}
                                />
                                {search.trim() && (
                                    <div style={{
                                        position: 'absolute',
                                        right: '14px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        color: 'rgba(255,255,255,0.4)',
                                        fontSize: '12px'
                                    }}>
                                        Open <ArrowRight size={12} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Apps Grid */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            alignContent: 'flex-start',
                            gap: '30px',
                            width: '100%',
                            maxWidth: '900px',
                            padding: '0 20px',
                            margin: '0 auto'
                        }}>
                            {filteredApps.map((app, index) => (
                                <motion.div
                                    key={app.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        delay: index * 0.02,
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onSelect(app, false)}
                                    onContextMenu={(e) => {
                                        e.preventDefault()
                                        onSelect(app, true)
                                    }}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    className="launcher-item"
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        position: 'relative',
                                        width: '80px',
                                        zIndex: activeIndex === index ? 10 : 1
                                    }}
                                >
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '16px',
                                        backgroundColor: activeIndex === index ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '10px',
                                        boxShadow: activeIndex === index ? '0 8px 32px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.1)',
                                        overflow: 'hidden',
                                        border: activeIndex === index ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
                                        backdropFilter: 'blur(12px)',
                                        position: 'relative',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}>
                                        {app.icon ? (
                                            <img
                                                src={app.icon}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    objectFit: 'contain',
                                                    borderRadius: '0',
                                                    filter: activeIndex === index ? 'none' : 'grayscale(0.2) opacity(0.8)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                alt={app.name}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).parentElement!.innerText = app.name[0];
                                                }}
                                            />
                                        ) : (
                                            <Globe size={36} color={activeIndex === index ? "white" : "rgba(255,255,255,0.6)"} />
                                        )}
                                    </div>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        color: 'rgba(255,255,255,0.9)',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                        width: '100%',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        padding: '0 2px',
                                        opacity: 0.9
                                    }}>
                                        {app.name}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Launcher
