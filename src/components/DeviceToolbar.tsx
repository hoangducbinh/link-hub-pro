import React from 'react'
import { RotateCw, X } from 'lucide-react'

export const DEVICES = [
    { id: 'iphone-12', name: 'iPhone 12 Pro', width: 390, height: 844, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1' },
    { id: 'pixel-5', name: 'Pixel 5', width: 393, height: 851, ua: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36' },
    { id: 'ipad-air', name: 'iPad Air', width: 820, height: 1180, ua: 'Mozilla/5.0 (iPad; CPU OS 13_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 Mobile/15E148 Safari/604.1' },
    { id: 'responsive', name: 'Responsive', width: 400, height: 800, ua: '' },
]

interface DeviceToolbarProps {
    currentDevice: string
    onSelectDevice: (device: string) => void
    onRotate: () => void
    onClose: () => void
    scale: number
    onScaleChange: (scale: number) => void
}

const DeviceToolbar: React.FC<DeviceToolbarProps> = ({ currentDevice, onSelectDevice, onRotate, onClose, scale, onScaleChange }) => {
    return (
        <div style={{
            height: '40px',
            background: 'var(--menu-bg)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '16px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            backdropFilter: 'blur(var(--blur-heavy))',
            zIndex: 100,
            position: 'relative'
        }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                    value={currentDevice}
                    onChange={(e) => onSelectDevice(e.target.value)}
                    style={{
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        outline: 'none'
                    }}
                >
                    {DEVICES.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
            </div>

            <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>Scale:</span>
                <select
                    value={scale}
                    onChange={(e) => onScaleChange(Number(e.target.value))}
                    style={{
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '4px 8px',
                        borderRadius: '4px'
                    }}
                >
                    <option value={0.5}>50%</option>
                    <option value={0.75}>75%</option>
                    <option value={1}>100%</option>
                    <option value={1.25}>125%</option>
                </select>
            </div>

            <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />

            <button onClick={onRotate} className="icon-btn" title="Rotate" style={{
                background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex'
            }}>
                <RotateCw size={16} />
            </button>

            <div style={{ flex: 1 }} />

            <button onClick={onClose} className="icon-btn" title="Exit Mobile Mode" style={{
                background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex'
            }}>
                <X size={16} />
            </button>
        </div>
    )
}

export default DeviceToolbar
