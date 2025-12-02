import React, { useRef, useEffect, useState } from 'react';
import { Camera as CameraIcon, Search, Flashlight, X } from 'lucide-react';
import { clsx } from 'clsx';

const Camera = ({ onCapture, overlayText, onClose }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [hasPermission, setHasPermission] = useState(null);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }, // Use back camera
                audio: false,
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setHasPermission(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setHasPermission(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const captureFrame = (maxWidth = 1200) => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return null;

        const context = canvas.getContext('2d');
        const scale = Math.min(1, maxWidth / video.videoWidth);
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        return new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', 0.85);
        });
    };

    const handleCapture = async () => {
        const blob = await captureFrame(1200);
        if (blob) {
            onCapture(blob);
        }
    };

    const handleAliSearch = async () => {
        const blob = await captureFrame(800); // Resize for sharing
        if (!blob) return;

        const file = new File([blob], "search.jpg", { type: "image/jpeg" });

        if (navigator.share) {
            try {
                await navigator.share({
                    files: [file],
                    // NO text or title to ensure "Search Image" options appear on iOS
                });
            } catch (err) {
                console.error("Share failed:", err);
            }
        } else {
            alert("Sharing not supported on this device/browser.");
        }
    };

    if (hasPermission === false) {
        return <div className="p-4 text-center text-red-500">Camera permission denied. Please enable it.</div>;
    }

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* HUD Overlay */}
            <div className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-start pointer-events-none">
                <div className="bg-black/60 text-white px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 shadow-lg">
                    <span className="text-xs text-gray-300 uppercase tracking-widest block mb-1">Current Box</span>
                    <span className="text-3xl font-black tracking-tight text-yellow-400 drop-shadow-md">
                        {overlayText || "SCANNER"}
                    </span>
                </div>
                <button onClick={onClose} className="p-3 bg-black/50 rounded-full text-white pointer-events-auto active:bg-black/80 transition-colors">
                    <X size={28} />
                </button>
            </div>

            {/* Video Feed */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-gray-900">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="absolute min-w-full min-h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls */}
            <div className="bg-black/80 p-6 pb-10 flex justify-around items-center">
                <button
                    onClick={handleAliSearch}
                    className="flex flex-col items-center text-white gap-1"
                >
                    <div className="p-3 bg-blue-600 rounded-full">
                        <Search size={24} />
                    </div>
                    <span className="text-xs">Ali-Hack</span>
                </button>

                <button
                    onClick={handleCapture}
                    className="p-1 border-4 border-white rounded-full"
                >
                    <div className="w-16 h-16 bg-white rounded-full" />
                </button>

                <button className="flex flex-col items-center text-gray-400 gap-1">
                    <div className="p-3 bg-gray-700 rounded-full">
                        <Flashlight size={24} />
                    </div>
                    <span className="text-xs">Light</span>
                </button>
            </div>
        </div>
    );
};

export default Camera;
