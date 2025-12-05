/**
 * LocationCard - Card per visualizzazione location (posizione)
 */
export function LocationCard({ location, onClick }) {
    return (
        <div
            className="card-interactive p-4 cursor-pointer"
            onClick={() => onClick?.(location)}
        >
            <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 
                      flex items-center justify-center text-2xl">
                    📦
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">
                        {location.name}
                    </h3>
                    {location.description && (
                        <p className="text-dark-400 text-sm truncate">
                            {location.description}
                        </p>
                    )}
                </div>

                {/* Item Count */}
                <div className="text-center">
                    <span className="text-2xl font-bold text-amber-500">
                        {location.item_count}
                    </span>
                    <p className="text-dark-500 text-[10px]">oggetti</p>
                </div>
            </div>
        </div>
    )
}
