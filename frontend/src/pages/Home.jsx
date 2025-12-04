/**
 * HomePage - Dashboard principale con nuova struttura
 * Sezioni: Cerca, Aggiungi, Presi in mano
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { statsApi, itemsApi } from '../api'
import { useUIStore, usePocketStore } from '../store'
import { LoadingPage } from '../components/UI'

export function HomePage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { openScanner, showToast } = useUIStore()
    const { pocketItems, removeFromPocket } = usePocketStore()

    // Fetch stats
    const { data: stats, isLoading } = useQuery({
        queryKey: ['stats'],
        queryFn: statsApi.get
    })

    // Fetch dettagli items in mano
    const { data: inHandItems } = useQuery({
        queryKey: ['pocket-items-details', pocketItems],
        queryFn: async () => {
            const items = await Promise.all(
                pocketItems.map(id => itemsApi.get(id).catch(() => null))
            )
            return items.filter(item => item !== null)
        },
        enabled: pocketItems.length > 0
    })

    // Riponi in scatola originale (senza scanner)
    const handleRiponiOriginale = async (item) => {
        if (!item.location_id) {
            showToast('❌ Scatola originale non trovata', 'error')
            return
        }
        try {
            await itemsApi.bulkMove([item.id], item.location_id)
            removeFromPocket(item.id)
            showToast(`📦 Riposto in: ${item.location_name}`, 'success')
            queryClient.invalidateQueries(['pocket-items-details'])
            queryClient.invalidateQueries(['items'])
        } catch (err) {
            showToast(`❌ ${err.message}`, 'error')
        }
    }

    // Sposta in nuova scatola (apre scanner)
    const handleSposta = (itemId) => {
        sessionStorage.setItem('reponi_single_item', itemId.toString())
        openScanner('pocket')
    }

    // Sposta tutti in nuova scatola
    const handleSpostaTutti = () => {
        const msg = pocketItems.length === 1
            ? 'Scansiona il QR della scatola dove vuoi spostare l\'oggetto.'
            : `Stai per spostare TUTTI i ${pocketItems.length} oggetti nella stessa scatola.\n\nScansiona il QR della scatola di destinazione.`
        if (pocketItems.length === 1 || confirm(msg)) {
            openScanner('pocket')
        }
    }

    if (isLoading) {
        return <LoadingPage message="Caricamento..." />
    }

    return (
        <div className="p-4 space-y-6">

            {/* ============== SEZIONE CERCA ============== */}
            <section>
                <h2 className="text-base font-bold text-amber-500 mb-3">
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
                <h2 className="text-base font-bold text-amber-500 mb-3">
                    ➕ Aggiungi oggetto
                </h2>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={openScanner}
                        className="btn-secondary py-4 text-base"
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
                    <h2 className="text-base font-bold text-amber-500 mb-3">
                        ✋ Presi in mano ({pocketItems.length})
                    </h2>

                    {/* Lista oggetti in mano */}
                    <div className="space-y-2 mb-4">
                        {inHandItems && inHandItems.length > 0 ? (
                            inHandItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="card p-3 flex items-center gap-2"
                                >
                                    <img
                                        src={`/${item.thumbnail_path}`}
                                        alt=""
                                        className="w-12 h-12 rounded-lg object-cover bg-dark-700 cursor-pointer"
                                        onClick={() => navigate(`/item/${item.id}`)}
                                    />
                                    <div
                                        className="flex-1 min-w-0 cursor-pointer"
                                        onClick={() => navigate(`/item/${item.id}`)}
                                    >
                                        <p className="text-white text-sm truncate">
                                            {item.description || 'Senza descrizione'}
                                        </p>
                                    </div>
                                    {/* Riponi nella scatola originale */}
                                    <button
                                        onClick={() => handleRiponiOriginale(item)}
                                        className="btn text-[11px] px-2 py-1.5 bg-green-600 hover:bg-green-500 text-white"
                                        title={`Riponi in ${item.location_name}`}
                                    >
                                        📦 {item.location_name?.substring(0, 10) || '?'}
                                    </button>
                                    {/* Sposta in altra scatola */}
                                    <button
                                        onClick={() => handleSposta(item.id)}
                                        className="btn-secondary text-[11px] px-2 py-1.5"
                                    >
                                        🚀
                                    </button>
                                </div>
                            ))
                        ) : (
                            pocketItems.map((itemId) => (
                                <div key={itemId} className="card p-3 flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-dark-700 animate-pulse" />
                                    <div className="flex-1">
                                        <div className="h-4 bg-dark-700 rounded animate-pulse" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pulsante sposta tutti */}
                    <button
                        onClick={handleSpostaTutti}
                        className="w-full btn bg-amber-500 text-dark-900 font-bold py-4 rounded-2xl"
                    >
                        🚀 Sposta {pocketItems.length > 1 ? 'TUTTI ' : ''}in nuova scatola
                    </button>
                </section>
            )}

            {/* Empty state */}
            {pocketItems.length === 0 && (
                <section className="text-center py-8 text-dark-500">
                    <p className="text-4xl mb-2">👋</p>
                    <p>Scansiona una scatola per iniziare</p>
                </section>
            )}
        </div>
    )
}
