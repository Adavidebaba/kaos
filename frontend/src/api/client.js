/**
 * API Client per comunicazione con backend FastAPI
 */

const API_BASE = '/api'

/**
 * Gestisce errori HTTP e parsing JSON
 */
async function handleResponse(response) {
    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || `HTTP ${response.status}`)
    }

    // 204 No Content
    if (response.status === 204) {
        return null
    }

    return response.json()
}

/**
 * Fetch wrapper con gestione errori
 */
async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`

    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    })

    return handleResponse(response)
}

// ============== Locations API ==============

export const locationsApi = {
    list: (parentId = null) => {
        const params = parentId ? `?parent_id=${parentId}` : ''
        return request(`/locations${params}`)
    },

    get: (id) => request(`/locations/${id}`),

    create: (data) => request('/locations', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    claim: (id, data) => request(`/locations/claim/${id}`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    update: (id, data) => request(`/locations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    }),

    delete: (id) => request(`/locations/${id}`, {
        method: 'DELETE'
    })
}

// ============== Items API ==============

export const itemsApi = {
    list: (params = {}) => {
        const searchParams = new URLSearchParams()
        if (params.locationId) searchParams.set('location_id', params.locationId)
        if (params.status) searchParams.set('status', params.status)
        if (params.page) searchParams.set('page', params.page)
        if (params.perPage) searchParams.set('per_page', params.perPage)

        const query = searchParams.toString()
        return request(`/items${query ? `?${query}` : ''}`)
    },

    get: (id) => request(`/items/${id}`),

    inHand: () => request('/items/in-hand'),

    create: (data) => request('/items', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    update: (id, data) => request(`/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    }),

    pick: (id) => request(`/items/${id}/pick`, {
        method: 'POST'
    }),

    bulkMove: (itemIds, targetLocationId) => request('/items/bulk/move', {
        method: 'POST',
        body: JSON.stringify({
            item_ids: itemIds,
            target_location_id: targetLocationId
        })
    }),

    delete: (id) => request(`/items/${id}`, {
        method: 'DELETE'
    })
}

// ============== Search API ==============

export const searchApi = {
    search: (query, limit = 20) => {
        return request(`/search?q=${encodeURIComponent(query)}&limit=${limit}`)
    }
}

// ============== Upload API ==============

export const uploadApi = {
    upload: async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData
            // Non impostare Content-Type, il browser lo fa automaticamente per FormData
        })

        return handleResponse(response)
    }
}

// ============== Stats API ==============

export const statsApi = {
    get: () => request('/stats'),
    health: () => request('/health')
}
