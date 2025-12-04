/**
 * ItemCard - Card per visualizzazione item in griglia
 */
import { usePocketStore } from '../../store'

export function ItemCard({ item, onClick, showLocation = false }) {
    const { isInPocket, addToPocket, removeFromPocket } = usePocketStore()
    const inPocket = isInPocket(item.id)

    const handlePocketToggle = (e) => {
        e.stopPropagation()
        if (inPocket) {
            removeFromPocket(item.id)
        } else {
            addToPocket(item.id)
        }
    }

    const statusBadge = {
        available: { class: 'badge-available', label: '✓' },
        in_hand: { class: 'badge-in-hand', label: '✋' },
        lost: { class: 'badge-lost', label: '❓' },
        loaned: { class: 'badge bg-blue-500/20 text-blue-400', label: '📤' }
    }

    const badge = statusBadge[item.status] || statusBadge.available

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

            {/* Pocket Toggle */}
            <button
                onClick={handlePocketToggle}
                className={`absolute top-2 right-2 w-8 h-8 rounded-full 
                   flex items-center justify-center text-lg
                   transition-all active:scale-90
                   ${inPocket
                        ? 'bg-amber-500 text-dark-900'
                        : 'bg-dark-800/80 text-white'
                    }`}
            >
                {inPocket ? '👜' : '✋'}
            </button>
        </div>
    )
}
