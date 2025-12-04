/**
 * Layout - Componente layout principale Mobile First
 * Versione semplificata senza barra navigazione inferiore
 */
import { Outlet, useNavigate } from 'react-router-dom'
import { useUIStore } from '../../store'

export function Layout() {
    const navigate = useNavigate()
    const { toast } = useUIStore()

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

                    {/* Tools Button */}
                    <button
                        onClick={() => navigate('/tools')}
                        className="btn-icon"
                        title="Strumenti"
                    >
                        🔧
                    </button>
                </div>
            </header>

            {/* Main Content - no bottom padding needed anymore */}
            <main className="flex-1 overflow-y-auto pb-4">
                <Outlet />
            </main>

            {/* Toast Notification */}
            {toast && (
                <div className={`toast ${toast.type === 'success' ? 'toast-success' : ''} ${toast.type === 'error' ? 'toast-error' : ''}`}>
                    {toast.message}
                </div>
            )}
        </div>
    )
}
