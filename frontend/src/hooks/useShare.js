/**
 * Hook useShare - Implementazione Ali-Hack (Clean Share)
 * Condivide immagini per ricerca visiva su Google Lens/AliExpress
 */
import { useCallback, useState } from 'react'

export function useShare() {
    const [isSharing, setIsSharing] = useState(false)
    const [error, setError] = useState(null)

    /**
     * Ridimensiona immagine client-side
     */
    const resizeImage = useCallback((blob, maxWidth = 800, quality = 0.8) => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                // Mantieni aspect ratio
                if (width > maxWidth) {
                    height = height * (maxWidth / width)
                    width = maxWidth
                }

                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob((resizedBlob) => {
                    resolve(resizedBlob)
                }, 'image/jpeg', quality)
            }
            img.onerror = reject
            img.src = URL.createObjectURL(blob)
        })
    }, [])

    /**
     * Condivide immagine per ricerca visiva (Ali-Hack)
     * IMPORTANTE: Passa SOLO files, niente title/text!
     */
    const shareForSearch = useCallback(async (imageBlob) => {
        setIsSharing(true)
        setError(null)

        try {
            // Ridimensiona per performance
            const resizedBlob = await resizeImage(imageBlob, 800, 0.85)

            // Crea File object
            const file = new File([resizedBlob], 'search_item.jpg', {
                type: 'image/jpeg'
            })

            // Verifica supporto Web Share API
            if (!navigator.canShare || !navigator.canShare({ files: [file] })) {
                throw new Error('Web Share API non supportata')
            }

            // CLEAN SHARE: Solo files, niente altro!
            // Se si aggiunge title/text, iOS nasconde le app di ricerca
            await navigator.share({
                files: [file]
            })

            return true
        } catch (err) {
            // AbortError = utente ha annullato (non è un errore)
            if (err.name === 'AbortError') {
                return false
            }

            console.error('Share error:', err)
            setError(err.message)
            return false
        } finally {
            setIsSharing(false)
        }
    }, [resizeImage])

    /**
     * Verifica se Web Share API è disponibile
     */
    const isShareSupported = useCallback(() => {
        return typeof navigator.share === 'function' &&
            typeof navigator.canShare === 'function'
    }, [])

    return {
        isSharing,
        error,
        shareForSearch,
        isShareSupported
    }
}
