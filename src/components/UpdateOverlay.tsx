import React from 'react'
import { Download, RefreshCw, X } from 'lucide-react'

const UpdateOverlay: React.FC = () => {
    const [updateStatus, setUpdateStatus] = React.useState<{ status: string, version?: string, error?: string } | null>(null)
    const [progress, setProgress] = React.useState<{ percent: number } | null>(null)
    const [show, setShow] = React.useState(false)

    React.useEffect(() => {
        const electronAPI = (window as any).electronAPI
        if (!electronAPI) return

        const cleanupStatus = electronAPI.onUpdateStatus((data: any) => {
            console.log('Update Status:', data)
            setUpdateStatus(data)
            if (data.status === 'available' || data.status === 'downloaded' || data.status === 'error') {
                setShow(true)
            }
        })

        const cleanupProgress = electronAPI.onUpdateProgress((data: any) => {
            setProgress(data)
        })

        return () => {
            cleanupStatus()
            cleanupProgress()
        }
    }, [])

    if (!show || !updateStatus) return null

    const handleDownload = () => {
        (window as any).electronAPI.downloadUpdate()
        setUpdateStatus({ status: 'downloading' })
    }

    const handleInstall = () => {
        (window as any).electronAPI.installUpdate()
    }

    const handleDismiss = () => {
        setShow(false)
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'var(--modal-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: 'var(--shadow-premium)',
            zIndex: 10050,
            maxWidth: '320px',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'slideUp 0.3s ease'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', marginTop: 1 }}>
                    {updateStatus.status === 'available' && 'New Update Available'}
                    {updateStatus.status === 'downloading' && 'Downloading Update...'}
                    {updateStatus.status === 'downloaded' && 'Update Ready'}
                    {updateStatus.status === 'error' && 'Update Failed'}
                </span>
                <button onClick={handleDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <X size={16} />
                </button>
            </div>

            {updateStatus.status === 'available' && (
                <>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                        Version {updateStatus.version} is now available.
                    </p>
                    <button
                        onClick={handleDownload}
                        className="btn-primary"
                        style={{ width: '100%', fontSize: '13px', padding: '8px', borderRadius: '8px' }}
                    >
                        <Download size={14} /> Download Update
                    </button>
                </>
            )}

            {updateStatus.status === 'downloading' && progress && (
                <div style={{ width: '100%', height: '4px', background: 'var(--btn-hover-bg)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress.percent}%`, height: '100%', background: 'var(--accent-color)', transition: 'width 0.2s' }} />
                </div>
            )}

            {updateStatus.status === 'downloaded' && (
                <>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                        Update downloaded. Restart now using?
                    </p>
                    <button
                        onClick={handleInstall}
                        className="btn-primary"
                        style={{ width: '100%', fontSize: '13px', padding: '8px', borderRadius: '8px', background: '#10b981' }}
                    >
                        <RefreshCw size={14} /> Restart & Install
                    </button>
                </>
            )}

            {updateStatus.status === 'error' && (
                <p style={{ fontSize: '12px', color: '#ef4444', margin: 0 }}>
                    {updateStatus.error || 'An unknown error occurred.'}
                </p>
            )}
        </div>
    )
}

export default UpdateOverlay
