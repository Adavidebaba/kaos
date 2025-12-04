/**
 * LocationPage - Vista singola scatola con items
 * Gestisce Deep Linking da QR Code e parametro ?camera=true
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { locationsApi, itemsApi } from '../api'
import { useUIStore } from '../store'
import { CameraView } from '../components/Camera'
import { ItemCard, LoadingPage, EmptyState } from '../components/UI'

export function LocationPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const queryClient = useQueryClient()
    const { showToast } = useUIStore()

    // Leggi parametro camera=true dall'URL
    const shouldOpenCamera = searchParams.get('camera') === 'true'

    const [showCamera, setShowCamera] = useState(false)
    const [claimName, setClaimName] = useState('')
    const [isClaiming, setIsClaiming] = useState(false)

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

    // Apri camera automaticamente se viene da ?camera=true
    useEffect(() => {
        if (shouldOpenCamera && location && !showCamera) {
            setShowCamera(true)
            // Rimuovi il parametro camera dall'URL per evitare loop
            navigate(`/loc/${locationId}`, { replace: true })
        }
    }, [shouldOpenCamera, location, showCamera, navigate, locationId])

    // Verifica se è un errore 404 (location non esiste)
    const isNotFoundError = !!error

    // Claim (crea) nuova location
    const handleClaim = async () => {
        const name = claimName.trim() || `Scatola ${locationId}`

        setIsClaiming(true)
        try {
            await locationsApi.claim(locationId, { name })

            showToast('✅ Scatola creata!', 'success')

            // Refresh data
            queryClient.invalidateQueries(['location', locationId])
            queryClient.invalidateQueries(['locations'])

            // Apri camera per inserimento
            setShowCamera(true)
        } catch (err) {
            showToast(`❌ ${err.message}`, 'error')
        } finally {
            setIsClaiming(false)
        }
    }

    // Callback dopo salvataggio item
    const handleItemSaved = () => {
        queryClient.invalidateQueries(['items', { locationId }])
        queryClient.invalidateQueries(['locations'])
        queryClient.invalidateQueries(['stats'])
    }

    // Chiudi camera
    const handleCloseCamera = () => {
        setShowCamera(false)
        // Assicurati di essere sulla pagina corretta senza ?camera=true
        navigate(`/loc/${locationId}`, { replace: true })
    }

    // Click su item
    const handleItemClick = (item) => {
        navigate(`/item/${item.id}`)
    }

    // Loading
    if (isLoading) {
        return <LoadingPage message="Caricamento scatola..." />
    }

    // Location non esiste -> Modal per crearla
    if (isNotFoundError) {
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
                        placeholder={`Scatola ${locationId}`}
                        className="input mb-4"
                        autoFocus
                    />

                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="btn-secondary flex-1"
                            disabled={isClaiming}
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleClaim}
                            className="btn-primary flex-1"
                            disabled={isClaiming}
                        >
                            {isClaiming ? '⏳ Creazione...' : '✅ Crea'}
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
                onClose={handleCloseCamera}
                onSave={handleItemSaved}
            />
        )
    }

    // Location non trovata (altro tipo di errore)
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
            {/* Back button */}
            <button
                onClick={() => navigate('/')}
                className="btn-ghost px-2"
            >
                ← Home
            </button>

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
