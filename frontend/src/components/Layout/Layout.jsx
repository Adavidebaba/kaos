/**
 * Layout - Componente layout principale Mobile First
 * Con contatore oggetti senza descrizione
 */
import { Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useUIStore } from '../../store'
import { itemsApi } from '../../api'

export function Layout() {
    const navigate = useNavigate()
    const { toast } = useUIStore()

    // Conta oggetti senza descrizione
    const { data: itemsData } = useQuery({
        queryKey: ['items', 'no-description-count'],
        queryFn: () => itemsApi.list({ per_page: 100 }),
        staleTime: 60000 // 1 minuto
    })

    const noDescCount = (itemsData?.items || []).filter(
        item => !item.description || item.description.trim() === ''
    ).length

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

                    {/* Tools Button con badge */}
                    <button
                        onClick={() => navigate('/tools')}
                        className="btn-icon relative"
                        title="Strumenti"
                    >
                        🔧
                        {noDescCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] 
                                           bg-red-500 text-white text-[10px] font-bold 
                                           rounded-full flex items-center justify-center px-1">
                                {noDescCount > 99 ? '99+' : noDescCount}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* Main Content */}
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
