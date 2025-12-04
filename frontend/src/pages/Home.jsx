/**
 * HomePage - Dashboard principale con nuova struttura
 * Sezioni: Cerca, Aggiungi, Presi in mano
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { locationsApi, statsApi, itemsApi } from '../api'
import { useUIStore, usePocketStore } from '../store'
import { LoadingPage } from '../components/UI'

export function HomePage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { openScanner, showToast } = useUIStore()
    const { pocketItems, removeFromPocket, clearPocket } = usePocketStore()

    // Fetch stats
    const { data: stats, isLoading } = useQuery({
        queryKey: ['stats'],
        queryFn: statsApi.get
    })

    // Fetch items in hand details
    const { data: inHandItems } = useQuery({
        queryKey: ['items-in-hand', pocketItems],
        queryFn: () => itemsApi.inHand(),
        enabled: pocketItems.length > 0
    })

    // Handler per riporre singolo oggetto
    const handleReponiSingolo = (itemId) => {
        // Salva itemId temporaneamente e apri scanner
        sessionStorage.setItem('reponi_single_item', itemId.toString())
        openScanner()
    }

    // Handler per riporre tutti
    const handleReponiTutti = () => {
        const msg = pocketItems.length === 1
            ? '⚠️ Scansiona il QR della scatola dove vuoi posare l\'oggetto.'
            : `⚠️ Stai per posare TUTTI i ${pocketItems.length} oggetti in mano nella stessa scatola.\n\nScansiona il QR della scatola di destinazione.\n\nVuoi procedere?`
        if (pocketItems.length === 1 || confirm(msg)) {
            openScanner()
        }
    }

    if (isLoading) {
        return <LoadingPage message="Caricamento..." />
    }

    return (
        <div className="p-4 space-y-6">

            {/* ============== SEZIONE CERCA ============== */}
            <section>
                <h2 className="text-sm font-semibold text-dark-500 uppercase tracking-wider mb-3">
                    🔍 Cerca
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => navigate('/locations')}
                        className="card p-4 text-center hover:bg-dark-700 transition-colors"
                    >
                        <span className="text-2xl">📦</span>
                        <p className="text-xl font-bold text-white mt-1">
                            {stats?.total_locations || 0}
                        </p>
                        <p className="text-dark-400 text-xs">Scatole</p>
                    </button>

                    <button
                        onClick={() => navigate('/items')}
                        className="card p-4 text-center hover:bg-dark-700 transition-colors"
                    >
                        <span className="text-2xl">🎁</span>
                        <p className="text-xl font-bold text-white mt-1">
                            {stats?.total_items || 0}
                        </p>
                        <p className="text-dark-400 text-xs">Oggetti</p>
                    </button>

                    <button
                        onClick={() => navigate('/search')}
                        className="card p-4 text-center hover:bg-dark-700 transition-colors"
                    >
                        <span className="text-2xl">🔍</span>
                        <p className="text-xl font-bold text-white mt-1">Cerca</p>
                        <p className="text-dark-400 text-xs">Ricerca</p>
                    </button>
                </div>
            </section>

            {/* ============== SEZIONE AGGIUNGI ============== */}
            <section>
                <h2 className="text-sm font-semibold text-dark-500 uppercase tracking-wider mb-3">
                    ➕ Aggiungi oggetto
                </h2>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={openScanner}
                        className="btn-primary py-4 text-base"
                    >
                        📷 Scansiona Scatola
                    </button>
                    <button
                        onClick={() => navigate('/locations?select=true')}
                        className="btn-secondary py-4 text-base"
                    >
                        📦 Scegli Scatola
                    </button>
                </div>
            </section>

            {/* ============== SEZIONE PRESI IN MANO ============== */}
            {pocketItems.length > 0 && (
                <section>
                    <h2 className="text-sm font-semibold text-dark-500 uppercase tracking-wider mb-3">
                        ✋ Presi in mano ({pocketItems.length})
                    </h2>

                    {/* Lista oggetti in mano */}
                    <div className="space-y-2 mb-4">
                        {inHandItems?.map((item) => (
                            <div
                                key={item.id}
                                className="card p-3 flex items-center gap-3"
                            >
                                <img
                                    src={`/${item.thumbnail_path}`}
                                    alt=""
                                    className="w-12 h-12 rounded-lg object-cover bg-dark-700"
                                    onClick={() => navigate(`/item/${item.id}`)}
                                />
                                <div className="flex-1 min-w-0" onClick={() => navigate(`/item/${item.id}`)}>
                                    <p className="text-white text-sm truncate">
                                        {item.description || 'Senza descrizione'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleReponiSingolo(item.id)}
                                    className="btn-secondary text-xs px-3 py-2"
                                >
                                    Riponi
                                </button>
                            </div>
                        )) || (
                                // Fallback se items non ancora caricati
                                pocketItems.map((itemId) => (
                                    <div key={itemId} className="card p-3 flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-dark-700 animate-pulse" />
                                        <div className="flex-1">
                                            <div className="h-4 bg-dark-700 rounded animate-pulse" />
                                        </div>
                                        <button
                                            onClick={() => handleReponiSingolo(itemId)}
                                            className="btn-secondary text-xs px-3 py-2"
                                        >
                                            Riponi
                                        </button>
                                    </div>
                                ))
                            )}
                    </div>

                    {/* Pulsante posa tutti */}
                    <button
                        onClick={handleReponiTutti}
                        className="w-full btn bg-amber-500 text-dark-900 font-bold py-4 rounded-2xl"
                    >
                        👜 {pocketItems.length} in mano — Posa {pocketItems.length > 1 ? 'TUTTI ' : ''}nella scatola
                    </button>
                </section>
            )}

            {/* Empty state se niente selezionato */}
            {pocketItems.length === 0 && (
                <section className="text-center py-8 text-dark-500">
                    <p className="text-4xl mb-2">👋</p>
                    <p>Scansiona una scatola per iniziare</p>
                </section>
            )}
        </div>
    )
}
