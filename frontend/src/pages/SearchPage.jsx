import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, Briefcase, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { usePocket } from '../context/PocketContext';

const SearchPage = () => {
    const navigate = useNavigate();
    const { addToPocket, pocketItems } = usePocket();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 2) {
                performSearch();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    const performSearch = async () => {
        setLoading(true);
        try {
            // TODO: Implement proper search endpoint in backend
            // For now, fetch all and filter client-side (MVP)
            const res = await api.get('/items/');
            const filtered = res.data.filter(item =>
                item.description && item.description.toLowerCase().includes(query.toLowerCase())
            );
            setResults(filtered);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFlashMove = (item) => {
        // Flash Move: Select item -> Go to "Scan Target" mode
        // We can simulate this by adding to pocket (exclusive mode) or just navigating
        // For MVP: Add to pocket and go to home to scan
        addToPocket(item);
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            {/* Header */}
            <header className="p-4 bg-gray-800 border-b border-gray-700 flex items-center gap-4">
                <Link to="/" className="p-2 bg-gray-700 rounded-full">
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-full py-2 pl-10 pr-4 text-white focus:border-blue-500 outline-none"
                        autoFocus
                    />
                </div>
            </header>

            {/* Results */}
            <main className="flex-1 p-4 overflow-y-auto">
                {loading && <div className="text-center text-gray-500 mt-4">Searching...</div>}

                <div className="space-y-3">
                    {results.map(item => (
                        <div key={item.id} className="bg-gray-800 p-3 rounded-xl flex items-center gap-3 border border-gray-700">
                            <div className="w-16 h-16 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0">
                                {item.thumbnail_path ? (
                                    <img src={`/uploads/thumbs/${item.thumbnail_path}`} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600">No Img</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold truncate">{item.description || "Unnamed Item"}</div>
                                <div className="text-xs text-gray-400">Box #{item.location_id}</div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => addToPocket(item)}
                                    className="p-2 bg-gray-700 rounded-lg text-orange-400 active:bg-gray-600"
                                >
                                    <Briefcase size={20} />
                                </button>
                                <button
                                    onClick={() => handleFlashMove(item)}
                                    className="p-2 bg-blue-600 rounded-lg text-white active:bg-blue-500"
                                >
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Pocket Footer */}
            {pocketItems.length > 0 && (
                <div className="p-4 bg-gray-800 border-t border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-orange-400 font-bold">
                        <Briefcase size={20} />
                        <span>{pocketItems.length} in Pocket</span>
                    </div>
                    <Link to="/" className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
                        Go Scan Box
                    </Link>
                </div>
            )}
        </div>
    );
};

export default SearchPage;
