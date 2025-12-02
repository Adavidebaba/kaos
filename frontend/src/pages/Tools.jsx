import React, { useState } from 'react';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

const Tools = () => {
    const [startId, setStartId] = useState(100);
    const [count, setCount] = useState(50);
    const [baseUrl, setBaseUrl] = useState(window.location.origin);

    const generateCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,ID,Label,URL\n";

        for (let i = 0; i < count; i++) {
            const id = parseInt(startId) + i;
            const url = `${baseUrl}/loc/${id}`;
            csvContent += `${id},Box ${id},${url}\n`;
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `kaos_labels_${startId}_to_${parseInt(startId) + parseInt(count) - 1}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="p-4 bg-gray-800 border-b border-gray-700 flex items-center gap-4">
                <Link to="/" className="p-2 bg-gray-700 rounded-full">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold">Tools & Setup</h1>
            </header>

            <main className="p-4">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-900/30 rounded-lg">
                            <Printer className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Label Generator</h2>
                            <p className="text-sm text-gray-400">Create QR codes for your boxes</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Start ID</label>
                            <input
                                type="number"
                                value={startId}
                                onChange={(e) => setStartId(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">How many labels?</label>
                            <input
                                type="number"
                                value={count}
                                onChange={(e) => setCount(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Base URL (for QR)</label>
                            <input
                                type="text"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                            />
                        </div>

                        <button
                            onClick={generateCSV}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-4 transition-colors"
                        >
                            <Download size={20} />
                            Download CSV
                        </button>

                        <p className="text-xs text-gray-500 text-center mt-4">
                            Import this CSV into your label printer software (Brother P-Touch, Dymo, etc.) and map the "URL" column to a QR Code object.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Tools;
