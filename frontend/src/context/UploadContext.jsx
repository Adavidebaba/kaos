import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createItem } from '../api';

const UploadContext = createContext();

export const useUploadQueue = () => useContext(UploadContext);

export const UploadProvider = ({ children }) => {
    const [queue, setQueue] = useState(() => {
        const saved = localStorage.getItem('uploadQueue');
        return saved ? JSON.parse(saved) : [];
    });
    const [isProcessing, setIsProcessing] = useState(false);

    // Persist queue
    useEffect(() => {
        localStorage.setItem('uploadQueue', JSON.stringify(queue));
    }, [queue]);

    // Process queue
    useEffect(() => {
        if (queue.length > 0 && !isProcessing) {
            processQueue();
        }
    }, [queue, isProcessing]);

    const addToQueue = (itemData, blob) => {
        // We need to convert blob to base64 to store in localStorage (for persistence across reloads)
        // However, storing large images in LS is bad. 
        // Strategy: Store metadata in LS, keep Blob in memory or IndexedDB.
        // For MVP/Speed: We will try to upload immediately. If fail, we keep in memory.
        // If user reloads, they might lose pending uploads (Acceptable for V1, can improve with IndexedDB later).

        const id = Date.now();
        const newItem = {
            id,
            data: itemData,
            blob: blob, // Note: Blob is not serializable to JSON directly
            status: 'pending', // pending, uploading, error
            retries: 0
        };

        setQueue(prev => [...prev, newItem]);
    };

    const processQueue = async () => {
        setIsProcessing(true);
        const item = queue.find(i => i.status === 'pending' || i.status === 'error');

        if (!item) {
            setIsProcessing(false);
            return;
        }

        try {
            // Update status to uploading
            setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading' } : i));

            const formData = new FormData();
            formData.append('file', item.blob, 'capture.jpg');
            formData.append('location_id', item.data.location_id);
            if (item.data.description) {
                formData.append('description', item.data.description);
            }

            await createItem(formData);

            // Success: Remove from queue
            setQueue(prev => prev.filter(i => i.id !== item.id));

        } catch (err) {
            console.error("Upload failed", err);
            // Error: Mark as error, increment retries
            setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', retries: i.retries + 1 } : i));

            // Wait a bit before next retry loop to avoid hammering
            await new Promise(r => setTimeout(r, 5000));
        } finally {
            setIsProcessing(false);
        }
    };

    const retryAll = () => {
        setQueue(prev => prev.map(i => ({ ...i, status: 'pending' })));
    };

    return (
        <UploadContext.Provider value={{ queue, addToQueue, retryAll }}>
            {children}
        </UploadContext.Provider>
    );
};
