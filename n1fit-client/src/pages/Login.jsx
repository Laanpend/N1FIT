import React, { useState } from 'react';
import api from '../api/axiosConfig';
import { LogIn, Dumbbell } from 'lucide-react'; // İkonlar için
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

   const parseJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/Auth/login', { email, password });
            const token = res.data.token;

            // CYBORG ÇÖZÜCÜYÜ KULLANIYORUZ
            const payload = parseJwt(token);
            
            if (!payload) {
                setError("Token parçalanamadı dayı, sistemde arıza var.");
                return;
            }

            const userRole = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role;

            if (userRole !== 'Admin') {
                setError("Aslanım burası yönetim kapısı, müşteriysen ana sayfadan gir!");
                return; 
            }

            localStorage.setItem('n1fit_token', token);
            navigate('/admin');
            
        } catch (err) {
            setError('Giriş patladı dayı! Şifreyi veya maili yanlış girdin.');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.loginBox}>
                <div style={styles.header}>
                    <Dumbbell size={40} color="var(--n1fit-red)" />
                    <h1 style={styles.title}>N1FIT</h1>
                </div>
                
                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label>E-Posta</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="canavar@n1fit.com"
                            required 
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label>Şifre</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="********"
                            required 
                        />
                    </div>
                    {error && <p style={styles.error}>{error}</p>}
                    <button type="submit" className="btn-n1fit" style={styles.button}>
                        <LogIn size={20} style={{ marginRight: '10px' }} />
                        GİRİŞ YAP
                    </button>
                </form>
            </div>
        </div>
    );
};

// Satır içi stiller (CSS dosyasını da kullanabilirsin ama böyle daha hızlı olur)
const styles = {
    container: {
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'var(--n1fit-black)',
    },
    loginBox: {
        width: '400px',
        padding: '40px',
        border: '2px solid var(--n1fit-red)',
        borderRadius: '10px',
        backgroundColor: '#111',
        boxShadow: '0 0 20px rgba(217, 4, 41, 0.2)',
    },
    header: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '30px',
    },
    title: {
        fontSize: '2.5rem',
        margin: '10px 0',
        letterSpacing: '5px',
        color: 'var(--n1fit-white)',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    inputGroup: {
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
    },
    error: {
        color: 'var(--n1fit-red)',
        fontSize: '0.9rem',
        marginBottom: '15px',
        textAlign: 'center',
    },
    button: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px',
        fontSize: '1.1rem',
        cursor: 'pointer',
    }
};

export default Login;