// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { PlayCircle, Calendar, Clock, AlertTriangle, Snowflake, LogOut, Dumbbell, Activity } from 'lucide-react';
// import api from '../api/axiosConfig';
// import Navbar from '../components/Navbar';
// import WorkoutTab from '../components/WorkoutTab';
// import DietTab from '../components/DietTab';
// import MeasurementTab from '../components/MeasurementTab';
// import MembershipTab from '../components/MembershipTab';
// import MemberLoginModal from '../components/MemberLoginModal';

// function urlB64ToUint8Array(base64String) {
//     const padding = '='.repeat((4 - base64String.length % 4) % 4);
//     const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
//     const rawData = window.atob(base64);
//     const outputArray = new Uint8Array(rawData.length);
//     for (let i = 0; i < rawData.length; ++i) {
//         outputArray[i] = rawData.charCodeAt(i);
//     }
//     return outputArray;
// }

// const MemberDashboard = () => {
//     const navigate = useNavigate();
//     const [loading, setLoading] = useState(true);

//     const [activeTab, setActiveTab] = useState('home');
//     const [isLoggedIn, setIsLoggedIn] = useState(false);
//     const [memberData, setMemberData] = useState(null);
//     const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
//     // Senin VAPID Public Key'in (appsettings.json'a ne yazdıysan buraya da onu koyacaksın amq!)
//     const PUBLIC_VAPID_KEY = "BGme68ndHvhXyZ8dtnIIcsE89ELVrcXIaiDNrA4zACgknZbOaCPL9ny1E6qlo7MoNr22EhFqv8NdFVMnw3V6hhY";

//     // Müşterinin tüm bilgilerini tutacağımız state
//     const [profile, setProfile] = useState(null);
//     const [workouts, setWorkouts] = useState([]);
//     const [diets, setDiets] = useState([]);
//     const [measurements, setMeasurements] = useState([]);
//     const [expandedDay, setExpandedDay] = useState(null);
//     const [playingVideo, setPlayingVideo] = useState(null);

//     // Güvenli Token Çözücü Motoru (Bunu da dosyanın uygun bir yerine koy amq)
//     const parseJwt = (token) => {
//         try {
//             const base64Url = token.split('.')[1];
//             const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//             const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
//                 return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//             }).join(''));
//             return JSON.parse(jsonPayload);
//         } catch (e) {
//             return null;
//         }
//     };

//     useEffect(() => {
//         const token = localStorage.getItem('n1fit_token');
//         if (token) {
//             const payload = parseJwt(token);
//             const userRole = payload ? (payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role) : '';

//             if (userRole === 'Admin') {
//                 setIsLoggedIn(true);
//                 setLoading(false); // Admin'se yüklemeyi kes, vitrini aç
//                 return;
//             }

//             // Aslan parçası müşteriyse verisini çek (fetchMyData zaten API'ye gidip loading'i false yapar)
//             setIsLoggedIn(true);
//             fetchMyData();
//         } else {
//             // ADAM ZİYARETÇİYSE (Token yoksa) YÜKLEME EKRANINDA BIRAKMA, VİTRİNİ GÖSTER!
//             setLoading(false);
//         }
//     }, []);

//     const fetchMyData = async () => {
//         try {
//             setLoading(true);
//             // Doğrudan yazdığımız API'ye vuruyoruz. ID yollamaya gerek yok, token hallediyor.
//             const res = await api.get('/Member/my-profile');

//             // C#'tan gelen fıstık gibi veriyi statelere basıyoruz
//             setProfile(res.data);
//             setDiets(res.data.diets || []);
//             setWorkouts(res.data.workouts || []);
//             setMeasurements(res.data.measurements || []);

//             setLoading(false);
//         } catch (error) {
//             console.error("Veri çekerken motor yaktık amq", error);
//             if (error.response?.status === 401) {
//                 navigate('/login'); // Adamın süresi bittiyse kapı dışarı
//             }
//         }
//     };

