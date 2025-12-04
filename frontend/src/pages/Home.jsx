/**
 * HomePage - Dashboard principale con lista locations
 */
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { locationsApi, statsApi } from '../api'
import { useUIStore } from '../store'
import { LocationCard, LoadingPage, EmptyState } from '../components/UI'

export function HomePage() {
    const navigate = useNavigate()
    const { openScanner } = useUIStore()

    // Fetch locations
    const { data: locations, isLoading: loadingLocations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => locationsApi.list()
    })

    // Fetch stats
    const { data: stats } = useQuery({
        queryKey: ['stats'],
        queryFn: statsApi.get
    })

    const handleLocationClick = (location) => {
        navigate(`/loc/${location.id}`)
    }

    if (loadingLocations) {
        return <LoadingPage message="Caricamento magazzino..." />
    }

    return (
        <div className="p-4 space-y-6">
            {/* Stats Header */}
            {stats && (
                <div className="grid grid-cols-3 gap-3">
                    <StatCard
                        icon="📦"
                        value={stats.total_locations}
                        label="Scatole"
                    />
                    <StatCard
                        icon="🎁"
                        value={stats.total_items}
                        label="Oggetti"
                    />
                    <StatCard
                        icon="✋"
                        value={stats.items_in_hand}
                        label="In mano"
                    />
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={openScanner}
                    className="btn-primary py-4"
                >
                    📷 Scansiona QR
                </button>
                <button
                    onClick={() => navigate('/search')}
                    className="btn-secondary py-4"
                >
                    🔍 Cerca Oggetto
                </button>
            </div>

            {/* Locations List */}
            <section>
                <h2 className="text-lg font-semibold text-white mb-3">
                    📦 Le tue scatole
                </h2>

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
            </section>
        </div>
    )
}

/**
 * StatCard - Mini card per statistiche
 */
function StatCard({ icon, value, label }) {
    return (
        <div className="card p-3 text-center">
            <span className="text-xl">{icon}</span>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            <p className="text-dark-500 text-xs">{label}</p>
        </div>
    )
}
