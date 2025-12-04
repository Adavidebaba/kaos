/**
 * Hook useClipboard - Auto-paste al ritorno dall'app
 */
import { useCallback, useEffect, useState } from 'react'

export function useClipboard() {
    const [clipboardText, setClipboardText] = useState('')
    const [hasNewContent, setHasNewContent] = useState(false)

    /**
     * Legge clipboard (richiede permesso o focus)
     */
    const readClipboard = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText()
            if (text && text.length > 0) {
                setClipboardText(text)
                return text
            }
        } catch (err) {
            // Permesso negato o non in focus - normale su mobile
            console.log('Clipboard read failed:', err.message)
        }
        return null
    }, [])

    /**
     * Listener per visibilitychange (ritorno dall'app esterna)
     */
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                const text = await readClipboard()
                if (text) {
                    setHasNewContent(true)
                    // Reset flag dopo 5 secondi
                    setTimeout(() => setHasNewContent(false), 5000)
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [readClipboard])

    /**
     * Reset del contenuto
     */
    const clearContent = useCallback(() => {
        setClipboardText('')
        setHasNewContent(false)
    }, [])

    return {
        clipboardText,
        hasNewContent,
        readClipboard,
        clearContent
    }
}
