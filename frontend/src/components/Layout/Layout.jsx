/**
 * Layout - Componente layout principale Mobile First
 */
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { usePocketStore, useUIStore } from '../../store'

// Icons (emoji per semplicità, sostituibili con lucide-react)
const icons = {
    home: '🏠',
    search: '🔍',
    scan: '📷',
    tools: '🔧',
    pocket: '👜'
}

export function Layout() {
    const navigate = useNavigate()
    const location = useLocation()
    const pocketItems = usePocketStore((s) => s.pocketItems)
    const { toast, openScanner } = useUIStore()

    const navItems = [
        { path: '/', icon: icons.home, label: 'Home' },
        { path: '/search', icon: icons.search, label: 'Cerca' },
        { path: '/tools', icon: icons.tools, label: 'Tools' }
    ]

    return (
        <div className="min-h-screen flex flex-col bg-dark-900">
            {/* Header */}
            <header className="safe-top sticky top-0 z-30 bg-dark-800/95 backdrop-blur-sm border-b border-dark-700">
                <div className="flex items-center justify-between px-4 py-3">
                    <h1
                        className="text-lg font-bold text-amber-500 cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        🗃️ Caos Ordinato
                    </h1>

                    {/* Quick Scan Button */}
                    <button
                        onClick={openScanner}
                        className="btn-icon"
                        title="Scansiona QR"
                    >
                        📷
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-20">
                <Outlet />
            </main>

            {/* Pocket Footer (se ci sono items in mano) */}
            {pocketItems.length > 0 && (
                <div className="fixed bottom-16 inset-x-0 z-20 px-4 pb-2 animate-slide-up">
                    <button
                        onClick={openScanner}
                        className="w-full btn bg-amber-500 text-dark-900 font-bold py-4 rounded-2xl shadow-lg shadow-amber-500/30"
                    >
                        👜 {pocketItems.length} in mano — Posa nella scatola
                    </button>
                </div>
            )}

            {/* Bottom Navigation */}
            <nav className="safe-bottom fixed bottom-0 inset-x-0 z-30 bg-dark-800/95 backdrop-blur-sm border-t border-dark-700">
                <div className="flex justify-around items-center py-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${isActive
                                        ? 'text-amber-500'
                                        : 'text-dark-400 hover:text-white'
                                    }`}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </button>
                        )
                    })}
                </div>
            </nav>

            {/* Toast Notification */}
            {toast && (
                <div className={`toast ${toast.type === 'success' ? 'toast-success' : ''} ${toast.type === 'error' ? 'toast-error' : ''}`}>
                    {toast.message}
                </div>
            )}
        </div>
    )
}
