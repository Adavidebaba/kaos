import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api'; // Adjust based on proxy/env

const api = axios.create({
    baseURL: API_URL,
});

export const getLocations = () => api.get('/locations/');
export const getLocation = (id) => api.get(`/locations/${id}`);
export const createLocation = (data) => api.post('/locations/', data);

export const getItems = () => api.get('/items/');
export const createItem = (formData) => api.post('/items/', formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});
export const updateItem = (id, data) => api.patch(`/items/${id}`, data);

export default api;
