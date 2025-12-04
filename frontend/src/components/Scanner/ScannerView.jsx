/**
 * ScannerView - Scanner QR Code per scansione scatole
 * Supporta: navigazione, riponi tutti, riponi singolo
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useScanner } from '../../hooks'
import { useUIStore, usePocketStore } from '../../store'
import { itemsApi } from '../../api'

export function ScannerView({ onClose, mode = 'navigate' }) {
    const navigate = useNavigate()
    const { showToast, closeScanner } = useUIStore()
    const { pocketItems, removeFromPocket, clearPocket } = usePocketStore()
    const containerId = useRef(`scanner-${Date.now()}`).current

    // Controlla se c'è un singolo item da riporre (salvato da Home.jsx)
    const [singleItemId, setSingleItemId] = useState(null)

    useEffect(() => {
        const savedItemId = sessionStorage.getItem('reponi_single_item')
        if (savedItemId) {
            setSingleItemId(parseInt(savedItemId, 10))
            sessionStorage.removeItem('reponi_single_item')
        }
    }, [])

    const handleScan = async (qrText) => {
        // Parse location ID dal QR
        const locationId = parseLocationFromQR(qrText)

        if (!locationId) {
            showToast('❌ QR non valido', 'error')
            return
        }

        // Vibra per feedback
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100])
        }

        // CASO 1: Riponi singolo item
        if (singleItemId) {
            try {
                await itemsApi.bulkMove([singleItemId], locationId)
                removeFromPocket(singleItemId)
                showToast('✅ Oggetto spostato!', 'success')
                closeScanner()
            } catch (err) {
                showToast(`❌ ${err.message}`, 'error')
            }
            return
        }

        // CASO 2: Pocket mode - sposta TUTTI gli items nella location
        if (mode === 'pocket' && pocketItems.length > 0) {
            try {
                await itemsApi.bulkMove(pocketItems, locationId)
                clearPocket()
                showToast(`✅ ${pocketItems.length} oggetti spostati!`, 'success')
                closeScanner()
            } catch (err) {
                showToast(`❌ ${err.message}`, 'error')
            }
            return
        }

        // CASO 3: Navigate mode - vai alla location
        closeScanner()
        navigate(`/loc/${locationId}`)
    }

    const { containerRef, isScanning, error, startScanning, stopScanning, parseLocationFromQR } = useScanner(handleScan)

    // Avvia scanner all'apertura
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.id = containerId
        }

        const timer = setTimeout(() => {
            startScanning()
        }, 100)

        return () => {
            clearTimeout(timer)
            stopScanning()
        }
    }, [])

    const handleClose = () => {
        stopScanning()
        // Pulisci eventuali item singoli salvati
        sessionStorage.removeItem('reponi_single_item')
        if (onClose) onClose()
        else closeScanner()
    }

    // Determina il messaggio da mostrare
    const getMessage = () => {
        if (singleItemId) {
            return '📦 Scansiona dove posare l\'oggetto'
        }
        if (mode === 'pocket' && pocketItems.length > 0) {
            return `📦 Scansiona dove posare ${pocketItems.length} oggetti`
        }
        return '📷 Inquadra il QR della scatola'
    }

    return (
        <div className="camera-container">
            {/* Scanner Container */}
            <div
                ref={containerRef}
                id={containerId}
                className="w-full h-full"
            />

            {/* Overlay con frame */}
            <div className="scanner-overlay pointer-events-none">
                <div className="scanner-frame" />
            </div>

            {/* Istruzioni */}
            <div className="absolute top-20 inset-x-0 text-center z-10 safe-top">
                <p className="text-white text-lg font-medium drop-shadow-lg">
                    {getMessage()}
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="absolute bottom-32 inset-x-4 bg-red-900/80 rounded-xl p-3 text-center">
                    <p className="text-red-200">{error}</p>
                </div>
            )}

            {/* Close Button */}
            <div className="absolute top-4 left-4 z-20 safe-top">
                <button onClick={handleClose} className="btn-icon">
                    ✕
                </button>
            </div>

            {/* Status */}
            <div className="absolute bottom-8 inset-x-0 text-center safe-bottom">
                <span className="px-4 py-2 rounded-full bg-dark-800/80 text-dark-300 text-sm">
                    {isScanning ? '🔍 Scansione attiva...' : '⏳ Avvio scanner...'}
                </span>
            </div>
        </div>
    )
}
