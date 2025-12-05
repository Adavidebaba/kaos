/**
 * Store globale Zustand per stato applicazione
 * Gestisce: pocket items (sincronizzato dal server), UI state, toast
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Store per Pocket Logic (tasca digitale)
 * SINCRONIZZATO DAL SERVER - non usa più localStorage per i dati principali
 * Il server è la fonte di verità (item.status = IN_HAND)
 */
export const usePocketStore = create((set, get) => ({
    // Array di item IDs nella tasca (dal server)
    pocketItems: [],

    // Flag per indicare se stiamo caricando dal server
    isLoading: false,

    // Inizializza dal server (chiamato all'avvio dell'app)
    syncFromServer: async () => {
        set({ isLoading: true })
        try {
            const response = await fetch('/api/items/in-hand')
            if (response.ok) {
                const items = await response.json()
                set({ pocketItems: items.map(item => item.id) })
            }
        } catch (err) {
            console.error('Failed to sync pocket from server:', err)
        } finally {
            set({ isLoading: false })
        }
    },

    // Aggiunge item alla tasca (locale, il server viene aggiornato tramite API pick)
    addToPocket: (itemId) => {
        const current = get().pocketItems
        if (!current.includes(itemId)) {
            set({ pocketItems: [...current, itemId] })
        }
    },

    // Rimuove item dalla tasca (locale, il server viene aggiornato tramite API move)
    removeFromPocket: (itemId) => {
        set({
            pocketItems: get().pocketItems.filter(id => id !== itemId)
        })
    },

    // Svuota la tasca (dopo bulk move)
    clearPocket: () => set({ pocketItems: [] }),

    // Check se item è in tasca
    isInPocket: (itemId) => get().pocketItems.includes(itemId),

    // Conteggio items in tasca
    pocketCount: () => get().pocketItems.length
}))

/**
 * Store per UI state (non persistito)
 */
export const useUIStore = create((set) => ({
    // Modal states
    isCameraOpen: false,
    isScannerOpen: false,
    scannerMode: 'navigate', // 'navigate' | 'pocket'
    isSearchOpen: false,

    // Current context
    currentLocationId: null,
    currentLocationName: null,

    // Toast notifications
    toast: null,

    // Actions
    openCamera: (locationId, locationName) => set({
        isCameraOpen: true,
        currentLocationId: locationId,
        currentLocationName: locationName
    }),

    closeCamera: () => set({
        isCameraOpen: false
    }),

    // Scanner con modalità esplicita
    openScanner: (mode = 'navigate') => set({ isScannerOpen: true, scannerMode: mode }),
    closeScanner: () => set({ isScannerOpen: false, scannerMode: 'navigate' }),

    openSearch: () => set({ isSearchOpen: true }),
    closeSearch: () => set({ isSearchOpen: false }),

    setCurrentLocation: (id, name) => set({
        currentLocationId: id,
        currentLocationName: name
    }),

    // Toast con auto-dismiss
    showToast: (message, type = 'info', duration = 3000) => {
        set({ toast: { message, type } })
        setTimeout(() => set({ toast: null }), duration)
    },

    hideToast: () => set({ toast: null })
}))

/**
 * Store per upload queue (offline support)
 * Gestisce upload in background
 */
export const useUploadQueueStore = create(
    persist(
        (set, get) => ({
            // Coda upload pendenti
            queue: [],

            // Stato upload corrente
            isUploading: false,

            // Aggiunge item alla coda
            addToQueue: (item) => {
                set({ queue: [...get().queue, { ...item, id: Date.now() }] })
            },

            // Rimuove item dalla coda
            removeFromQueue: (id) => {
                set({ queue: get().queue.filter(item => item.id !== id) })
            },

            // Segna upload come in corso
            setUploading: (isUploading) => set({ isUploading }),

            // Numero items in coda
            queueCount: () => get().queue.length
        }),
        {
            name: 'kaos-upload-queue'
        }
    )
)
