import axios from 'axios';

const api = axios.create({
    // Buradaki port numarası senin Swagger'ın çalıştığı portla aynı olmalı (7011, 5001 vb.)
    baseURL: 'https://unsnap-undertook-finalist.ngrok-free.dev/api',
    headers: {
        // NGROK'UN UYARI SAYFASINI TEK ATARAK GEÇEN ZIRH DELİCİ MERMİ!
        'ngrok-skip-browser-warning': 'true'
    }
});

// Her istekte "Acaba token var mı?" diye kontrol edip varsa kafasına yapıştırıyoruz
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('n1fit_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
},
    (error) => Promise.reject(error)
);

export default api;