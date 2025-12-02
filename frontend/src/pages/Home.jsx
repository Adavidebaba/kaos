import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Search as SearchIcon, Camera as CameraIcon, Settings } from 'lucide-react';

const Home = () => {
    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-blue-400">Kaos 2.0</h1>
                <Link to="/tools" className="p-2 bg-gray-700 rounded-full">
                    <Settings size={20} className="text-gray-300" />
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 overflow-y-auto">
                {/* Action Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <Link to="/loc/new" className="bg-blue-600 p-4 rounded-2xl flex flex-col items-center justify-center h-32 active:scale-95 transition-transform shadow-lg shadow-blue-900/20">
                        <CameraIcon size={32} className="mb-2 text-white" />
                        <span className="font-bold text-lg">Quick Scan</span>
                        <span className="text-xs text-blue-200 mt-1">Identify Box</span>
                    </Link>
                    <Link to="/search" className="bg-gray-800 p-4 rounded-2xl flex flex-col items-center justify-center h-32 active:scale-95 transition-transform border border-gray-700">
                        <SearchIcon size={32} className="mb-2 text-blue-400" />
                        <span className="font-bold text-lg">Find Item</span>
                    </Link>
                </div>

                <h2 className="mt-6 mb-4 text-lg font-semibold text-gray-400 uppercase tracking-wider text-sm">Recent Locations</h2>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <Link key={i} to={`/loc/${100 + i}`} className="bg-gray-800 p-4 rounded-xl flex items-center border border-gray-700 active:bg-gray-700 transition-colors block">
                            <div className="p-3 bg-gray-900 rounded-lg mr-4">
                                <Package className="text-yellow-500" size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-lg">Box #{100 + i}</div>
                                <div className="text-sm text-gray-500">Garage • 12 items</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Home;
