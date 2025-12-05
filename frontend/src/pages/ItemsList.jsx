/**
 * ItemsList - Elenco tutti gli oggetti
 */
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { itemsApi } from '../api'
import { ItemCard, LoadingPage, EmptyState } from '../components/UI'

export function ItemsListPage() {
    const navigate = useNavigate()

    // Fetch all items
    const { data, isLoading } = useQuery({
        queryKey: ['items', 'all'],
        queryFn: () => itemsApi.list({ per_page: 100 })
    })

    const items = data?.items || []

    const handleItemClick = (item) => {
        navigate(`/item/${item.id}`)
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
                <div className="item-grid">
                    {items.map((item) => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            onClick={handleItemClick}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon="📭"
                    title="Nessun oggetto"
                    description="Aggiungi il tuo primo oggetto scansionando una posizione"
                />
            )}
        </div>
    )
}
