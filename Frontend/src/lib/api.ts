const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888/api/v1';

export const SESSION_EXPIRED_EVENT = 'queryport:session-expired';

function handleResponseError(response: Response, body: { message?: string } | null): never {
    if (response.status === 401) {
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    const message = body?.message || (response.status === 401 ? 'Session expired. Please log in again.' : 'API Error');
    throw new Error(message);
}

export const api = {
    get: async (endpoint: string) => {
        const token = localStorage.getItem('queryport_token');
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        if (!response.ok) {
            let body: { message?: string } | null = null;
            try {
                body = await response.json();
            } catch {
                // ignore
            }
            handleResponseError(response, body);
        }
        return response.json();
    },

    post: async (endpoint: string, data: any) => {
        const token = localStorage.getItem('queryport_token');
        const headers: any = {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        if (!(data instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: data instanceof FormData ? data : JSON.stringify(data),
        });

        const responseData = await response.json();
        if (!response.ok) {
            handleResponseError(response, responseData);
        }
        return responseData;
    },

    patch: async (endpoint: string, data: any) => {
        const token = localStorage.getItem('queryport_token');
        const headers: any = {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        if (!(data instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers,
            body: data instanceof FormData ? data : JSON.stringify(data),
        });

        const responseData = await response.json();
        if (!response.ok) {
            handleResponseError(response, responseData);
        }
        return responseData;
    },

    delete: async (endpoint: string) => {
        const token = localStorage.getItem('queryport_token');
        const headers: any = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers,
        });

        if (response.status === 204) {
            return null;
        }

        const responseData = await response.json();
        if (!response.ok) {
            handleResponseError(response, responseData);
        }
        return responseData;
    },
};
