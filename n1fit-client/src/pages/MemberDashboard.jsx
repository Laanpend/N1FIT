import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle, Dumbbell, Activity, Target,
    ShieldCheck, CheckCircle, ChevronRight, ChevronLeft, Zap,
    Utensils, Ruler, CreditCard, LogIn, Lock, Mail, MessageCircle
} from 'lucide-react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import WorkoutTab from '../components/WorkoutTab';
import DietTab from '../components/DietTab';
import MeasurementTab from '../components/MeasurementTab';
import MembershipTab from '../components/MembershipTab';
import InteractiveBodyExerciseMap from '../components/InteractiveBodyExerciseMap';

function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const MemberDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Zorunlu Üye Girişi Formu State'leri
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginSubmitting, setLoginSubmitting] = useState(false);

    const [isNotifyGranted, setIsNotifyGranted] = useState(
        'Notification' in window ? Notification.permission === 'granted' : false
    );

    const PUBLIC_VAPID_KEY = "BGme68ndHvhXyZ8dtnIIcsE89ELVrcXIaiDNrA4zACgknZbOaCPL9ny1E6qlo7MoNr22EhFqv8NdFVMnw3V6hhY";

    const [profile, setProfile] = useState(null);
    const [workouts, setWorkouts] = useState([]);
    const [diets, setDiets] = useState([]);
    const [measurements, setMeasurements] = useState([]);

    const parseJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
        } catch { return null; }
    };

    useEffect(() => {
        const token = localStorage.getItem('n1fit_token');
        if (token) {
            const payload = parseJwt(token);
            if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
                localStorage.removeItem('n1fit_token');
                setIsLoggedIn(false);
                setLoading(false);
                return;
            }

            const userRole = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role;
            if (userRole === 'Admin' || userRole === '1') {
                localStorage.removeItem('n1fit_token');
                setIsLoggedIn(false);
                setLoading(false);
                return;
            }

            setIsLoggedIn(true);
            fetchMyData();
        } else {
            setIsLoggedIn(false);
            setLoading(false);
        }
    }, []);

    const fetchMyData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/Member/my-profile');
            setProfile(res.data);
            setDiets(res.data.diets || []);
            setWorkouts(res.data.workouts || []);
            setMeasurements(res.data.measurements || []);
        } catch (error) {
            console.error("Profil çekilirken hata oluştu:", error);
            if (error.response?.status === 401 || error.response?.status === 404) {
                setIsLoggedIn(false);
                localStorage.removeItem('n1fit_token');
                setActiveTab('home');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDirectLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoginSubmitting(true);
        try {
            const res = await api.post('/Auth/login', {
                email: loginEmail.trim(),
                password: loginPassword
            });
            const token = res.data.token || res.data.Token;

            const payload = parseJwt(token);
            if (payload) {
                const userRole = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role;
                if (userRole === 'Admin' || userRole === '1') {
                    setLoginError('Yönetici hesapları üye portalından giriş yapamaz. Lütfen yönetici panelini kullanın.');
                    setLoginSubmitting(false);
                    return;
                }
            }

            localStorage.setItem('n1fit_token', token);
            setIsLoggedIn(true);
            setActiveTab('home');
            fetchMyData();
        } catch (err) {
            setLoginError(err.response?.data?.message || 'E-posta adresi veya şifre hatalı. Lütfen kontrol ediniz.');
        } finally {
            setLoginSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('n1fit_token');
        setIsLoggedIn(false);
        setProfile(null);
        setWorkouts([]);
        setDiets([]);
        setMeasurements([]);
        setLoginEmail('');
        setLoginPassword('');
        setLoginError('');
        setActiveTab('home');
    };

    const handleWhatsApp = () => {
        const msg = "Merhaba,%20N1FIT%20Sporcu%20Portalı%20giriş%20ve%20üyelik%20hesabım%20hakkında%20bilgi%20almak%20istiyorum.";
        window.open(`https://wa.me/905396078154?text=${msg}`, '_blank');
    };

    const handleEnableNotifications = async () => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const swReg = await navigator.serviceWorker.ready;
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    setIsNotifyGranted(true);
                    const subscription = await swReg.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlB64ToUint8Array(PUBLIC_VAPID_KEY)
                    });
                    const subJSON = subscription.toJSON();
                    await api.post('/Member/save-subscription', {
                        endpoint: subJSON.endpoint,
                        p256dh: subJSON.keys.p256dh,
                        auth: subJSON.keys.auth
                    });
                    alert("Bildirimler Aktif!");
                } else {
                    alert("Aktif Ederseniz Üyeliğiniz Bitmeden Haberdar Olursunuz!");
                }
            } catch (error) {
                console.error("Bildirim etkinleştirme hatası:", error);
            }
        } else {
            alert("Telefonunuz bu bildirimleri desteklemiyor!");
        }
    };

    if (loading) {
        return (
            <div style={styles.loadingScreen}>
                <div style={styles.loadingSpinner}></div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '16px', letterSpacing: '1px' }}>
                    N1<span style={{ color: '#d90429' }}>FIT</span>
                </div>
                <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '6px' }}>Sporcu Portalı Yükleniyor...</div>
            </div>
        );
    }

    // =========================================================================
    // 1. ZORUNLU GİRİŞ EKRANI (GİRİŞ YAPILMADAN HİÇBİR ÖZELLİK VEYA NAVBAR GÖRÜNMEZ)
    // =========================================================================
    if (!isLoggedIn) {
        return (
            <div style={styles.loginContainer}>
                <div style={styles.loginGlow}></div>
                <div style={styles.loginCard}>
                    <div style={styles.loginLogo}>
                        N1<span style={{ color: '#d90429' }}>FIT</span>
                    </div>
                    <div style={styles.loginBadge}>SPORCU PORTALI</div>
                    <h2 style={styles.loginTitle}>ÜYE GİRİŞİ</h2>
                    <p style={styles.loginSubtitle}>
                        Antrenman programınıza, beslenme listenize ve hareket kütüphanesine erişmek için giriş yapınız.
                    </p>

                    {loginError && (
                        <div style={styles.loginErrorBox}>
                            {loginError}
                        </div>
                    )}

                    <form onSubmit={handleDirectLogin} style={styles.loginForm}>
                        <div style={styles.inputWrapper}>
                            <label style={styles.inputLabel}>E-Posta Adresi</label>
                            <div style={styles.inputFieldContainer}>
                                <Mail size={18} style={styles.inputIcon} />
                                <input
                                    type="email"
                                    placeholder="ornek@n1fit.com"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    style={styles.loginInput}
                                    autoComplete="email"
                                    required
                                    autoCapitalize="none"
                                />
                            </div>
                        </div>

                        <div style={styles.inputWrapper}>
                            <label style={styles.inputLabel}>Şifre</label>
                            <div style={styles.inputFieldContainer}>
                                <Lock size={18} style={styles.inputIcon} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    style={styles.loginInput}
                                    autoComplete="current-password"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loginSubmitting}
                            style={styles.loginSubmitBtn}
                        >
                            <LogIn size={18} />
                            {loginSubmitting ? 'Giriş Yapılıyor...' : 'GİRİŞ YAP'}
                        </button>
                    </form>

                    <hr style={styles.loginHelpDivider} />

                    <div style={styles.loginHelpText}>
                        Hesabınız henüz açılmadıysa veya şifrenizi unuttuysanız:
                    </div>

                    <button
                        type="button"
                        onClick={handleWhatsApp}
                        style={styles.loginWhatsAppBtn}
                    >
                        <MessageCircle size={15} /> Salon Danışmasından Destek Al
                    </button>
                </div>
            </div>
        );
    }

    // =========================================================================
    // 2. GİRİŞ YAPILMIŞ SPORCU DASHBOARDU (TÜM ÖZELLİKLER VE BOTTOM NAVBAR AKTİF)
    // =========================================================================
    return (
        <div style={styles.container}>
            <div style={{ backgroundColor: '#050505', minHeight: '100vh', color: 'white' }}>
                <Navbar activeTab={activeTab} setActiveTab={setActiveTab} isLoggedIn={true} onLogout={handleLogout} />

                <div style={{ padding: '0 20px', paddingBottom: '90px' }}>
                    {!isNotifyGranted && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', marginBottom: '16px' }}>
                            <button onClick={handleEnableNotifications} style={styles.notifyBtn}>
                                <AlertTriangle size={18} /> BİLDİRİMLERİ AÇ
                            </button>
                        </div>
                    )}

                    {activeTab === 'home' && (
                        <div>
                            {/* Giriş Yapmış Sporcu Üst Karşılama */}
                            <div style={{ maxWidth: '1000px', margin: '15px auto 20px auto', textAlign: 'center' }}>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#fff', marginBottom: '6px' }}>
                                    HOŞ GELDİN {profile?.fullName ? profile.fullName.toUpperCase() : 'SPORCU'}! 💪
                                </h2>
                                <p style={{ color: '#888', margin: '0 0 10px 0', fontSize: '0.9rem' }}>
                                    Bugün hangi kas grubunu çalıştırıyorsun? Aşağıdan doğrudan hedefini seç!
                                </p>
                            </div>

                            {/* İNTERAKTİF ANATOMİ VÜCUT VE HAREKET KÜTÜPHANESİ ENTEGRASYONU */}
                            <InteractiveBodyExerciseMap />
                        </div>
                    )}

                    {activeTab === 'membership' && <MembershipTab />}
                    {activeTab === 'workout' && <WorkoutTab />}
                    {activeTab === 'diet' && <DietTab />}
                    {activeTab === 'measure' && <MeasurementTab />}
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' },
    notifyBtn: { backgroundColor: '#d90429', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(217,4,41,0.4)', fontSize: '0.88rem' },

    // Yükleme Ekranı
    loadingScreen: {
        minHeight: '100vh',
        backgroundColor: '#07080a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    },
    loadingSpinner: {
        width: '42px',
        height: '42px',
        border: '3px solid rgba(217, 4, 41, 0.2)',
        borderTop: '3px solid #d90429',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
    },

    // Zorunlu Giriş Ekranı
    loginContainer: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#07080a',
        padding: '24px 16px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden'
    },
    loginGlow: {
        position: 'absolute',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(217, 4, 41, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
        top: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 0
    },
    loginCard: {
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'rgba(16, 18, 23, 0.95)',
        border: '1px solid #232732',
        borderRadius: '20px',
        padding: '36px 26px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 40px rgba(217, 4, 41, 0.1)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        textAlign: 'center',
        boxSizing: 'border-box'
    },
    loginLogo: {
        fontSize: '2.4rem',
        fontWeight: '900',
        letterSpacing: '2px',
        color: '#fff',
        marginBottom: '6px'
    },
    loginBadge: {
        display: 'inline-block',
        backgroundColor: 'rgba(217, 4, 41, 0.12)',
        color: '#ff4d6d',
        border: '1px solid rgba(217, 4, 41, 0.3)',
        borderRadius: '20px',
        padding: '4px 14px',
        fontSize: '0.74rem',
        fontWeight: 'bold',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        marginBottom: '16px'
    },
    loginTitle: {
        fontSize: '1.45rem',
        fontWeight: '900',
        color: '#fff',
        margin: '0 0 8px 0',
        letterSpacing: '0.5px'
    },
    loginSubtitle: {
        fontSize: '0.88rem',
        color: '#999',
        lineHeight: '1.6',
        margin: '0 auto 22px auto',
        maxWidth: '320px'
    },
    loginErrorBox: {
        backgroundColor: 'rgba(217, 4, 41, 0.15)',
        color: '#ff4d6d',
        border: '1px solid #d90429',
        padding: '10px 14px',
        borderRadius: '10px',
        fontSize: '0.85rem',
        fontWeight: '600',
        marginBottom: '18px',
        textAlign: 'left'
    },
    loginForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        textAlign: 'left'
    },
    inputWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    inputLabel: {
        fontSize: '0.8rem',
        color: '#bbb',
        fontWeight: '600'
    },
    inputFieldContainer: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    inputIcon: {
        position: 'absolute',
        left: '14px',
        color: '#666',
        pointerEvents: 'none'
    },
    loginInput: {
        width: '100%',
        backgroundColor: '#0d0f13',
        border: '1px solid #282c37',
        borderRadius: '10px',
        padding: '13px 14px 13px 44px',
        color: '#fff',
        fontSize: '0.95rem',
        outline: 'none',
        boxSizing: 'border-box'
    },
    loginSubmitBtn: {
        backgroundColor: '#d90429',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        padding: '14px',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxShadow: '0 6px 20px rgba(217, 4, 41, 0.4)'
    },
    loginHelpDivider: {
        borderColor: '#1f232b',
        margin: '24px 0 16px 0'
    },
    loginHelpText: {
        fontSize: '0.8rem',
        color: '#777',
        marginBottom: '10px'
    },
    loginWhatsAppBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        backgroundColor: 'rgba(37, 211, 102, 0.1)',
        color: '#25D366',
        border: '1px solid rgba(37, 211, 102, 0.3)',
        borderRadius: '8px',
        padding: '9px 16px',
        fontSize: '0.82rem',
        fontWeight: '600',
        cursor: 'pointer',
        width: '100%',
        boxSizing: 'border-box'
    }
};

export default MemberDashboard;