//     const handleLogout = () => {
//         localStorage.removeItem('n1fit_token');
//         window.location.href = '/'; // Sayfayı komple yenileyip vitrine fırlatır! 
//     };

//     // YouTube Thumbnail Ayıklama Motoru
//     const getThumbnail = (url) => {
//         if (!url) return "https://via.placeholder.com/300x200?text=VİDEO+YOK";
//         const videoId = url.split('v=')[1]?.split('&')[0];
//         return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "https://via.placeholder.com/300x200?text=VİDEO+YOK";
//     };

//     if (loading) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>Ağırlıklar Yükleniyor...</div>;

//     const getDiff = (current, older, isWeight = false) => {
//         if (!older) return null;
//         const diff = (current - older).toFixed(1);
//         if (diff == 0) return null;
//         const isPos = diff > 0;
//         const color = isWeight ? (isPos ? '#d90429' : '#4ade80') : (isPos ? '#4ade80' : '#d90429');
//         return <span style={{ color, fontSize: '0.75rem', fontWeight: 'bold' }}>({isPos ? '+' : ''}{diff})</span>;
//     };

//     const formatDate = (dateStr) => {
//         if (!dateStr) return "Yok";
//         return dateStr.split('T')[0];
//     };

//     const handleEnableNotifications = async () => {
//         if ('serviceWorker' in navigator && 'PushManager' in window) {
//             try {
//                 // Amele motorun (sw.js) hazır mı diye bak
//                 const swReg = await navigator.serviceWorker.ready;

//                 // Adama "İzin veriyor musun?" diye sor
//                 const permission = await Notification.requestPermission();

//                 if (permission === 'granted') {
//                     // Tarayıcıdan adamın telefon adresini (Endpoint) kopar
//                     const subscription = await swReg.pushManager.subscribe({
//                         userVisibleOnly: true,
//                         applicationServerKey: urlB64ToUint8Array(PUBLIC_VAPID_KEY)
//                     });

//                     // C#'a mermiyi yolla! (Senin kendi api/axiosConfig import'unu kullan)
//                     const subJSON = subscription.toJSON();
//                     await api.post('/Member/save-subscription', {
//                         endpoint: subJSON.endpoint,
//                         p256dh: subJSON.keys.p256dh,
//                         auth: subJSON.keys.auth
//                     });

//                     alert("Bildirimler Aktif!");
//                 } else {
//                     alert("Aktif Ederseniz Üyeliğiniz Bitmeden Haberdar Olursunuz!");
//                 }
//             } catch (error) {
//                 console.error("Bildirim motoru yandı dayı:", error);
//             }
//         } else {
//             alert("Telefonun Veya Tarayıcın Bu Bildirimleri Desteklemiyor, iPhone Kullanıyorsan Olabilir!");
//         }
//     };

//     // DİYET SİLME OPERASYONU


//     return (
//         <div style={styles.container}>
//             {/* ÜST MENÜ */}
//             <div style={{ backgroundColor: '#050505', minHeight: '100vh', color: 'white' }}>
//                 <Navbar
//                     activeTab={activeTab}
//                     setActiveTab={setActiveTab}
//                     isLoggedIn={isLoggedIn}
//                     onLogout={handleLogout}
//                     onOpenLogin={() => setIsLoginModalOpen(true)}
//                 />

//                 <div style={{ padding: '20px' }}>
//                     {/* --- SEKMELERE GÖRE İÇERİK --- */}

