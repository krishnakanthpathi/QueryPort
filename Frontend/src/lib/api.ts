const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888/api/v1';

export const api = {
    get: async (endpoint: string) => {
        const token = localStorage.getItem('talentlayer_token');
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        if (!response.ok) {
            throw new Error(await response.text());
        }
        return response.json();
    },

    post: async (endpoint: string, data: any) => {
        const token = localStorage.getItem('talentlayer_token');
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(data),
        });

        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.message || 'API Error');
        }
        return responseData;
    },

    patch: async (endpoint: string, data: any) => {
        const token = localStorage.getItem('talentlayer_token');
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(data),
        });

        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.message || 'API Error');
        }
        return responseData;
    },
};
