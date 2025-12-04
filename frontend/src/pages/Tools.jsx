/**
 * ToolsPage - Label Generator e altri strumenti
 */
import { useState } from 'react'
import { useUIStore } from '../store'

export function ToolsPage() {
    const { showToast } = useUIStore()

    const [rangeStart, setRangeStart] = useState(100)
    const [rangeEnd, setRangeEnd] = useState(150)
    const [baseUrl, setBaseUrl] = useState('https://kaos.adavide.com')
    const [prefix, setPrefix] = useState('Scatola')

    /**
     * Genera CSV per etichette
     */
    const generateCSV = () => {
        if (rangeStart >= rangeEnd) {
            showToast('❌ Range non valido', 'error')
            return
        }

        const rows = [
            ['ID', 'Nome', 'URL']  // Header
        ]

        for (let id = rangeStart; id <= rangeEnd; id++) {
            rows.push([
                id.toString(),
                `${prefix} ${id}`,
                `${baseUrl}/loc/${id}`
            ])
        }

        // Converti in CSV
        const csvContent = rows
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n')

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `etichette_${rangeStart}-${rangeEnd}.csv`
        link.click()
        URL.revokeObjectURL(url)

        showToast(`✅ Generato CSV per ${rangeEnd - rangeStart + 1} etichette`, 'success')
    }

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-xl font-bold text-white">
                🔧 Strumenti
            </h1>

            {/* Label Generator */}
            <section className="card p-5">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    🏷️ Generatore Etichette
                </h2>

                <p className="text-dark-400 text-sm mb-4">
                    Genera un file CSV con i dati per stampare etichette QR code
                    compatibile con software Brother/Dymo.
                </p>

                <div className="space-y-4">
                    {/* Range */}
                    <div>
                        <label className="text-dark-300 text-sm font-medium mb-1 block">
                            Range ID
                        </label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="number"
                                value={rangeStart}
                                onChange={(e) => setRangeStart(parseInt(e.target.value) || 0)}
                                className="input flex-1"
                                min="1"
                            />
                            <span className="text-dark-500">→</span>
                            <input
                                type="number"
                                value={rangeEnd}
                                onChange={(e) => setRangeEnd(parseInt(e.target.value) || 0)}
                                className="input flex-1"
                                min="1"
                            />
                        </div>
                    </div>

                    {/* Prefix */}
                    <div>
                        <label className="text-dark-300 text-sm font-medium mb-1 block">
                            Prefisso Nome
                        </label>
                        <input
                            type="text"
                            value={prefix}
                            onChange={(e) => setPrefix(e.target.value)}
                            className="input"
                            placeholder="es. Scatola, Box, S"
                        />
                    </div>

                    {/* Base URL */}
                    <div>
                        <label className="text-dark-300 text-sm font-medium mb-1 block">
                            URL Base
                        </label>
                        <input
                            type="url"
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            className="input"
                            placeholder="https://kaos.adavide.com"
                        />
                    </div>

                    {/* Preview */}
                    <div className="bg-dark-900 rounded-lg p-3">
                        <p className="text-dark-500 text-xs mb-2">Anteprima URL:</p>
                        <code className="text-amber-400 text-sm break-all">
                            {baseUrl}/loc/{rangeStart}
                        </code>
                    </div>

                    {/* Generate Button */}
                    <button onClick={generateCSV} className="btn-primary w-full">
                        📥 Scarica CSV ({rangeEnd - rangeStart + 1} etichette)
                    </button>
                </div>
            </section>

            {/* Info */}
            <section className="card p-5 bg-dark-800/50">
                <h3 className="text-white font-medium mb-2">
                    ℹ️ Come usare
                </h3>
                <ol className="text-dark-400 text-sm space-y-2 list-decimal list-inside">
                    <li>Genera il CSV con il range di ID desiderato</li>
                    <li>Importa in software etichettatrice (Brother P-Touch, Dymo Label)</li>
                    <li>Configura il QR code per usare la colonna "URL"</li>
                    <li>Stampa e applica le etichette alle scatole</li>
                    <li>Scansiona per attivare automaticamente ogni scatola!</li>
                </ol>
            </section>
        </div>
    )
}
