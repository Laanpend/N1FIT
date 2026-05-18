import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Calendar, Clock, AlertTriangle, Snowflake, LogOut, Dumbbell, Activity } from 'lucide-react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import WorkoutTab from '../components/WorkoutTab';
import DietTab from '../components/DietTab';
import MeasurementTab from '../components/MeasurementTab';
import MembershipTab from '../components/MembershipTab';
import MemberLoginModal from '../components/MemberLoginModal';

function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
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
    const [memberData, setMemberData] = useState(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    // Senin VAPID Public Key'in (appsettings.json'a ne yazdıysan buraya da onu koyacaksın amq!)
    const PUBLIC_VAPID_KEY = "BGme68ndHvhXyZ8dtnIIcsE89ELVrcXIaiDNrA4zACgknZbOaCPL9ny1E6qlo7MoNr22EhFqv8NdFVMnw3V6hhY";

    // Müşterinin tüm bilgilerini tutacağımız state
    const [profile, setProfile] = useState(null);
    const [workouts, setWorkouts] = useState([]);
    const [diets, setDiets] = useState([]);
    const [measurements, setMeasurements] = useState([]);
    const [expandedDay, setExpandedDay] = useState(null);
    const [playingVideo, setPlayingVideo] = useState(null);

    // Güvenli Token Çözücü Motoru (Bunu da dosyanın uygun bir yerine koy amq)
    const parseJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('n1fit_token');
        if (token) {
            const payload = parseJwt(token);
            const userRole = payload ? (payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role) : '';

            if (userRole === 'Admin') {
                setIsLoggedIn(true);
                setLoading(false); // Admin'se yüklemeyi kes, vitrini aç
                return;
            }

            // Aslan parçası müşteriyse verisini çek (fetchMyData zaten API'ye gidip loading'i false yapar)
            setIsLoggedIn(true);
            fetchMyData();
        } else {
            // ADAM ZİYARETÇİYSE (Token yoksa) YÜKLEME EKRANINDA BIRAKMA, VİTRİNİ GÖSTER!
            setLoading(false);
        }
    }, []);

    const fetchMyData = async () => {
        try {
            setLoading(true);
            // Doğrudan yazdığımız API'ye vuruyoruz. ID yollamaya gerek yok, token hallediyor.
            const res = await api.get('/Member/my-profile');

            // C#'tan gelen fıstık gibi veriyi statelere basıyoruz
            setProfile(res.data);
            setDiets(res.data.diets || []);
            setWorkouts(res.data.workouts || []);
            setMeasurements(res.data.measurements || []);

            setLoading(false);
        } catch (error) {
            console.error("Veri çekerken motor yaktık amq", error);
            if (error.response?.status === 401) {
                navigate('/login'); // Adamın süresi bittiyse kapı dışarı
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('n1fit_token');
        window.location.href = '/'; // Sayfayı komple yenileyip vitrine fırlatır! 
    };

    // YouTube Thumbnail Ayıklama Motoru
    const getThumbnail = (url) => {
        if (!url) return "https://via.placeholder.com/300x200?text=VİDEO+YOK";
        const videoId = url.split('v=')[1]?.split('&')[0];
        return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "https://via.placeholder.com/300x200?text=VİDEO+YOK";
    };

    if (loading) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>Ağırlıklar Yükleniyor...</div>;

    const getDiff = (current, older, isWeight = false) => {
        if (!older) return null;
        const diff = (current - older).toFixed(1);
        if (diff == 0) return null;
        const isPos = diff > 0;
        const color = isWeight ? (isPos ? '#d90429' : '#4ade80') : (isPos ? '#4ade80' : '#d90429');
        return <span style={{ color, fontSize: '0.75rem', fontWeight: 'bold' }}>({isPos ? '+' : ''}{diff})</span>;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "Yok";
        return dateStr.split('T')[0];
    };

    const handleEnableNotifications = async () => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                // Amele motorun (sw.js) hazır mı diye bak
                const swReg = await navigator.serviceWorker.ready;

                // Adama "İzin veriyor musun?" diye sor
                const permission = await Notification.requestPermission();

                if (permission === 'granted') {
                    // Tarayıcıdan adamın telefon adresini (Endpoint) kopar
                    const subscription = await swReg.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlB64ToUint8Array(PUBLIC_VAPID_KEY)
                    });

                    // C#'a mermiyi yolla! (Senin kendi api/axiosConfig import'unu kullan)
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
                console.error("Bildirim motoru yandı dayı:", error);
            }
        } else {
            alert("Telefonun Veya Tarayıcın Bu Bildirimleri Desteklemiyor, iPhone Kullanıyorsan Olabilir!");
        }
    };

    // DİYET SİLME OPERASYONU


    return (
        <div style={styles.container}>
            {/* ÜST MENÜ */}
            <div style={{ backgroundColor: '#050505', minHeight: '100vh', color: 'white' }}>
                <Navbar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isLoggedIn={isLoggedIn}
                    onLogout={handleLogout}
                    onOpenLogin={() => setIsLoginModalOpen(true)}
                />

                <div style={{ padding: '20px' }}>
                    {/* --- SEKMELERE GÖRE İÇERİK --- */}

                    {activeTab === 'home' && (
                        <div style={styles.landingContainer}>
                            <button
                                onClick={handleEnableNotifications}
                                className="bg-red-600 text-white font-bold py-2 px-4 rounded mt-4">
                                BİLDİRİMLERİ AÇ
                            </button>
                            {/* BURASI GİRİŞ YAPMAYANIN GÖRECEĞİ VİTRİN */}
                            <h1 style={styles.heroTitle}>DÜZCE'NİN EN SERT SALONU: N1FIT</h1>
                            <div style={styles.sliderMock}>
                                {/* Buraya bir Slider bileşeni veya fiyakalı salon fotoları gelecek amq */}
                                <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070" style={styles.sliderImg} />
                            </div>
                            <div style={styles.infoSection}>
                                <h3>Neden Biz?</h3>
                                <p>Hardcore antrenman, profesyonel ekipman ve jilet gibi diyet listeleri...</p>
                            </div>
                        </div>
                    )}
                    {isLoggedIn && activeTab === 'membership' && <MembershipTab />}
                    {isLoggedIn && activeTab === 'workout' && <WorkoutTab />}
                    {isLoggedIn && activeTab === 'diet' && <DietTab />}
                    {isLoggedIn && activeTab === 'measure' && <MeasurementTab />}
                </div>
                <MemberLoginModal
                    isOpen={isLoginModalOpen}
                    onClose={() => setIsLoginModalOpen(false)}
                    onLoginSuccess={() => {
                        setIsLoggedIn(true);
                        // Sayfayı yenilemeden direkt adamı içeride gösteriyoruz!
                        window.location.reload(); // En temizi sayfayı bir kez zımbalamak, state kargaşası olmaz.
                    }}
                />
            </div>
        </div>



    );
};

