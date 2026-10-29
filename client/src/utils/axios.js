import axios from 'axios';

/**
 * Axios Instance configured for both Local Development and Vercel Production.
 * 
 * - In Production on Vercel: Relative path '/api' hits Vercel's rewrite engine
 *   and executes the Serverless Function at /api/index.js (same origin, 0 CORS issues).
 * - In Local Development: Vite's dev server proxies '/api' to http://localhost:5000/api.
 * - Override: If VITE_API_BASE_URL is explicitly set in .env, it takes highest precedence.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
    baseURL,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
