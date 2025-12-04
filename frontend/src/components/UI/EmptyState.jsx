/**
 * EmptyState - Stato vuoto per liste
 */
export function EmptyState({
    icon = '📭',
    title = 'Nessun elemento',
    description = '',
    action = null
}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <span className="text-5xl mb-4">{icon}</span>
            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
            {description && (
                <p className="text-dark-400 text-sm mb-4">{description}</p>
            )}
            {action}
        </div>
    )
}
