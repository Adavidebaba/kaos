/**
 * Hook useScanner - Scanner QR Code con html5-qrcode
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export function useScanner(onScan) {
    const scannerRef = useRef(null)
    const containerRef = useRef(null)
    const [isScanning, setIsScanning] = useState(false)
    const [error, setError] = useState(null)
    const [lastScanned, setLastScanned] = useState(null)

    /**
     * Avvia lo scanner
     */
    const startScanning = useCallback(async () => {
        if (!containerRef.current) {
            setError('Container not ready')
            return
        }

        try {
            setError(null)

            // Crea istanza scanner
            scannerRef.current = new Html5Qrcode(containerRef.current.id)

            await scannerRef.current.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                (decodedText) => {
                    // QR rilevato
                    setLastScanned(decodedText)

                    // Vibra se disponibile
                    if (navigator.vibrate) {
                        navigator.vibrate(100)
                    }

                    // Callback
                    if (onScan) {
                        onScan(decodedText)
                    }
                },
                () => {
                    // QR non trovato nel frame (normale, ignora)
                }
            )

            setIsScanning(true)
        } catch (err) {
            console.error('Scanner error:', err)
            setError(err.message || 'Errore avvio scanner')
            setIsScanning(false)
        }
    }, [onScan])

    /**
     * Ferma lo scanner
     */
    const stopScanning = useCallback(async () => {
        if (scannerRef.current && isScanning) {
            try {
                await scannerRef.current.stop()
                scannerRef.current.clear()
            } catch (err) {
                console.error('Error stopping scanner:', err)
            }
        }
        scannerRef.current = null
        setIsScanning(false)
    }, [isScanning])

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { })
            }
        }
    }, [])

    /**
     * Estrae ID location da URL QR
     * Es: https://kaos.adavide.com/loc/123 -> 123
     */
    const parseLocationFromQR = useCallback((qrText) => {
        // Pattern: /loc/123 o URL completo
        const match = qrText.match(/\/loc\/(\d+)/)
        if (match) {
            return parseInt(match[1], 10)
        }

        // Se è solo un numero
        if (/^\d+$/.test(qrText)) {
            return parseInt(qrText, 10)
        }

        return null
    }, [])

    return {
        containerRef,
        isScanning,
        error,
        lastScanned,
        startScanning,
        stopScanning,
        parseLocationFromQR
    }
}
