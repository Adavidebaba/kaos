import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Camera from '../components/Camera';
import { getLocation, createLocation } from '../api'; // Removed createItem
import { AlertCircle, CheckCircle, Package, Plus } from 'lucide-react';
import { useUploadQueue } from '../context/UploadContext'; // Added import

const LocationView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToQueue } = useUploadQueue(); // Added destructuring
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        checkLocation();
    }, [id]);

    const checkLocation = async () => {
        try {
            setLoading(true);
            const res = await getLocation(id);
            setLocation(res.data);
            setShowCamera(true); // Auto-open camera if exists
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setLocation(null); // Not found -> Show Claim UI
            } else {
                console.error(err);
                showToast("Error loading location", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async () => {
        try {
            const res = await createLocation({
                name: `Box ${id}`, // Default name
                description: "Created via Quick Scan",
                id: parseInt(id) // Force ID
            });
            setLocation(res.data);
            setShowCamera(true);
        } catch (err) {
            console.error(err);
            showToast("Failed to create location", "error");
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleCapture = (blob) => { // Removed async
        if (!location) return;

        // Optimistic UI: Instant Feedback
        showToast("Item Saved!", "success");

        // Add to background queue
        addToQueue({ location_id: location.id }, blob);
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
    }

    // Case 1: Location Exists -> Show Camera (or Dashboard if closed)
    if (location) {
        if (showCamera) {
            return (
                <>
                    {toast && (
                        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-xl flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
                            {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                            <span className="font-bold">{toast.message}</span>
                        </div>
                    )}

                    {/* Pocket Button Overlay */}
                    {pocketItems.length > 0 && (
                        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[60]">
                            <button
                                onClick={handleEmptyPocket}
                                className="bg-orange-600 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 animate-bounce"
                            >
                                <Briefcase size={20} />
                                Empty Pocket ({pocketItems.length})
                            </button>
                        </div>
                    )}

                    <Camera
                        onClose={() => navigate('/')} // Close goes home
                        onCapture={handleCapture}
                        overlayText={location.name}
                    />
                </>
            );
        }
        return <div>Location Dashboard (TODO)</div>;
    }

    // Case 2: Location Does Not Exist -> Claim UI
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 w-full max-w-md text-center">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Package size={40} className="text-gray-400" />
                </div>

                <h1 className="text-3xl font-bold mb-2">Box #{id}</h1>
                <p className="text-gray-400 mb-8">This box is not in the system yet.</p>

                <button
                    onClick={handleClaim}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-lg"
                >
                    <Plus size={24} />
                    Initialize Box
                </button>

                <button
                    onClick={() => navigate('/')}
                    className="mt-4 text-gray-500 text-sm hover:text-white"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default LocationView;
