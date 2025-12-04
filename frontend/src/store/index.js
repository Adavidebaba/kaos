/**
 * Store globale Zustand per stato applicazione
 * Gestisce: pocket items, UI state, toast
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Store per Pocket Logic (tasca digitale)
 * Persistito in localStorage per sopravvivere ai refresh
 */
export const usePocketStore = create(
    persist(
        (set, get) => ({
            // Array di item IDs nella tasca
            pocketItems: [],

            // Aggiunge item alla tasca
            addToPocket: (itemId) => {
                const current = get().pocketItems
                if (!current.includes(itemId)) {
                    set({ pocketItems: [...current, itemId] })
                }
            },

            // Rimuove item dalla tasca
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
        }),
        {
            name: 'kaos-pocket', // chiave localStorage
        }
    )
)

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
