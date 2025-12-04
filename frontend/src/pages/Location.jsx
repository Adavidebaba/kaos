/**
 * LocationPage - Vista singola scatola con items
 * Gestisce Deep Linking da QR Code
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { locationsApi, itemsApi } from '../api'
import { useUIStore } from '../store'
import { CameraView } from '../components/Camera'
import { ItemCard, LoadingPage, EmptyState } from '../components/UI'

export function LocationPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { showToast } = useUIStore()

    const [showCamera, setShowCamera] = useState(false)
    const [showClaimModal, setShowClaimModal] = useState(false)
    const [claimName, setClaimName] = useState('')

    const locationId = parseInt(id, 10)

    // Fetch location
    const {
        data: location,
        isLoading,
        error
    } = useQuery({
        queryKey: ['location', locationId],
        queryFn: () => locationsApi.get(locationId),
        retry: false
    })

    // Fetch items di questa location
    const { data: itemsData } = useQuery({
        queryKey: ['items', { locationId }],
        queryFn: () => itemsApi.list({ locationId }),
        enabled: !!location
    })

    // Se location non esiste, mostra modal "Claim"
    useEffect(() => {
        if (error) {
            // Controlla sia status HTTP 404 che messaggi comuni di "non trovato"
            const isNotFound = error.message.includes('404') ||
                error.message.toLowerCase().includes('non trovata') ||
                error.message.toLowerCase().includes('not found')

            if (isNotFound) {
                setShowClaimModal(true)
                setClaimName(`Scatola ${locationId}`)
            }
        }
    }, [error, locationId])

    // Claim (crea) nuova location
    const handleClaim = async () => {
        if (!claimName.trim()) return

        try {
            await locationsApi.claim(locationId, {
                name: claimName.trim()
            })

            setShowClaimModal(false)
            showToast('✅ Scatola creata!', 'success')

            // Refresh data
            queryClient.invalidateQueries(['location', locationId])
            queryClient.invalidateQueries(['locations'])

            // Apri camera per inserimento
            setShowCamera(true)
        } catch (err) {
            showToast(`❌ ${err.message}`, 'error')
        }
    }

    // Callback dopo salvataggio item
    const handleItemSaved = () => {
        queryClient.invalidateQueries(['items', { locationId }])
        queryClient.invalidateQueries(['locations'])
        queryClient.invalidateQueries(['stats'])
    }

    // Click su item
    const handleItemClick = (item) => {
        navigate(`/item/${item.id}`)
    }

    // Loading
    if (isLoading) {
        return <LoadingPage message="Caricamento scatola..." />
    }

    // Modal Claim (nuova scatola)
    if (showClaimModal) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                <div className="card p-6 max-w-sm w-full animate-slide-up">
                    <h2 className="text-xl font-bold text-white mb-2">
                        📦 Nuova Scatola
                    </h2>
                    <p className="text-dark-400 text-sm mb-4">
                        La scatola #{locationId} non esiste ancora. Vuoi crearla?
                    </p>

                    <input
                        type="text"
                        value={claimName}
                        onChange={(e) => setClaimName(e.target.value)}
                        placeholder="Nome scatola"
                        className="input mb-4"
                        autoFocus
                    />

                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="btn-secondary flex-1"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleClaim}
                            className="btn-primary flex-1"
                        >
                            ✅ Crea
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Camera View (fullscreen)
    if (showCamera && location) {
        return (
            <CameraView
                locationId={location.id}
                locationName={location.name}
                onClose={() => setShowCamera(false)}
                onSave={handleItemSaved}
            />
        )
    }

    // Vista normale
    if (!location) {
        return (
            <EmptyState
                icon="❓"
                title="Scatola non trovata"
                action={
                    <button onClick={() => navigate('/')} className="btn-primary mt-4">
                        🏠 Torna alla Home
                    </button>
                }
            />
        )
    }

    const items = itemsData?.items || []

    return (
        <div className="p-4 space-y-4">
            {/* Header Location */}
            <div className="card p-4">
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-amber-500/20 
                        flex items-center justify-center text-3xl">
                        📦
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white">
                            {location.name}
                        </h1>
                        {location.description && (
                            <p className="text-dark-400 text-sm">{location.description}</p>
                        )}
                        <p className="text-amber-500 text-sm font-medium">
                            {location.item_count} oggetti
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => setShowCamera(true)}
                    className="btn-primary py-4"
                >
                    📸 Aggiungi Oggetto
                </button>
                <button
                    onClick={() => navigate('/search')}
                    className="btn-secondary py-4"
                >
                    🔍 Cerca
                </button>
            </div>

            {/* Items Grid */}
            <section>
                <h2 className="text-sm font-semibold text-dark-400 mb-3">
                    CONTENUTO ({items.length})
                </h2>

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
                        title="Scatola vuota"
                        description="Aggiungi il primo oggetto"
                        action={
                            <button
                                onClick={() => setShowCamera(true)}
                                className="btn-primary mt-2"
                            >
                                📸 Scatta Foto
                            </button>
                        }
                    />
                )}
            </section>
        </div>
    )
}
