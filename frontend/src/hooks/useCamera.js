/**
 * Hook useCamera - Gestione fotocamera nativa del dispositivo
 */
import { useCallback, useRef, useState } from 'react'

export function useCamera() {
    const videoRef = useRef(null)
    const streamRef = useRef(null)
    const [isActive, setIsActive] = useState(false)
    const [error, setError] = useState(null)
    const [facingMode, setFacingMode] = useState('environment')

    /**
     * Avvia la fotocamera
     */
    const startCamera = useCallback(async () => {
        try {
            setError(null)

            // Richiedi accesso fotocamera
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode, // 'environment' = posteriore
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            })

            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
            }

            setIsActive(true)
        } catch (err) {
            console.error('Camera error:', err)
            setError(err.message || 'Accesso fotocamera negato')
            setIsActive(false)
        }
    }, [facingMode])

    /**
     * Ferma la fotocamera
     */
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
        setIsActive(false)
    }, [])

    /**
     * Cambia fotocamera (frontale/posteriore)
     */
    const switchCamera = useCallback(async () => {
        const newFacing = facingMode === 'environment' ? 'user' : 'environment'
        setFacingMode(newFacing)

        if (isActive) {
            stopCamera()
            // Piccolo delay per permettere il rilascio della camera
            setTimeout(() => startCamera(), 100)
        }
    }, [facingMode, isActive, stopCamera, startCamera])

    /**
     * Scatta una foto e ritorna il Blob
     */
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !isActive) {
            return null
        }

        const video = videoRef.current
        const canvas = document.createElement('canvas')

        // Usa dimensioni reali del video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob)
            }, 'image/jpeg', 0.92)
        })
    }, [isActive])

    /**
     * Attiva/disattiva torcia (se disponibile)
     */
    const toggleTorch = useCallback(async () => {
        if (!streamRef.current) return false

        const track = streamRef.current.getVideoTracks()[0]
        const capabilities = track.getCapabilities?.()

        if (!capabilities?.torch) {
            return false
        }

        const currentSettings = track.getSettings()
        const newTorch = !currentSettings.torch

        await track.applyConstraints({
            advanced: [{ torch: newTorch }]
        })

        return newTorch
    }, [])

    return {
        videoRef,
        isActive,
        error,
        facingMode,
        startCamera,
        stopCamera,
        switchCamera,
        capturePhoto,
        toggleTorch
    }
}
