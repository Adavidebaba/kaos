/**
 * ItemCard - Card per visualizzazione item in griglia
 * 
 * Props:
 * - item: oggetto item
 * - onClick: callback click (navigazione)
 * - showLocation: mostra nome posizione
 * - showActions: mostra pulsanti Prendi/Riponi/Sposta (default true)
 * - onSposta: callback per Sposta (apre scanner)
 */
import { usePocketStore, useUIStore } from '../../store'
import { itemsApi } from '../../api'
import { useQueryClient } from '@tanstack/react-query'

export function ItemCard({
    item,
    onClick,
    showLocation = false,
    showActions = true,
    onSposta
}) {
    const queryClient = useQueryClient()
    const { isInPocket, addToPocket, removeFromPocket } = usePocketStore()
    const { showToast, openScanner } = useUIStore()
    const inPocket = isInPocket(item.id)

    // Prendi in mano
    const handlePrendi = async (e) => {
        e.stopPropagation()
        try {
            await itemsApi.pick(item.id)
            addToPocket(item.id)
            showToast('✋ Preso in mano!', 'success')
            queryClient.invalidateQueries(['items'])
        } catch (err) {
            showToast(`❌ ${err.message}`, 'error')
        }
    }

    // Riponi nella posizione originale (senza scanner)
    const handleRiponi = async (e) => {
        e.stopPropagation()
        if (!item.location_id) {
            showToast('❌ Posizione originale non trovata', 'error')
            return
        }
        try {
            await itemsApi.bulkMove([item.id], item.location_id)
            removeFromPocket(item.id)
            showToast(`📦 Riposto in: ${item.location_name}`, 'success')
            queryClient.invalidateQueries(['items'])
            queryClient.invalidateQueries(['pocket-items-details'])
        } catch (err) {
            showToast(`❌ ${err.message}`, 'error')
        }
    }

    // Sposta in nuova posizione (apre scanner)
    const handleSposta = (e) => {
        e.stopPropagation()
        // Salva item da spostare e apri scanner
        sessionStorage.setItem('reponi_single_item', item.id.toString())
        if (onSposta) {
            onSposta(item)
        } else {
            openScanner('pocket')
        }
    }

    const statusBadge = {
        available: { class: 'badge-available', label: '✓' },
        in_hand: { class: 'badge-in-hand', label: '✋' },
        lost: { class: 'badge-lost', label: '❓' },
        loaned: { class: 'badge bg-blue-500/20 text-blue-400', label: '📤' }
    }

    const badge = statusBadge[item.status] || statusBadge.available

    // Abbrevia nome posizione per pulsante
    const shortLocationName = item.location_name
        ? (item.location_name.length > 12 ? item.location_name.substring(0, 12) + '…' : item.location_name)
        : '?'

    return (
        <div
            className={`item-card cursor-pointer ${inPocket ? 'ring-2 ring-amber-500' : ''}`}
            onClick={() => onClick?.(item)}
        >
            {/* Thumbnail */}
            <img
                src={`/${item.thumbnail_path}`}
                alt={item.description || 'Item'}
                className="item-card-image"
                loading="lazy"
            />

            {/* Overlay con info */}
            <div className="item-card-overlay">
                {item.description && (
                    <p className="text-white text-xs line-clamp-2">
                        {item.description}
                    </p>
                )}
                {showLocation && item.location_name && (
                    <p className="text-amber-400 text-[10px] mt-0.5">
                        📦 {item.location_name}
                    </p>
                )}
            </div>

            {/* Status Badge */}
            <div className="absolute top-2 left-2">
                <span className={badge.class}>{badge.label}</span>
            </div>

            {/* Action Buttons */}
            {showActions && (
                <div className="absolute top-2 right-2 flex gap-1">
                    {inPocket ? (
                        <>
                            {/* Riponi nella posizione originale */}
                            <button
                                onClick={handleRiponi}
                                className="px-2 py-1 rounded-lg text-[10px] font-medium
                                           bg-green-600 text-white
                                           transition-all active:scale-90"
                                title={`Riponi in ${item.location_name}`}
                            >
                                📦 {shortLocationName}
                            </button>
                            {/* Sposta in altra posizione */}
                            <button
                                onClick={handleSposta}
                                className="px-2 py-1 rounded-lg text-[10px] font-medium
                                           bg-dark-800/80 text-white
                                           transition-all active:scale-90"
                            >
                                🚀
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handlePrendi}
                            className="px-2 py-1 rounded-lg text-xs font-medium
                                       bg-dark-800/80 text-white
                                       transition-all active:scale-90"
                        >
                            Prendi
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
