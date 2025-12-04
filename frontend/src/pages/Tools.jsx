/**
 * ToolsPage - Label Generator e Completa Descrizioni
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useUIStore } from '../store'
import { itemsApi } from '../api'

export function ToolsPage() {
    const navigate = useNavigate()
    const { showToast } = useUIStore()

    const [rangeStart, setRangeStart] = useState(100)
    const [rangeEnd, setRangeEnd] = useState(150)
    const [baseUrl, setBaseUrl] = useState('https://kaos.adavide.com')
    const [prefix, setPrefix] = useState('Scatola')

    // Fetch items senza descrizione
    const { data: itemsData } = useQuery({
        queryKey: ['items', 'no-description'],
        queryFn: () => itemsApi.list({ per_page: 100 })
    })

    // Filtra solo quelli senza descrizione
    const itemsNoDesc = (itemsData?.items || []).filter(item => !item.description || item.description.trim() === '')

    /**
     * Genera CSV per etichette
     */
    const generateCSV = () => {
        if (rangeStart >= rangeEnd) {
            showToast('❌ Range non valido', 'error')
            return
        }

        const rows = [
            ['ID', 'Nome', 'URL']
        ]

        for (let id = rangeStart; id <= rangeEnd; id++) {
            rows.push([
                id.toString(),
                `${prefix} ${id}`,
                `${baseUrl}/loc/${id}`
            ])
        }

        const csvContent = rows
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n')

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
            {/* Back button */}
            <button
                onClick={() => navigate('/')}
                className="btn-ghost px-2"
            >
                ← Home
            </button>

            <h1 className="text-xl font-bold text-white">
                🔧 Strumenti
            </h1>

            {/* ============ COMPLETA DESCRIZIONI ============ */}
            <section className="card p-5">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    ✏️ Completa Descrizioni
                    {itemsNoDesc.length > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {itemsNoDesc.length}
                        </span>
                    )}
                </h2>

                {itemsNoDesc.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {itemsNoDesc.map(item => (
                            <button
                                key={item.id}
                                onClick={() => navigate(`/item/${item.id}`)}
                                className="w-full flex items-center gap-3 p-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
                            >
                                <img
                                    src={`/${item.thumbnail_path}`}
                                    alt=""
                                    className="w-10 h-10 rounded-lg object-cover bg-dark-600"
                                />
                                <div className="flex-1 text-left">
                                    <p className="text-dark-400 text-sm italic">
                                        Senza descrizione
                                    </p>
                                    <p className="text-dark-500 text-xs">
                                        📦 {item.location_name || 'Sconosciuta'}
                                    </p>
                                </div>
                                <span className="text-amber-500">→</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 text-dark-500">
                        <p className="text-2xl mb-2">✅</p>
                        <p>Tutti gli oggetti hanno una descrizione!</p>
                    </div>
                )}
            </section>

            {/* ============ LABEL GENERATOR ============ */}
            <section className="card p-5">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    🏷️ Generatore Etichette
                </h2>

                <p className="text-dark-400 text-sm mb-4">
                    Genera un file CSV con i dati per stampare etichette QR code.
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
        </div>
    )
}
