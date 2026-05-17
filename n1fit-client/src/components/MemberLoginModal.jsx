import React, { useState } from 'react';
import api from '../api/axiosConfig';

const MemberLoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // C#'taki aynı API'ye mermiyi sıkıyoruz
            const res = await api.post('/Auth/login', { email, password });
            
            // Token'ı cebe at
            localStorage.setItem('n1fit_token', res.data.token);
            
            // Ana sayfadaki motoru tetikle ve modalı kapat
            onLoginSuccess();
            onClose();
        } catch (err) {
            setError('Giriş patladı dayı! Bilgileri kontrol et.');
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h2 style={{ color: '#d90429', marginTop: 0, textAlign: 'center' }}>N1FIT GİRİŞ</h2>
                
                {error && <div style={{ backgroundColor: 'rgba(217, 4, 41, 0.2)', color: '#d90429', padding: '10px', borderRadius: '5px', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}
                
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input 
                        type="email" 
                        placeholder="E-Posta" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        style={styles.input} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Şifre" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        style={styles.input} 
                        required 
                    />
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button type="submit" style={styles.loginBtn}>GİRİŞ YAP</button>
                        <button type="button" onClick={onClose} style={styles.cancelBtn}>İPTAL</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
    modal: { backgroundColor: '#111', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid #333', boxShadow: '0 0 20px rgba(217, 4, 41, 0.2)' },
    input: { padding: '15px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#222', color: 'white', fontSize: '1rem' },
    loginBtn: { flex: 1, padding: '12px', backgroundColor: '#d90429', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '900', fontSize: '1rem' },
    cancelBtn: { flex: 1, padding: '12px', backgroundColor: 'transparent', color: '#aaa', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default MemberLoginModal;