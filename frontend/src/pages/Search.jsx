/**
 * SearchPage - Ricerca oggetti con FTS
 */
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { searchApi } from '../api'
import { useUIStore } from '../store'
import { ItemCard, LoadingSpinner, EmptyState } from '../components/UI'
import { ScannerView } from '../components/Scanner'

export function SearchPage() {
    const navigate = useNavigate()
    const { showToast } = useUIStore()

    const [query, setQuery] = useState('')
    const [showScanner, setShowScanner] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)

    // Debounced search
    const { data: searchResults, isLoading, isFetching } = useQuery({
        queryKey: ['search', query],
        queryFn: () => searchApi.search(query),
        enabled: query.length >= 2,
        staleTime: 1000 * 30 // 30 secondi
    })

    // Click su item per Flash Move
    const handleItemClick = (item) => {
        setSelectedItem(item)
        setShowScanner(true)
    }

    // Scan completato per Flash Move
    const handleScanComplete = (locationId) => {
        // Il componente ScannerView gestisce già lo spostamento
        setShowScanner(false)
        setSelectedItem(null)
    }

    // Mostra scanner per Flash Move
    if (showScanner && selectedItem) {
        return (
            <div className="fixed inset-0 z-50">
                {/* Info item selezionato */}
                <div className="absolute top-4 inset-x-4 z-10 safe-top">
                    <div className="card p-3 flex items-center gap-3">
                        <img
                            src={`/${selectedItem.thumbnail_path}`}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                                {selectedItem.description || 'Oggetto'}
                            </p>
                            <p className="text-amber-500 text-xs">
                                Inquadra la nuova scatola
                            </p>
                        </div>
                    </div>
                </div>

                <ScannerView
                    mode="navigate"
                    onClose={() => {
                        setShowScanner(false)
                        setSelectedItem(null)
                    }}
                />
            </div>
        )
    }

    const results = searchResults?.results || []

    return (
        <div className="p-4 space-y-4">
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

            {/* Flash Move Hint */}
            <div className="card p-4 bg-amber-500/10 border-amber-500/30">
                <p className="text-amber-400 text-sm">
                    <strong>💡 Flash Move:</strong> Tocca un oggetto per spostarlo rapidamente in una nuova scatola
                </p>
            </div>
        </div>
    )
}