//                     {activeTab === 'home' && (
//                         <div style={styles.landingContainer}>
//                             {/* BURASI GİRİŞ YAPMAYANIN GÖRECEĞİ VİTRİN */}
//                             <h1 style={styles.heroTitle}>DÜZCE'NİN EN SERT SALONU: N1FIT</h1>
//                             <button
//                                 onClick={handleEnableNotifications}
//                                 className="bg-red-600 text-white font-bold py-2 px-4 rounded mt-4">
//                                 BİLDİRİMLERİ AÇ
//                             </button>
//                             <div style={styles.sliderMock}>
//                                 {/* Buraya bir Slider bileşeni veya fiyakalı salon fotoları gelecek amq */}
//                                 <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070" style={styles.sliderImg} />
//                             </div>
//                             <div style={styles.infoSection}>
//                                 <h3>Neden Biz?</h3>
//                                 <p>Hardcore antrenman, profesyonel ekipman ve jilet gibi diyet listeleri...</p>
//                             </div>
//                         </div>
//                     )}
//                     {isLoggedIn && activeTab === 'membership' && <MembershipTab />}
//                     {isLoggedIn && activeTab === 'workout' && <WorkoutTab />}
//                     {isLoggedIn && activeTab === 'diet' && <DietTab />}
//                     {isLoggedIn && activeTab === 'measure' && <MeasurementTab />}
//                 </div>
//                 <MemberLoginModal
//                     isOpen={isLoginModalOpen}
//                     onClose={() => setIsLoginModalOpen(false)}
//                     onLoginSuccess={() => {
//                         setIsLoggedIn(true);
//                         // Sayfayı yenilemeden direkt adamı içeride gösteriyoruz!
//                         window.location.reload(); // En temizi sayfayı bir kez zımbalamak, state kargaşası olmaz.
//                     }}
//                 />
//             </div>
//         </div>



//     );
// };

// // TASARIMIN JİLET KISMI
// const styles = {
//     container: { minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' },
//     navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 50px', backgroundColor: '#111', borderBottom: '2px solid #d90429' },
//     logo: { fontSize: '1.8rem', fontWeight: 'bold', letterSpacing: '1px' },
//     logoutBtn: { backgroundColor: 'transparent', color: '#666', border: '1px solid #333', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
//     main: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '30px' },
//     card: { backgroundColor: '#111', padding: '25px', borderRadius: '10px', border: '1px solid #222' },
//     frozenAlert: { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '15px', borderRadius: '8px', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontWeight: 'bold' },
//     infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' },
//     infoBox: { backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '5px' },
//     infoLabel: { color: '#888', fontSize: '0.85rem', textTransform: 'uppercase' },
//     infoValue: { fontSize: '1.2rem', fontWeight: 'bold' },
//     videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
//     exCard: { backgroundColor: '#1a1a1a', borderRadius: '10px', overflow: 'hidden', border: '1px solid #222' },
//     thumbnailWrapper: { position: 'relative', cursor: 'pointer', height: '180px', backgroundColor: 'black' },
//     thumbnail: { width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, transition: '0.3s' },
//     playIcon: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.8 },
//     dietRow: { display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #d90429' },
//     landingContainer: { textAlign: 'center', marginTop: '50px' },
//     heroTitle: { fontSize: '3rem', fontWeight: '900', color: '#fff', textTransform: 'uppercase' },
//     sliderMock: { width: '80%', margin: '40px auto', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 0 30px rgba(217, 4, 41, 0.2)' },
//     sliderImg: { width: '100%', height: '500px', objectFit: 'cover' },
//     infoSection: { marginTop: '40px', color: '#aaa' }
// };

// export default MemberDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    PlayCircle, Calendar, Clock, AlertTriangle, Snowflake, 
    LogOut, Dumbbell, Activity, MapPin, Phone, Target, 
    ShieldCheck, CheckCircle, ChevronRight, Zap
} from 'lucide-react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import WorkoutTab from '../components/WorkoutTab';
import DietTab from '../components/DietTab';
import MeasurementTab from '../components/MeasurementTab';
import MembershipTab from '../components/MembershipTab';
import MemberLoginModal from '../components/MemberLoginModal';

// --- VAPID BİLDİRİM MOTORU ---
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

