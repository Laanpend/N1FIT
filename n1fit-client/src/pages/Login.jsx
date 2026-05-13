import React, { useState } from 'react';
import api from '../api/axiosConfig';
import { LogIn, Dumbbell } from 'lucide-react'; // İkonlar için

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

   const handleLogin = async (e) => {
    e.preventDefault();
    try {
        // Backend'deki DTO ile birebir uyması için baş harflerini büyük dene
        const response = await api.post('/Auth/login', { 
            Email: email, 
            Password: password 
        });
        
        const token = response.data.token;
        localStorage.setItem('n1fit_token', token);
        
        alert("N1FIT Dünyasına Hoş Geldin Kral!");

        // YENİ MOTOR: Token'ın göbeğini (Payload) yarıp içindeki rütbeyi okuyoruz
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

        // Raconu kesiyoruz: Rütbesi 2 (Admin) olanı VIP'ye, diğerlerini sahaya alıyoruz.
        // Eğer senin C# tarafında roller "Admin" ve "Member" diye kelime olarak geliyorsa "2" yerine "Admin" yaz.
        if (userRole === "2" || userRole === "Admin") {
            window.location.href = '/admin'; // Patron Mekanı
        } else {
            window.location.href = '/member'; // Müşteri Mekanı
        }
        
    } catch (err) {
        console.error(err); 
        setError("Giriş patladı, e-posta/şifre yanlış veya sunucu yandı emmoğlu.");
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