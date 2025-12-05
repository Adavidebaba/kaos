/**
 * CameraView - Fotocamera con HUD per inserimento veloce
 */
import { useEffect, useState } from 'react'
import { useCamera, useShare, useClipboard } from '../../hooks'
import { uploadApi, itemsApi } from '../../api'
import { useUIStore } from '../../store'

export function CameraView({ locationId, locationName, onClose, onSave }) {
    const { showToast } = useUIStore()
    const { videoRef, isActive, error, startCamera, stopCamera, capturePhoto, toggleTorch } = useCamera()
    const { shareForSearch, isSharing, isShareSupported } = useShare()
    const { clipboardText, hasNewContent, clearContent } = useClipboard()

    const [capturedImage, setCapturedImage] = useState(null)
    const [description, setDescription] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [torchOn, setTorchOn] = useState(false)

    // Avvia camera all'apertura
    useEffect(() => {
        startCamera()
        return () => stopCamera()
    }, [startCamera, stopCamera])

    // Auto-paste descrizione al ritorno
    useEffect(() => {
        if (hasNewContent && clipboardText && !description) {
            setDescription(clipboardText)
            showToast('✨ Descrizione incollata!', 'success')
            clearContent()
        }
    }, [hasNewContent, clipboardText, description, showToast, clearContent])

    /**
     * Scatta foto
     */
    const handleCapture = async () => {
        const blob = await capturePhoto()
        if (blob) {
            setCapturedImage(blob)
        }
    }

    /**
     * Ali-Hack: condividi per ricerca visiva
     */
    const handleMagicSearch = async () => {
        if (!capturedImage) return
        await shareForSearch(capturedImage)
    }

    /**
     * Salva item (Fire & Forget)
     */
    const handleSave = async () => {
        if (!capturedImage || !locationId) return

        setIsSaving(true)

        try {
            // Upload immagine
            const file = new File([capturedImage], 'photo.jpg', { type: 'image/jpeg' })
            const uploadResult = await uploadApi.upload(file)

            // Crea item
            await itemsApi.create({
                location_id: locationId,
                photo_path: uploadResult.photo_path,
                thumbnail_path: uploadResult.thumbnail_path,
                description: description || null
            })

            showToast('✅ Salvato!', 'success')

            // Reset per prossima foto (Optimistic - non bloccare)
            setCapturedImage(null)
            setDescription('')

            if (onSave) onSave()
        } catch (err) {
            showToast(`❌ Errore: ${err.message}`, 'error')
        } finally {
            setIsSaving(false)
        }
    }

    /**
     * Annulla foto catturata
     */
    const handleRetake = () => {
        setCapturedImage(null)
        setDescription('')
    }

    /**
     * Toggle torcia
     */
    const handleTorch = async () => {
        const newState = await toggleTorch()
        setTorchOn(newState)
    }

    if (error) {
        return (
            <div className="camera-container flex items-center justify-center">
                <div className="text-center p-6">
                    <p className="text-red-400 text-lg mb-4">📷 {error}</p>
                    <button onClick={onClose} className="btn-secondary">
                        Chiudi
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="camera-container">
            {/* Video / Preview */}
            {!capturedImage ? (
                <video
                    ref={videoRef}
                    className="camera-video"
                    playsInline
                    autoPlay
                    muted
                />
            ) : (
                <img
                    src={URL.createObjectURL(capturedImage)}
                    alt="Captured"
                    className="camera-video object-contain bg-black"
                />
            )}

            {/* HUD Overlay - Nome Posizione */}
            <div className="hud-overlay">
                <div className="hud-label">
                    📦 {locationName || `Posizione ${locationId}`}
                </div>
            </div>

            {/* Top Controls */}
            <div className="absolute top-4 left-4 right-4 flex justify-between z-10 safe-top">
                <button onClick={onClose} className="btn-icon">
                    ✕
                </button>
                <button onClick={handleTorch} className={`btn-icon ${torchOn ? 'bg-amber-500' : ''}`}>
                    {torchOn ? '🔦' : '💡'}
                </button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 inset-x-0 p-4 safe-bottom bg-gradient-to-t from-black/80 to-transparent">
                {!capturedImage ? (
                    /* Camera Mode */
                    <div className="flex justify-center">
                        <button
                            onClick={handleCapture}
                            disabled={!isActive}
                            className="w-20 h-20 rounded-full bg-white border-4 border-dark-700 
                       active:scale-90 transition-transform disabled:opacity-50"
                        >
                            <span className="sr-only">Scatta</span>
                        </button>
                    </div>
                ) : (
                    /* Review Mode */
                    <div className="space-y-3">
                        {/* Description Input */}
                        <div className="relative">
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Descrizione (opzionale)"
                                className="input pr-20"
                            />
                            {isShareSupported() && (
                                <button
                                    onClick={handleMagicSearch}
                                    disabled={isSharing}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 
                           px-3 py-1.5 rounded-lg bg-amber-500 text-dark-900 
                           text-sm font-bold disabled:opacity-50"
                                >
                                    {isSharing ? '...' : '🚀 Ali'}
                                </button>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button onClick={handleRetake} className="btn-secondary flex-1">
                                🔄 Rifai
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="btn-primary flex-1"
                            >
                                {isSaving ? '⏳' : '💾'} Salva
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