// TASARIMIN JİLET KISMI
const styles = {
    container: { minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' },
    navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 50px', backgroundColor: '#111', borderBottom: '2px solid #d90429' },
    logo: { fontSize: '1.8rem', fontWeight: 'bold', letterSpacing: '1px' },
    logoutBtn: { backgroundColor: 'transparent', color: '#666', border: '1px solid #333', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    main: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '30px' },
    card: { backgroundColor: '#111', padding: '25px', borderRadius: '10px', border: '1px solid #222' },
    frozenAlert: { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '15px', borderRadius: '8px', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontWeight: 'bold' },
    infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' },
    infoBox: { backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '5px' },
    infoLabel: { color: '#888', fontSize: '0.85rem', textTransform: 'uppercase' },
    infoValue: { fontSize: '1.2rem', fontWeight: 'bold' },
    videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    exCard: { backgroundColor: '#1a1a1a', borderRadius: '10px', overflow: 'hidden', border: '1px solid #222' },
    thumbnailWrapper: { position: 'relative', cursor: 'pointer', height: '180px', backgroundColor: 'black' },
    thumbnail: { width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, transition: '0.3s' },
    playIcon: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.8 },
    dietRow: { display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #d90429' },
    landingContainer: { textAlign: 'center', marginTop: '50px' },
    heroTitle: { fontSize: '3rem', fontWeight: '900', color: '#fff', textTransform: 'uppercase' },
    sliderMock: { width: '80%', margin: '40px auto', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 0 30px rgba(217, 4, 41, 0.2)' },
    sliderImg: { width: '100%', height: '500px', objectFit: 'cover' },
    infoSection: { marginTop: '40px', color: '#aaa' }
};

export default MemberDashboard;