// ==========================================
// AMELE MOTORU: KENDİ KENDİNE DÖNEN FOTOĞRAFLAR
// ==========================================
const AutoSlider = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!images || images.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 3000); // 3 Saniyede bir döner amq!
        return () => clearInterval(interval);
    }, [images]);

    if (!images || images.length === 0) return null;

    return (
        <div style={styles.sliderContainer}>
            <img 
                src={images[currentIndex]} 
                alt="N1FIT Slider" 
                style={styles.sliderImage} 
            />
            {/* Alt kısımdaki fiyakalı noktalar */}
            <div style={styles.sliderDots}>
                {images.map((_, idx) => (
                    <div 
                        key={idx} 
                        style={{
                            ...styles.dot, 
                            backgroundColor: idx === currentIndex ? '#d90429' : '#444'
                        }} 
                    />
                ))}
            </div>
        </div>
    );
};

const MemberDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('home');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    
    // BİLDİRİM ŞİFRESİ
    const PUBLIC_VAPID_KEY = "BGme68ndHvhXyZ8dtnIIcsE89ELVrcXIaiDNrA4zACgknZbOaCPL9ny1E6qlo7MoNr22EhFqv8NdFVMnw3V6hhY";

    const [profile, setProfile] = useState(null);
    const [workouts, setWorkouts] = useState([]);
    const [diets, setDiets] = useState([]);
    const [measurements, setMeasurements] = useState([]);

    // --- SENİN SALON VE PAKET FOTOLARI BURAYA GELECEK DAYI! ---
    const gymImages = [
        "n1fit-client/SalonunFotolari/WhatsApp Image 2026-05-18 at 14.01.47.jpeg",
        "n1fit-client/SalonunFotolari/WhatsApp Image 2026-05-18 at 14.01.48.jpeg",
        "n1fit-client/SalonunFotolari/WhatsApp Image 2026-05-18 at 14.01.50 (1).jpeg",
        "n1fit-client/SalonunFotolari/WhatsApp Image 2026-05-18 at 14.01.50.jpeg",
        "n1fit-client/SalonunFotolari/WhatsApp Image 2026-05-18 at 14.01.51 (1).jpeg",
        "n1fit-client/SalonunFotolari/WhatsApp Image 2026-05-18 at 14.01.51 (2).jpeg",
        "n1fit-client/SalonunFotolari/WhatsApp Image 2026-05-18 at 14.01.51 (3).jpeg",
        "n1fit-client/SalonunFotolari/WhatsApp Image 2026-05-18 at 14.01.51 (4).jpeg",
        "n1fit-client/SalonunFotolari/WhatsApp Image 2026-05-18 at 14.01.51 (5).jpeg",
        "n1fit-client/SalonunFotolari/WhatsApp Image 2026-05-18 at 14.01.51.jpeg"
    ];
    
    const packageImages = [
        "n1fit-client/PaketlerinFotolari/WhatsApp Image 2026-05-18 at 14.02.11 (1).jpeg",
        "n1fit-client/PaketlerinFotolari/WhatsApp Image 2026-05-18 at 14.02.11 (2).jpeg",
        "n1fit-client/PaketlerinFotolari/WhatsApp Image 2026-05-18 at 14.02.11 (3).jpeg",
        "n1fit-client/PaketlerinFotolari/WhatsApp Image 2026-05-18 at 14.02.11 (4).jpeg",
        "n1fit-client/PaketlerinFotolari/WhatsApp Image 2026-05-18 at 14.02.11 (5).jpeg",
        "n1fit-client/PaketlerinFotolari/WhatsApp Image 2026-05-18 at 14.02.11.jpeg"

    ];

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
                setLoading(false);
                return;
            }
            setIsLoggedIn(true);
            fetchMyData();
        } else {
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
            setLoading(false);
        } catch (error) {
            console.error("Veri çekerken motor yaktık amq", error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('n1fit_token');
        window.location.href = '/'; 
    };

    const handleEnableNotifications = async () => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const swReg = await navigator.serviceWorker.ready;
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
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
                    alert("Bildirimler Aktif! Aidat gelince titreteceğiz.");
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

    if (loading) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>Ağırlıklar Yükleniyor...</div>;

    return (
        <div style={styles.container}>
            <div style={{ backgroundColor: '#050505', minHeight: '100vh', color: 'white' }}>
                <Navbar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isLoggedIn={isLoggedIn}
                    onLogout={handleLogout}
                    onOpenLogin={() => setIsLoginModalOpen(true)}
                />

                <div style={{ padding: '0 20px', paddingBottom: '80px' }}>
                    
                    {/* BİLDİRİMLERİ AÇ BUTONU (Sadece Login olan godoşlar görür) */}
                    {isLoggedIn && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                            <button onClick={handleEnableNotifications} style={styles.notifyBtn}>
                                <AlertTriangle size={20} /> BİLDİRİMLERİ AÇ ASLANIM
                            </button>
                        </div>
                    )}

                    {/* =======================================================
                        VİTRİN KISMI (ANA SAYFA / LANDING PAGE)
                    ======================================================= */}
                    {activeTab === 'home' && (
                        <div style={styles.landingContainer}>
                            
                            {/* 1. BAŞLIK */}
                            <h1 style={styles.heroTitle}>N1<span style={{color: '#d90429'}}>FIT</span> SPOR MERKEZİ</h1>
                            <p style={styles.heroSubtitle}>Bilimin, Disiplinin ve 15 Yıllık Tecrübenin Buluştuğu Yer</p>

                            {/* 2. SALON FOTOLARI (SLIDER 1) */}
                            <AutoSlider images={gymImages} />

                            {/* 3. BİZ KİMİZ / MİSYON / VİZYON */}
                            <div style={styles.aboutSection}>
                                <h2 style={styles.sectionTitle}>BİZ KİMİZ?</h2>
                                <p style={styles.paragraph}>
                                    Sadece bir spor salonu değil; bilimin, doğru metodolojinin ve <strong>15 yıllık sektörel tecrübenin</strong> bir araya geldiği bir yaşam dönüşüm merkeziyiz. Kurucumuzun federasyon onaylı uzmanlığı, beden eğitimi ve spor disipliniyle harmanlanarak, her üyenin kendi potansiyelini en güvenli şekilde keşfetmesini sağlıyor.
                                </p>
                                <p style={styles.paragraph}>
                                    Fitness trendlerini değil, <strong>biyomekanik kuralları</strong> ve kanıtlanmış antrenman stratejilerini temel alıyoruz. Hedefiniz ne olursa olsun, burada tesadüflere yer yok; tamamen size özel, planlı ve profesyonel bir süreç var.
                                </p>
                                
                                <div style={styles.missionGrid}>
                                    <div style={styles.missionCard}>
                                        <Target size={40} color="#d90429" />
                                        <h3>Misyonumuz</h3>
                                        <p>Sporu geçici bir heves olmaktan çıkarıp, bilimin ışığında sürdürülebilir bir yaşam tarzı haline getirmek. Her bireyin anatomik yapısına ve hedefine saygı duyarak hayat kalitesini artırmak.</p>
                                    </div>
                                    <div style={styles.missionCard}>
                                        <Activity size={40} color="#d90429" />
                                        <h3>Vizyonumuz</h3>
                                        <p>Gelişmiş altyapımız, sürekli güncellenen akademik yaklaşımımız ve premium hizmet kalitemizle, bölgesel olarak fitness ve sağlıklı yaşam kültürünün standartlarını belirleyen lider marka olmak.</p>
                                    </div>
                                </div>
                            </div>

                            {/* BİLİMSEL VURGU (NEDEN BİZ) */}
                            <div style={styles.whyUsContainer}>
                                <h3 style={styles.whyUsTitle}>NEDEN BİZ?</h3>
                                <div style={styles.whyUsGrid}>
                                    <div style={styles.whyUsItem}><CheckCircle color="#d90429" /> 15+ Yıllık Sektörel Tecrübe</div>
                                    <div style={styles.whyUsItem}><CheckCircle color="#d90429" /> Biyomekanik ve Form Odaklı Yaklaşım</div>
                                    <div style={styles.whyUsItem}><CheckCircle color="#d90429" /> Federasyon Onaylı Profesyonel Kadro</div>
                                    <div style={styles.whyUsItem}><CheckCircle color="#d90429" /> %100 Kişiye Özel Gelişim Takibi</div>
                                </div>
                            </div>

                            {/* 4. HİZMETLERİMİZ */}
                            <h2 style={styles.sectionTitle}>HİZMETLERİMİZ</h2>
                            <div style={styles.servicesGrid}>
                                <div style={styles.serviceCard}>
                                    <Dumbbell size={40} color="#d90429" style={{marginBottom:'15px'}} />
                                    <h4>Fitness & Bodybuilding</h4>
                                    <p>Sadece ağırlık kaldırmayın, vücudunuzu yönetin. Hedeflerinize (kas kütlesi, yağ yakımı) bilimsel araştırmalar ve form analizleriyle en güvenli yoldan ulaşın.</p>
                                </div>
                                <div style={styles.serviceCard}>
                                    <Zap size={40} color="#d90429" style={{marginBottom:'15px'}} />
                                    <h4>Pilates Studio</h4>
                                    <p>Postür (duruş) bozukluklarını gidermek, core bölgenizi güçlendirmek ve esneklik kazanmak için modern pilates metodolojisi. Zihin ve beden uyumunu keşfedin.</p>
                                </div>
                                <div style={styles.serviceCard}>
                                    <ShieldCheck size={40} color="#d90429" style={{marginBottom:'15px'}} />
                                    <h4>Kişiye Özel Beslenme</h4>
                                    <p>Sürdürülemez diyetleri çöpe atın. Kilonuz, metabolizma hızınız ve rutininize göre tamamen size özel optimize edilmiş beslenme planı ve sıkı takip.</p>
                                </div>
                            </div>

                            {/* 5. PAKETLER VE FİYATLAR (SLIDER 2) */}
                            <h2 style={styles.sectionTitle} style={{marginTop: '60px'}}>PAKETLERİMİZ</h2>
                            <AutoSlider images={packageImages} />

                            {/* 6. CALL TO ACTION (Ateşleme Butonları) */}
                            <div style={styles.ctaContainer}>
                                <button style={styles.ctaBtnPrimary} onClick={() => setIsLoginModalOpen(true)}>
                                    Ücretsiz Tanışma Seansı Randevusu Al <ChevronRight />
                                </button>
                                <button style={styles.ctaBtnSecondary} onClick={() => setIsLoginModalOpen(true)}>
                                    Hemen Kaydol, Değişimi Başlat <Zap />
                                </button>
                            </div>

                            {/* 7. İLETİŞİM / FOOTER */}
                            <footer style={styles.footer}>
                                <div style={styles.footerLogo}>N1<span style={{color:'#d90429'}}>FIT</span></div>
                                <p style={styles.footerText}>Bahanelere yer yok, sadece sonuç var!</p>
                                
                                <div style={styles.contactInfo}>
                                    <div style={styles.contactItem}>
                                        <Phone size={20} color="#d90429"/> 
                                        <span>539 607 81 55 &nbsp; | &nbsp; 535 049 54 81</span>
                                    </div>
                                    <div style={styles.contactItem}>
                                        <MapPin size={20} color="#d90429"/> 
                                        <span>Kültür Mahallesi, Yavuz Selim Sokak No:8 <br/> Gölyaka / Düzce</span>
                                    </div>
                                </div>
                                <div style={styles.copyright}>
                                    © 2026 N1FIT Spor Merkezi. Tüm Hakları Saklıdır.
                                </div>
                            </footer>
                        </div>
                    )}

                    {/* DİĞER SEKMELER */}
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
                        window.location.reload(); 
                    }}
                />
            </div>
        </div>
    );
};

