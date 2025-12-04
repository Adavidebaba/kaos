/**
 * ItemDetailPage - Dettaglio singolo oggetto
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { itemsApi } from '../api'
import { useUIStore, usePocketStore } from '../store'
import { LoadingPage, EmptyState } from '../components/UI'

export function ItemDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { showToast, openScanner } = useUIStore()
    const { isInPocket, addToPocket, removeFromPocket } = usePocketStore()

    const itemId = parseInt(id, 10)
    const inPocket = isInPocket(itemId)

    // Fetch item
    const { data: item, isLoading, error } = useQuery({
        queryKey: ['item', itemId],
        queryFn: () => itemsApi.get(itemId)
    })

    // Prendi in mano
    const handlePick = async () => {
        try {
            await itemsApi.pick(itemId)
            addToPocket(itemId)
            showToast('✋ Oggetto in mano!', 'success')
            queryClient.invalidateQueries(['item', itemId])
            queryClient.invalidateQueries(['items'])
        } catch (err) {
            showToast(`❌ ${err.message}`, 'error')
        }
    }

    // Toggle pocket (per rimuovere)
    const handlePocketToggle = () => {
        if (inPocket) {
            removeFromPocket(itemId)
            showToast('Rimosso dalla tasca', 'info')
        } else {
            addToPocket(itemId)
            showToast('✋ Aggiunto alla tasca', 'success')
        }
    }

    // Elimina
    const handleDelete = async () => {
        if (!confirm('Eliminare questo oggetto?')) return

        try {
            await itemsApi.delete(itemId)
            showToast('🗑️ Eliminato', 'success')
            queryClient.invalidateQueries(['items'])
            navigate(-1)
        } catch (err) {
            showToast(`❌ ${err.message}`, 'error')
        }
    }

    if (isLoading) {
        return <LoadingPage message="Caricamento oggetto..." />
    }

    if (error || !item) {
        return (
            <EmptyState
                icon="❓"
                title="Oggetto non trovato"
                action={
                    <button onClick={() => navigate('/')} className="btn-primary mt-4">
                        🏠 Torna alla Home
                    </button>
                }
            />
        )
    }

    const statusLabels = {
        available: { icon: '✅', label: 'Disponibile', color: 'text-green-400' },
        in_hand: { icon: '✋', label: 'In mano', color: 'text-amber-400' },
        lost: { icon: '❓', label: 'Perso', color: 'text-red-400' },
        loaned: { icon: '📤', label: 'Prestato', color: 'text-blue-400' }
    }

    const status = statusLabels[item.status] || statusLabels.available

    return (
        <div className="p-4 space-y-4">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="btn-ghost px-2"
            >
                ← Indietro
            </button>

            {/* Image */}
            <div className="card overflow-hidden">
                <img
                    src={`/${item.photo_path}`}
                    alt={item.description || 'Oggetto'}
                    className="w-full aspect-square object-contain bg-dark-900"
                />
            </div>

            {/* Info */}
            <div className="card p-4 space-y-3">
                {/* Description */}
                <div>
                    <h3 className="text-dark-500 text-xs uppercase mb-1">Descrizione</h3>
                    <p className="text-white text-lg">
                        {item.description || <span className="text-dark-500 italic">Nessuna descrizione</span>}
                    </p>
                </div>

                {/* Location */}
                {item.location_name && (
                    <div>
                        <h3 className="text-dark-500 text-xs uppercase mb-1">Posizione</h3>
                        <button
                            onClick={() => navigate(`/loc/${item.location_id}`)}
                            className="text-amber-500 hover:underline flex items-center gap-2"
                        >
                            📦 {item.location_name}
                        </button>
                    </div>
                )}

                {/* Status */}
                <div>
                    <h3 className="text-dark-500 text-xs uppercase mb-1">Stato</h3>
                    <p className={`font-medium ${status.color}`}>
                        {status.icon} {status.label}
                    </p>
                </div>

                {/* Date */}
                <div>
                    <h3 className="text-dark-500 text-xs uppercase mb-1">Aggiunto</h3>
                    <p className="text-dark-300 text-sm">
                        {new Date(item.created_at).toLocaleDateString('it-IT', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                {/* Pick / Flash Move */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handlePocketToggle}
                        className={inPocket ? 'btn-secondary' : 'btn-primary'}
                    >
                        {inPocket ? '❌ Togli dalla tasca' : '✋ Prendi in mano'}
                    </button>
                    <button
                        onClick={openScanner}
                        className="btn-secondary"
                    >
                        🚀 Sposta
                    </button>
                </div>

                {/* Delete */}
                <button
                    onClick={handleDelete}
                    className="btn-danger w-full"
                >
                    🗑️ Elimina
                </button>
            </div>
        </div>
    )
}
