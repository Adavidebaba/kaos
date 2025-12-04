/**
 * ItemsList - Elenco tutti gli oggetti
 */
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { itemsApi } from '../api'
import { ItemCard, LoadingPage, EmptyState } from '../components/UI'
import { usePocketStore } from '../store'

export function ItemsListPage() {
    const navigate = useNavigate()
    const { isInPocket, addToPocket, removeFromPocket } = usePocketStore()

    // Fetch all items
    const { data, isLoading } = useQuery({
        queryKey: ['items', 'all'],
        queryFn: () => itemsApi.list({ per_page: 100 })
    })

    const items = data?.items || []

    const handleItemClick = (item) => {
        navigate(`/item/${item.id}`)
    }

    const handleTogglePocket = (item, e) => {
        e.stopPropagation()
        if (isInPocket(item.id)) {
            removeFromPocket(item.id)
        } else {
            addToPocket(item.id)
        }
    }

    if (isLoading) {
        return <LoadingPage message="Caricamento oggetti..." />
    }

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="btn-ghost px-2"
                >
                    ← Indietro
                </button>
                <h1 className="text-lg font-bold text-white">
                    Tutti gli Oggetti ({items.length})
                </h1>
                <div className="w-16" />
            </div>

            {/* Lista */}
            {items.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                    {items.map((item) => (
                        <div key={item.id} className="relative">
                            <ItemCard
                                item={item}
                                onClick={handleItemClick}
                            />
                            {/* Pulsante Prendi/Riponi */}
                            <button
                                onClick={(e) => handleTogglePocket(item, e)}
                                className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-lg ${isInPocket(item.id)
                                        ? 'bg-amber-500 text-dark-900'
                                        : 'bg-dark-800/80 text-white'
                                    }`}
                            >
                                {isInPocket(item.id) ? 'Riponi' : 'Prendi'}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon="📭"
                    title="Nessun oggetto"
                    description="Aggiungi il tuo primo oggetto scansionando una scatola"
                />
            )}
        </div>
    )
}
