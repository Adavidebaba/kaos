/**
 * LocationsList - Elenco tutte le scatole
 * Con modalità selezione per "Scegli Scatola"
 */
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { locationsApi } from '../api'
import { LocationCard, LoadingPage, EmptyState } from '../components/UI'
import { useUIStore } from '../store'

export function LocationsListPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { openScanner } = useUIStore()

    // Modalità selezione (per aggiungere oggetto)
    const isSelectMode = searchParams.get('select') === 'true'

    // Fetch locations
    const { data: locations, isLoading } = useQuery({
        queryKey: ['locations'],
        queryFn: () => locationsApi.list()
    })

    const handleLocationClick = (location) => {
        if (isSelectMode) {
            // Vai direttamente alla camera per questa scatola
            navigate(`/loc/${location.id}?camera=true`)
        } else {
            // Navigazione normale
            navigate(`/loc/${location.id}`)
        }
    }

    if (isLoading) {
        return <LoadingPage message="Caricamento scatole..." />
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
                    {isSelectMode ? 'Scegli Scatola' : 'Tutte le Scatole'}
                </h1>
                <div className="w-16" /> {/* Spacer */}
            </div>

            {isSelectMode && (
                <p className="text-dark-400 text-sm text-center">
                    Seleziona la scatola dove aggiungere l'oggetto
                </p>
            )}

            {/* Lista */}
            {locations && locations.length > 0 ? (
                <div className="space-y-3">
                    {locations.map((location) => (
                        <LocationCard
                            key={location.id}
                            location={location}
                            onClick={handleLocationClick}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon="📭"
                    title="Nessuna scatola"
                    description="Scansiona un QR code per creare la tua prima scatola"
                    action={
                        <button onClick={openScanner} className="btn-primary mt-2">
                            📷 Scansiona QR
                        </button>
                    }
                />
            )}
        </div>
    )
}
