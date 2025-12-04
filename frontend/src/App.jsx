/**
 * App - Root component con routing
 */
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ScannerView } from './components/Scanner'
import {
    HomePage,
    LocationPage,
    LocationsListPage,
    ItemsListPage,
    SearchPage,
    ToolsPage,
    ItemDetailPage
} from './pages'
import { useUIStore, usePocketStore } from './store'

function App() {
    const { isScannerOpen, scannerMode, closeScanner } = useUIStore()

    return (
        <>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="loc/:id" element={<LocationPage />} />
                    <Route path="locations" element={<LocationsListPage />} />
                    <Route path="items" element={<ItemsListPage />} />
                    <Route path="item/:id" element={<ItemDetailPage />} />
                    <Route path="search" element={<SearchPage />} />
                    <Route path="tools" element={<ToolsPage />} />
                </Route>
            </Routes>

            {/* Global Scanner Modal */}
            {isScannerOpen && (
                <ScannerView
                    mode={scannerMode}
                    onClose={closeScanner}
                />
            )}
        </>
    )
}

export default App
