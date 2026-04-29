import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0',
});

api.interceptors.request.use((config) => {})
