import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});
