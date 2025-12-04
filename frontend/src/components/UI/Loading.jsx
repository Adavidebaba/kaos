/**
 * LoadingSpinner - Indicatore di caricamento
 */
export function LoadingSpinner({ size = 'md', className = '' }) {
    const sizes = {
        sm: 'w-4 h-4 border',
        md: 'w-8 h-8 border-2',
        lg: 'w-12 h-12 border-3'
    }

    return (
        <div className={`${sizes[size]} border-dark-600 border-t-amber-500 rounded-full animate-spin ${className}`} />
    )
}

/**
 * LoadingPage - Schermata di caricamento full page
 */
export function LoadingPage({ message = 'Caricamento...' }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-dark-400">{message}</p>
        </div>
    )
}
