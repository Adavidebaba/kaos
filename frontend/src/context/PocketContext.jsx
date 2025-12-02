import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const PocketContext = createContext();

export const usePocket = () => useContext(PocketContext);

export const PocketProvider = ({ children }) => {
    const [pocketItems, setPocketItems] = useState(() => {
        const saved = localStorage.getItem('pocketItems');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('pocketItems', JSON.stringify(pocketItems));
    }, [pocketItems]);

    const addToPocket = (item) => {
        // Avoid duplicates
        if (!pocketItems.find(i => i.id === item.id)) {
            setPocketItems(prev => [...prev, item]);
        }
    };

    const removeFromPocket = (itemId) => {
        setPocketItems(prev => prev.filter(i => i.id !== itemId));
    };

    const emptyPocket = async (locationId) => {
        if (pocketItems.length === 0) return;

        try {
            const itemIds = pocketItems.map(i => i.id);
            await api.post('/items/bulk-update', {
                item_ids: itemIds,
                location_id: locationId
            });

            // Clear pocket on success
            setPocketItems([]);
            return true;
        } catch (err) {
            console.error("Failed to empty pocket", err);
            return false;
        }
    };

    return (
        <PocketContext.Provider value={{ pocketItems, addToPocket, removeFromPocket, emptyPocket }}>
            {children}
        </PocketContext.Provider>
    );
};
