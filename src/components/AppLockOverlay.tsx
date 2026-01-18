import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ChevronRight, AlertCircle } from 'lucide-react'

interface AppLockOverlayProps {
    onUnlock: () => void
    hash: string
    recoveryHash: string
}

const AppLockOverlay: React.FC<AppLockOverlayProps> = ({ onUnlock, hash, recoveryHash }) => {
    const [password, setPassword] = useState('')
    const [recoveryKey, setRecoveryKey] = useState('')
    const [isRecoveryMode, setIsRecoveryMode] = useState(false)
    const [error, setError] = useState(false)
    const [shaking, setShaking] = useState(false)

    const handleUnlock = async (passOverride?: string) => {
        const passToVerify = passOverride !== undefined ? passOverride : (isRecoveryMode ? recoveryKey : password)
        if (!passToVerify) return

        const hashToUse = isRecoveryMode ? recoveryHash : hash
        const isValid = await (window as any).electronAPI.verifyPassword(passToVerify, hashToUse)

        if (isValid) {
            onUnlock()
        } else if (passOverride === undefined) {
            setError(true)
            setShaking(true)
            setTimeout(() => setShaking(false), 500)
            if (isRecoveryMode) setRecoveryKey('')
            else setPassword('')
        }
    }

    // Auto-unlock logic
    useEffect(() => {
        if (!isRecoveryMode && password.length >= 4) {
            handleUnlock(password)
        }
    }, [password, isRecoveryMode])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleUnlock()
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.95)', // High opacity to hide content without blur
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
            }}
        >
            <motion.div
                animate={shaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                style={{
                    width: '320px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px'
                }}
            >
                <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <Lock size={32} style={{ color: '#3b82f6' }} />
                </div>

                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '20px', margin: '0 0 8px 0', fontWeight: 600 }}>
                        {isRecoveryMode ? 'Account Recovery' : 'App Locked'}
                    </h2>
                    <p style={{ fontSize: '13px', opacity: 0.5, margin: 0 }}>
                        {isRecoveryMode ? 'Enter your Secret Recovery Key' : 'Please enter your password to continue'}
                    </p>
                </div>

                <div style={{ width: '100%', position: 'relative' }}>
                    <input
                        autoFocus
                        type="password"
                        value={isRecoveryMode ? recoveryKey : password}
                        onChange={e => {
                            if (isRecoveryMode) setRecoveryKey(e.target.value)
                            else setPassword(e.target.value)
                            setError(false)
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={isRecoveryMode ? "Secret Recovery Key" : "Password"}
                        style={{
                            width: '100%',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${error ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '12px',
                            padding: '12px 16px',
                            color: 'white',
                            fontSize: '15px',
                            outline: 'none',
                            transition: 'all 0.2s',
                            textAlign: 'center'
                        }}
                    />
                    <button
                        onClick={() => handleUnlock()}
                        style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: '#3b82f6',
                            border: 'none',
                            borderRadius: '8px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white'
                        }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#ef4444',
                                fontSize: '12px',
                                fontWeight: 500
                            }}
                        >
                            <AlertCircle size={14} />
                            Incorrect password
                        </motion.div>
                    )}
                </AnimatePresence>

                {!recoveryHash && (
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to reset your password? This will disable App Lock.')) {
                                (window as any).electronAPI.saveConfig({
                                    name: 'default.json',
                                    action: 'reset-security'
                                }).then(() => {
                                    window.location.reload()
                                })
                            }
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.3)',
                            fontSize: '11px',
                            cursor: 'pointer',
                            marginTop: '8px',
                            textDecoration: 'underline'
                        }}
                    >
                        Forgot Password?
                    </button>
                )}

                {recoveryHash && (
                    <button
                        onClick={() => {
                            setIsRecoveryMode(!isRecoveryMode)
                            setError(false)
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.3)',
                            fontSize: '11px',
                            cursor: 'pointer',
                            marginTop: '8px',
                            textDecoration: 'underline'
                        }}
                    >
                        {isRecoveryMode ? 'Back to Password' : 'Forgot Password?'}
                    </button>
                )}
            </motion.div>
        </motion.div>
    )
}

export default AppLockOverlay