// ==========================================
// TASARIMIN JİLET KISMI (CSS)
// ==========================================
const styles = {
    container: { minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' },
    notifyBtn: { backgroundColor: '#d90429', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(217,4,41,0.4)' },
    
    landingContainer: { textAlign: 'center', marginTop: '40px', maxWidth: '1000px', margin: '40px auto 0 auto' },
    heroTitle: { fontSize: '3.5rem', fontWeight: '900', color: '#fff', textTransform: 'uppercase', marginBottom: '10px' },
    heroSubtitle: { fontSize: '1.2rem', color: '#aaa', marginBottom: '40px', fontWeight: '600' },
    
    // Slider Tasarımı
    sliderContainer: { position: 'relative', width: '100%', maxWidth: '900px', margin: '0 auto 50px auto', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 0 40px rgba(217, 4, 41, 0.25)', backgroundColor: '#111' },
    sliderImage: { width: '100%', height: '450px', objectFit: 'cover', display: 'block' },
    sliderDots: { position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px' },
    dot: { width: '12px', height: '12px', borderRadius: '50%', transition: '0.3s' },
    
    // Hakkımızda Kısmı
    aboutSection: { backgroundColor: '#111', padding: '40px', borderRadius: '15px', border: '1px solid #222', marginBottom: '40px', textAlign: 'left' },
    sectionTitle: { fontSize: '2.2rem', fontWeight: '900', color: '#fff', marginBottom: '25px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' },
    paragraph: { fontSize: '1.1rem', color: '#bbb', lineHeight: '1.8', marginBottom: '20px' },
    
    missionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '40px' },
    missionCard: { backgroundColor: '#0a0a0a', padding: '25px', borderRadius: '10px', borderLeft: '4px solid #d90429' },
    
    // Neden Biz
    whyUsContainer: { margin: '50px 0', padding: '30px', backgroundColor: 'rgba(217, 4, 41, 0.05)', borderRadius: '15px', border: '1px solid rgba(217, 4, 41, 0.2)' },
    whyUsTitle: { fontSize: '1.5rem', fontWeight: 'bold', color: '#d90429', marginBottom: '20px' },
    whyUsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', textAlign: 'left' },
    whyUsItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '600', color: '#fff' },

    // Hizmetlerimiz
    servicesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '50px' },
    serviceCard: { backgroundColor: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #222', transition: 'transform 0.3s, boxShadow 0.3s', textAlign: 'left' },
    
    // Aksiyon Butonları
    ctaContainer: { display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', marginTop: '40px', marginBottom: '60px' },
    ctaBtnPrimary: { backgroundColor: '#d90429', color: 'white', padding: '18px 40px', fontSize: '1.2rem', fontWeight: 'bold', border: 'none', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 30px rgba(217, 4, 41, 0.4)', transition: '0.3s' },
    ctaBtnSecondary: { backgroundColor: 'transparent', color: '#fff', padding: '15px 35px', fontSize: '1.1rem', fontWeight: 'bold', border: '2px solid #d90429', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: '0.3s' },

    // Footer / İletişim
    footer: { backgroundColor: '#050505', borderTop: '2px solid #222', padding: '50px 20px', textAlign: 'center', marginTop: '40px' },
    footerLogo: { fontSize: '2.5rem', fontWeight: '900', letterSpacing: '2px', marginBottom: '10px' },
    footerText: { color: '#666', fontSize: '1rem', fontStyle: 'italic', marginBottom: '30px' },
    contactInfo: { display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', marginBottom: '40px' },
    contactItem: { display: 'flex', alignItems: 'center', gap: '15px', color: '#ccc', fontSize: '1.1rem', backgroundColor: '#111', padding: '15px 30px', borderRadius: '50px', border: '1px solid #333' },
    copyright: { color: '#444', fontSize: '0.9rem', marginTop: '20px' }
};

export default MemberDashboard;