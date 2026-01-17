import { motion, AnimatePresence } from 'framer-motion';
import { Wrench } from 'lucide-react';
import { registry } from '../tools';

interface ToolMenuProps {
    activeToolIds: string[];
    onToggleTool: (toolId: string) => void;
}

const ToolMenu: React.FC<ToolMenuProps> = ({ activeToolIds, onToggleTool }) => {
    const [isOpen, setIsOpen] = useState(false);
    const tools = registry.getAllTools();

    return (
        <div style={{ position: 'relative' }} className="no-drag">
            <button
                className={`tool-btn ${activeToolIds.length > 0 ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Tools & Extensions"
            >
                <Wrench size={18} strokeWidth={1.5} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '8px',
                                width: '280px',
                                backgroundColor: 'rgba(20, 20, 20, 0.95)',
                                backdropFilter: 'blur(30px) saturate(150%)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '16px',
                                padding: '12px',
                                zIndex: 1000,
                                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ padding: '4px 12px 12px', fontSize: '12px', opacity: 0.6, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Toolbar Extensions
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {tools.map(tool => (
                                    <button
                                        key={tool.id}
                                        onClick={() => onToggleTool(tool.id)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '14px',
                                            padding: '12px',
                                            background: activeToolIds.includes(tool.id) ? 'rgba(59, 130, 246, 0.15)' : 'none',
                                            border: 'none',
                                            color: 'white',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            borderRadius: '10px',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            textAlign: 'left',
                                            position: 'relative'
                                        }}
                                        className="tool-menu-item"
                                    >
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '8px',
                                            backgroundColor: activeToolIds.includes(tool.id) ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                                            color: activeToolIds.includes(tool.id) ? 'white' : 'rgba(255,255,255,0.7)',
                                            transition: 'all 0.2s'
                                        }}>
                                            {tool.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500, marginBottom: '2px' }}>{tool.name}</div>
                                            {tool.description && (
                                                <div style={{ fontSize: '11px', opacity: 0.4 }}>{tool.description}</div>
                                            )}
                                        </div>
                                        {activeToolIds.includes(tool.id) && (
                                            <motion.div
                                                layoutId="active-indicator"
                                                style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6' }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                            {tools.length === 0 && (
                                <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5, fontSize: '12px' }}>
                                    No tools available
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ToolMenu;
