/**
 * ItemDetailPage - Dettaglio singolo oggetto
 * Con modifica descrizione, terminologia Prendi/Riponi, e Ali search
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { itemsApi } from '../api'
import { useUIStore, usePocketStore } from '../store'
import { useShare } from '../hooks'
import { LoadingPage, EmptyState } from '../components/UI'

export function ItemDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { showToast, openScanner } = useUIStore()
    const { isInPocket, addToPocket, removeFromPocket } = usePocketStore()
    const { shareForSearch, isSharing, isShareSupported } = useShare()

    const itemId = parseInt(id, 10)
    const inPocket = isInPocket(itemId)

    // State per modifica descrizione
    const [isEditing, setIsEditing] = useState(false)
    const [editDescription, setEditDescription] = useState('')
    const [isSaving, setIsSaving] = useState(false)

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
            showToast('✋ Preso in mano!', 'success')
            queryClient.invalidateQueries(['item', itemId])
            queryClient.invalidateQueries(['items'])
        } catch (err) {
            showToast(`❌ ${err.message}`, 'error')
        }
    }

    // Riponi (apre scanner per scegliere scatola)
    const handleRiponi = () => {
        openScanner()
    }

    // Avvia modifica descrizione
    const handleStartEdit = () => {
        setEditDescription(item?.description || '')
        setIsEditing(true)
    }

    // Salva descrizione
    const handleSaveDescription = async () => {
        setIsSaving(true)
        try {
            await itemsApi.update(itemId, { description: editDescription || null })
            showToast('✅ Descrizione salvata!', 'success')
            queryClient.invalidateQueries(['item', itemId])
            queryClient.invalidateQueries(['items'])
            setIsEditing(false)
        } catch (err) {
            showToast(`❌ ${err.message}`, 'error')
        } finally {
            setIsSaving(false)
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

            {/* Quick Actions - Sopra la foto */}
            <div className="grid grid-cols-2 gap-3">
                {inPocket ? (
                    <button
                        onClick={handleRiponi}
                        className="btn bg-amber-500 text-dark-900 font-bold"
                    >
                        📦 Riponi
                    </button>
                ) : (
                    <button
                        onClick={handlePick}
                        className="btn-primary"
                    >
                        ✋ Prendi
                    </button>
                )}
                <button
                    onClick={() => openScanner('navigate')}
                    className="btn-secondary"
                >
                    🚀 Sposta
                </button>
            </div>

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
                {/* Description - Editable */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-dark-500 text-xs uppercase">Descrizione</h3>
                        {!isEditing && (
                            <button
                                onClick={handleStartEdit}
                                className="text-amber-500 text-xs hover:underline"
                            >
                                ✏️ Modifica
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    placeholder="Inserisci descrizione..."
                                    className="input w-full pr-20"
                                    autoFocus
                                />
                                {isShareSupported() && (
                                    <button
                                        onClick={async () => {
                                            // Scarica immagine e condividi per ricerca
                                            try {
                                                const response = await fetch(`/${item.photo_path}`)
                                                const blob = await response.blob()
                                                await shareForSearch(blob)
                                            } catch (err) {
                                                showToast(`❌ ${err.message}`, 'error')
                                            }
                                        }}
                                        disabled={isSharing}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 
                                                   px-3 py-1.5 rounded-lg bg-amber-500 text-dark-900 
                                                   text-sm font-bold disabled:opacity-50"
                                    >
                                        {isSharing ? '...' : '🚀 Ali'}
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="btn-secondary flex-1"
                                    disabled={isSaving}
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={handleSaveDescription}
                                    className="btn-primary flex-1"
                                    disabled={isSaving}
                                >
                                    {isSaving ? '⏳' : '💾'} Salva
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-white text-lg">
                            {item.description || <span className="text-dark-500 italic">Nessuna descrizione</span>}
                        </p>
                    )}
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

            {/* Additional Actions */}
            <div className="space-y-3">
                {/* Quick return to original location (if in pocket and has location) */}
                {inPocket && item.location_name && (
                    <button
                        onClick={async () => {
                            try {
                                await itemsApi.update(itemId, { location_id: item.location_id })
                                removeFromPocket(itemId)
                                showToast(`📦 Rimesso in: ${item.location_name}`, 'success')
                                queryClient.invalidateQueries(['item', itemId])
                                queryClient.invalidateQueries(['items'])
                            } catch (err) {
                                showToast(`❌ ${err.message}`, 'error')
                            }
                        }}
                        className="btn bg-green-600 hover:bg-green-500 w-full"
                    >
                        📦 Rimetto in: {item.location_name}
                    </button>
                )}

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
