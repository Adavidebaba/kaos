/**
 * SearchPage - Ricerca oggetti (semplificata, senza Flash Move)
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { searchApi } from '../api'
import { ItemCard, LoadingSpinner, EmptyState } from '../components/UI'

export function SearchPage() {
    const navigate = useNavigate()
    const [query, setQuery] = useState('')

    // Debounced search
    const { data: searchResults, isLoading, isFetching } = useQuery({
        queryKey: ['search', query],
        queryFn: () => searchApi.search(query),
        enabled: query.length >= 2,
        staleTime: 1000 * 30
    })

    // Click su item -> vai al dettaglio
    const handleItemClick = (item) => {
        navigate(`/item/${item.id}`)
    }

    const results = searchResults?.results || []

    return (
        <div className="p-4 space-y-4">
            {/* Back button */}
            <button
                onClick={() => navigate('/')}
                className="btn-ghost px-2"
            >
                ← Home
            </button>

            {/* Search Input */}
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">
                    🔍
                </span>
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cerca oggetti..."
                    className="input-search"
                    autoFocus
                />
                {isFetching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <LoadingSpinner size="sm" />
                    </div>
                )}
            </div>

            {/* Hint */}
            {query.length < 2 && (
                <p className="text-dark-500 text-sm text-center py-4">
                    Digita almeno 2 caratteri per cercare
                </p>
            )}

            {/* Results */}
            {query.length >= 2 && (
                <section>
                    <h2 className="text-sm font-semibold text-dark-400 mb-3">
                        {isLoading ? 'Ricerca...' : `${results.length} RISULTATI`}
                    </h2>

                    {results.length > 0 ? (
                        <div className="item-grid">
                            {results.map((item) => (
                                <ItemCard
                                    key={item.id}
                                    item={item}
                                    onClick={handleItemClick}
                                    showLocation
                                />
                            ))}
                        </div>
                    ) : (
                        !isLoading && (
                            <EmptyState
                                icon="🔍"
                                title="Nessun risultato"
                                description={`Nessun oggetto trovato per "${query}"`}
                            />
                        )
                    )}
                </section>
            )}
        </div>
    )
}
