// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//     PlayCircle, Calendar, Clock, AlertTriangle, Snowflake,
//     LogOut, Dumbbell, Activity, MapPin, Phone, Target,
//     ShieldCheck, CheckCircle, ChevronRight, ChevronLeft, Zap
// } from 'lucide-react';
// import api from '../api/axiosConfig';
// import Navbar from '../components/Navbar';
// import WorkoutTab from '../components/WorkoutTab';
// import DietTab from '../components/DietTab';
// import MeasurementTab from '../components/MeasurementTab';
// import MembershipTab from '../components/MembershipTab';
// import MemberLoginModal from '../components/MemberLoginModal';

// // --- VAPID BİLDİRİM MOTORU ---
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

// // ==========================================
// // V8 MOTORLU, YUMUŞAK GEÇİŞLİ SLIDER AMQ!
// // ==========================================
// const AutoSlider = ({ images }) => {
//     const [currentIndex, setCurrentIndex] = useState(0);

//     // Otomatik kayma motoru
//     useEffect(() => {
//         if (!images || images.length === 0) return;
//         const interval = setInterval(() => {
//             setCurrentIndex((prev) => (prev + 1) % images.length);
//         }, 4000); // 4 saniyede bir döner
//         return () => clearInterval(interval);
//     }, [images, currentIndex]);

//     // Manuel vitesler
//     const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % images.length);
//     const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

//     if (!images || images.length === 0) return null;

//     return (
//         <div style={styles.sliderContainer}>
//             {/* SOL OK BUTONU */}
//             <button onClick={prevSlide} style={styles.sliderBtnLeft}>
//                 <ChevronLeft size={30} color="white" />
//             </button>

//             {/* FOTOLARIN YUMUŞAK GEÇİŞ (FADE) KISMI */}
//             <div style={styles.sliderImageWrapper}>
//                 {images.map((img, idx) => (
//                     <img
//                         key={idx}
//                         src={img}
//                         alt={`N1FIT Foto ${idx}`}
//                         style={{
//                             ...styles.sliderImage,
//                             opacity: idx === currentIndex ? 1 : 0,
//                             transition: 'opacity 0.8s ease-in-out'
//                         }}
//                     />
//                 ))}
//             </div>

//             {/* SAĞ OK BUTONU */}
//             <button onClick={nextSlide} style={styles.sliderBtnRight}>
//                 <ChevronRight size={30} color="white" />
//             </button>

//             {/* ALT KISIMDAKİ NOKTALAR */}
//             <div style={styles.sliderDots}>
//                 {images.map((_, idx) => (
//                     <div
//                         key={idx}
//                         onClick={() => setCurrentIndex(idx)}
//                         style={{
//                             ...styles.dot,
//                             backgroundColor: idx === currentIndex ? '#d90429' : 'rgba(255,255,255,0.3)',
//                             cursor: 'pointer',
//                             transform: idx === currentIndex ? 'scale(1.2)' : 'scale(1)'
//                         }}
//                     />
//                 ))}
//             </div>
//         </div>
//     );
// };

// const MemberDashboard = () => {
//     const navigate = useNavigate();
//     const [loading, setLoading] = useState(true);

//     const [activeTab, setActiveTab] = useState('home');
//     const [isLoggedIn, setIsLoggedIn] = useState(false);
//     const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

//     // Adam önceden bildirim izni vermiş mi diye tarayıcının beynini okuyan motor!
//     const [isNotifyGranted, setIsNotifyGranted] = useState(
//         'Notification' in window ? Notification.permission === 'granted' : false
//     );

//     // BİLDİRİM ŞİFRESİ
//     const PUBLIC_VAPID_KEY = "BGme68ndHvhXyZ8dtnIIcsE89ELVrcXIaiDNrA4zACgknZbOaCPL9ny1E6qlo7MoNr22EhFqv8NdFVMnw3V6hhY";

//     const [profile, setProfile] = useState(null);
//     const [workouts, setWorkouts] = useState([]);
//     const [diets, setDiets] = useState([]);
//     const [measurements, setMeasurements] = useState([]);

//     const gymImages = [
//         "/SalonunFotolari/Salon1.jpeg",
//         "/SalonunFotolari/Salon2.jpeg",
//         "/SalonunFotolari/Salon3.jpeg",
//         "/SalonunFotolari/Salon4.jpeg",
//         "/SalonunFotolari/Salon5.jpeg",
//         "/SalonunFotolari/Salon6.jpeg",
//         "/SalonunFotolari/Salon7.jpeg",
//         "/SalonunFotolari/Salon8.jpeg",
//         "/SalonunFotolari/Salon9.jpeg",
//         "/SalonunFotolari/Salon10.jpeg"
//     ];

//     const packageImages = [
//         "/PaketlerinFotolari/Paket1.jpeg",
//         "/PaketlerinFotolari/Paket2.jpeg",
//         "/PaketlerinFotolari/Paket3.jpeg",
//         "/PaketlerinFotolari/Paket4.jpeg",
//         "/PaketlerinFotolari/Paket5.jpeg",
//         "/PaketlerinFotolari/Paket6.jpeg"
//     ];

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
//                 setLoading(false);
//                 return;
//             }
//             setIsLoggedIn(true);
//             fetchMyData();
//         } else {
//             setLoading(false);
//         }
//     }, []);

//     const fetchMyData = async () => {
//         try {
//             setLoading(true);
//             const res = await api.get('/Member/my-profile');
//             setProfile(res.data);
//             setDiets(res.data.diets || []);
//             setWorkouts(res.data.workouts || []);
//             setMeasurements(res.data.measurements || []);
//             setLoading(false);
//         } catch (error) {
//             console.error("Veri çekerken motor yaktık amq", error);
//             if (error.response?.status === 401) {
//                 navigate('/login');
//             }
//         }
//     };

//     const handleLogout = () => {
//         localStorage.removeItem('n1fit_token');
//         window.location.href = '/';
//     };

//     const handleEnableNotifications = async () => {
//         if ('serviceWorker' in navigator && 'PushManager' in window) {
//             try {
//                 const swReg = await navigator.serviceWorker.ready;
//                 const permission = await Notification.requestPermission();
//                 if (permission === 'granted') {

//                     setIsNotifyGranted(true); // İzin verildiği an butonu patlatır!

//                     const subscription = await swReg.pushManager.subscribe({
//                         userVisibleOnly: true,
//                         applicationServerKey: urlB64ToUint8Array(PUBLIC_VAPID_KEY)
//                     });
//                     const subJSON = subscription.toJSON();
//                     await api.post('/Member/save-subscription', {
//                         endpoint: subJSON.endpoint,
//                         p256dh: subJSON.keys.p256dh,
//                         auth: subJSON.keys.auth
//                     });
//                     alert("Bildirimler Aktif! Aidat gelince titreteceğiz.");
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

//     if (loading) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>Ağırlıklar Yükleniyor...</div>;

//     return (
//         <div style={styles.container}>
//             <div style={{ backgroundColor: '#050505', minHeight: '100vh', color: 'white' }}>
//                 <Navbar
//                     activeTab={activeTab}
//                     setActiveTab={setActiveTab}
//                     isLoggedIn={isLoggedIn}
//                     onLogout={handleLogout}
//                     onOpenLogin={() => setIsLoginModalOpen(true)}
//                 />

//                 <div style={{ padding: '0 20px', paddingBottom: '80px' }}>

//                     {/* BİLDİRİMLERİ AÇ BUTONU (Sadece Login olan ve izni OLMAYAN godoşlar görür) */}
//                     {isLoggedIn && !isNotifyGranted && (
//                         <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '20px' }}>
//                             <button onClick={handleEnableNotifications} style={styles.notifyBtn}>
//                                 <AlertTriangle size={20} /> BİLDİRİMLERİ AÇ
//                             </button>
//                         </div>
//                     )}

//                     {/* VİTRİN KISMI (ANA SAYFA / LANDING PAGE) */}
//                     {activeTab === 'home' && (
//                         <div style={styles.landingContainer}>

//                             <h1 style={styles.heroTitle}>N1<span style={{ color: '#d90429' }}>FIT</span> SPOR MERKEZİ</h1>
//                             <p style={styles.heroSubtitle}>Bilimin, Disiplinin ve 15 Yıllık Tecrübenin Buluştuğu Yer</p>

//                             {/* SALON FOTOLARI (SLIDER 1) */}
//                             <AutoSlider images={gymImages} />

//                             {/* BİZ KİMİZ / MİSYON / VİZYON */}
//                             <div style={styles.aboutSection}>
//                                 <h2 style={styles.sectionTitle}>BİZ KİMİZ?</h2>
//                                 <p style={styles.paragraph}>
//                                     Sadece bir spor salonu değil; bilimin, doğru metodolojinin ve <strong>15 yıllık sektörel tecrübenin</strong> bir araya geldiği bir yaşam dönüşüm merkeziyiz. Kurucumuzun federasyon onaylı uzmanlığı, beden eğitimi ve spor disipliniyle harmanlanarak, her üyenin kendi potansiyelini en güvenli şekilde keşfetmesini sağlıyor.
//                                 </p>
//                                 <p style={styles.paragraph}>
//                                     Fitness trendlerini değil, <strong>biyomekanik kuralları</strong> ve kanıtlanmış antrenman stratejilerini temel alıyoruz. Hedefiniz ne olursa olsun, burada tesadüflere yer yok; tamamen size özel, planlı ve profesyonel bir süreç var.
//                                 </p>

//                                 <div style={styles.missionGrid}>
//                                     <div style={styles.missionCard}>
//                                         <Target size={40} color="#d90429" />
//                                         <h3>Misyonumuz</h3>
//                                         <p>Sporu geçici bir heves olmaktan çıkarıp, bilimin ışığında sürdürülebilir bir yaşam tarzı haline getirmek. Her bireyin anatomik yapısına ve hedefine saygı duyarak hayat kalitesini artırmak.</p>
//                                     </div>
//                                     <div style={styles.missionCard}>
//                                         <Activity size={40} color="#d90429" />
//                                         <h3>Vizyonumuz</h3>
//                                         <p>Gelişmiş altyapımız, sürekli güncellenen akademik yaklaşımımız ve premium hizmet kalitemizle, bölgesel olarak fitness ve sağlıklı yaşam kültürünün standartlarını belirleyen lider marka olmak.</p>
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* BİLİMSEL VURGU (NEDEN BİZ) */}
//                             <div style={styles.whyUsContainer}>
//                                 <h3 style={styles.whyUsTitle}>NEDEN BİZ?</h3>
//                                 <div style={styles.whyUsGrid}>
//                                     <div style={styles.whyUsItem}><CheckCircle color="#d90429" /> 15+ Yıllık Sektörel Tecrübe</div>
//                                     <div style={styles.whyUsItem}><CheckCircle color="#d90429" /> Biyomekanik ve Form Odaklı Yaklaşım</div>
//                                     <div style={styles.whyUsItem}><CheckCircle color="#d90429" /> Federasyon Onaylı Profesyonel Kadro</div>
//                                     <div style={styles.whyUsItem}><CheckCircle color="#d90429" /> %100 Kişiye Özel Gelişim Takibi</div>
//                                 </div>
//                             </div>

//                             {/* HİZMETLERİMİZ */}
//                             <h2 style={styles.sectionTitle}>HİZMETLERİMİZ</h2>
//                             <div style={styles.servicesGrid}>
//                                 <div style={styles.serviceCard}>
//                                     <Dumbbell size={40} color="#d90429" style={{ marginBottom: '15px' }} />
//                                     <h4>Fitness & Bodybuilding</h4>
//                                     <p>Sadece ağırlık kaldırmayın, vücudunuzu yönetin. Hedeflerinize (kas kütlesi, yağ yakımı) bilimsel araştırmalar ve form analizleriyle en güvenli yoldan ulaşın.</p>
//                                 </div>
//                                 <div style={styles.serviceCard}>
//                                     <Zap size={40} color="#d90429" style={{ marginBottom: '15px' }} />
//                                     <h4>Pilates Studio</h4>
//                                     <p>Postür (duruş) bozukluklarını gidermek, core bölgenizi güçlendirmek ve esneklik kazanmak için modern pilates metodolojisi. Zihin ve beden uyumunu keşfedin.</p>
//                                 </div>
//                                 <div style={styles.serviceCard}>
//                                     <ShieldCheck size={40} color="#d90429" style={{ marginBottom: '15px' }} />
//                                     <h4>Kişiye Özel Beslenme</h4>
//                                     <p>Sürdürülemez diyetleri çöpe atın. Kilonuz, metabolizma hızınız ve rutininize göre tamamen size özel optimize edilmiş beslenme planı ve sıkı takip.</p>
//                                 </div>
//                             </div>

//                             {/* PAKETLER VE FİYATLAR (SLIDER 2) */}
//                             <h2 style={styles.sectionTitle} style={{ marginTop: '60px' }}>PAKETLERİMİZ</h2>
//                             <AutoSlider images={packageImages} />

//                             {/* CALL TO ACTION (Ateşleme Butonları) */}
//                             <div style={styles.ctaContainer}>
//                                 <a href="tel:5396078155" style={{ textDecoration: 'none' }}>
//                                     <button style={styles.ctaBtnPrimary}>
//                                         Ücretsiz Tanışma Seansı Randevusu Al <ChevronRight />
//                                     </button>
//                                 </a>

//                                 {/* <button disabled style={{ ...styles.ctaBtnSecondary, opacity: 0.4, cursor: 'not-allowed', borderColor: '#444', color: '#666' }}>
//                                     Hemen Kaydol, Değişimi Başlat (Çok Yakında) <Zap />
//                                 </button> */}
//                             </div>

//                             {/* İLETİŞİM / FOOTER */}
//                             <footer style={styles.footer}>
//                                 <div style={styles.footerLogo}><span style={{ color: '#d90429' }}>N1</span>FIT</div>
//                                 <p style={styles.footerText}>Bahanelere yer yok, sadece sonuç var!</p>

//                                 <div style={styles.contactInfo}>
//                                     <div style={styles.contactItem}>
//                                         <Phone size={20} color="#d90429" />
//                                         <span>539 607 81 55 &nbsp; | &nbsp; 535 049 54 81</span>
//                                     </div>
//                                     <div style={styles.contactItem}>
//                                         <MapPin size={20} color="#d90429" />
//                                         <span>Kültür Mahallesi, Yavuz Selim Sokak No:8 <br /> Gölyaka / Düzce</span>
//                                     </div>
//                                     <a href="https://www.instagram.com/n1fitspormerkezi/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
//                                         <div style={{ ...styles.contactItem, cursor: 'pointer', transition: '0.3s', border: '1px solid #d90429' }}>
//                                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d90429" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                                                     <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
//                                                     <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
//                                                     <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
//                                                 </svg>
//                                             <span style={{ color: '#fff', fontWeight: 'bold', letterSpacing: '1px' }}>@n1fitspormerkezi</span>
//                                         </div>
//                                     </a>
//                                 </div>
//                                 <div style={styles.copyright}>
//                                     © 2026 N1FIT Spor Merkezi. Tüm Hakları Saklıdır.
//                                 </div>
//                             </footer>
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
//                         window.location.reload();
//                     }}
//                 />
//             </div>
//         </div>
//     );
// };

// // ==========================================
// // TASARIMIN JİLET KISMI (CSS)
// // ==========================================
// const styles = {
//     container: { minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' },
//     notifyBtn: { backgroundColor: '#d90429', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(217,4,41,0.4)' },
//     landingContainer: { textAlign: 'center', marginTop: '40px', maxWidth: '1000px', margin: '40px auto 0 auto' },
//     heroTitle: { fontSize: '3.5rem', fontWeight: '900', color: '#fff', textTransform: 'uppercase', marginBottom: '10px' },
//     heroSubtitle: { fontSize: '1.2rem', color: '#aaa', marginBottom: '40px', fontWeight: '600' },

//     // --- 3:4 ORANLI İPHONE SLIDER TASARIMI ---
//     sliderContainer: { position: 'relative', width: '100%', maxWidth: '450px', aspectRatio: '3/4', margin: '0 auto 50px auto', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 0 40px rgba(217, 4, 41, 0.25)', backgroundColor: '#050505' },
//     sliderImageWrapper: { width: '100%', height: '100%', position: 'relative' },
//     sliderImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
//     sliderBtnLeft: { position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', backgroundColor: 'rgba(0, 0, 0, 0.6)', border: 'none', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: '0.3s' },
//     sliderBtnRight: { position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)', backgroundColor: 'rgba(0, 0, 0, 0.6)', border: 'none', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: '0.3s' },
//     sliderDots: { position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 10 },
//     dot: { width: '10px', height: '10px', borderRadius: '50%', transition: 'all 0.3s' },

//     aboutSection: { backgroundColor: '#111', padding: '40px', borderRadius: '15px', border: '1px solid #222', marginBottom: '40px', textAlign: 'left' },
//     sectionTitle: { fontSize: '2.2rem', fontWeight: '900', color: '#fff', marginBottom: '25px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' },
//     paragraph: { fontSize: '1.1rem', color: '#bbb', lineHeight: '1.8', marginBottom: '20px' },
//     missionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '40px' },
//     missionCard: { backgroundColor: '#0a0a0a', padding: '25px', borderRadius: '10px', borderLeft: '4px solid #d90429' },
//     whyUsContainer: { margin: '50px 0', padding: '30px', backgroundColor: 'rgba(217, 4, 41, 0.05)', borderRadius: '15px', border: '1px solid rgba(217, 4, 41, 0.2)' },
//     whyUsTitle: { fontSize: '1.5rem', fontWeight: 'bold', color: '#d90429', marginBottom: '20px' },
//     whyUsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', textAlign: 'left' },
//     whyUsItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '600', color: '#fff' },
//     servicesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '50px' },
//     serviceCard: { backgroundColor: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #222', transition: 'transform 0.3s, boxShadow 0.3s', textAlign: 'left' },
//     ctaContainer: { display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', marginTop: '40px', marginBottom: '60px' },
//     ctaBtnPrimary: { backgroundColor: '#d90429', color: 'white', padding: '18px 40px', fontSize: '1.2rem', fontWeight: 'bold', border: 'none', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 30px rgba(217, 4, 41, 0.4)', transition: '0.3s' },
//     ctaBtnSecondary: { backgroundColor: 'transparent', color: '#fff', padding: '15px 35px', fontSize: '1.1rem', fontWeight: 'bold', border: '2px solid #d90429', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: '0.3s' },
//     footer: { backgroundColor: '#050505', borderTop: '2px solid #222', padding: '50px 20px', textAlign: 'center', marginTop: '40px' },
//     footerLogo: { fontSize: '2.5rem', fontWeight: '900', letterSpacing: '2px', marginBottom: '10px' },
//     footerText: { color: '#666', fontSize: '1rem', fontStyle: 'italic', marginBottom: '30px' },
//     contactInfo: { display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', marginBottom: '40px' },
//     contactItem: { display: 'flex', alignItems: 'center', gap: '15px', color: '#ccc', fontSize: '1.1rem', backgroundColor: '#111', padding: '15px 30px', borderRadius: '50px', border: '1px solid #333' },
//     copyright: { color: '#444', fontSize: '0.9rem', marginTop: '20px' }
// };

// export default MemberDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    PlayCircle, Calendar, Clock, AlertTriangle, Snowflake, 
    LogOut, Dumbbell, Activity, MapPin, Phone, Target, 
    ShieldCheck, CheckCircle, ChevronRight, ChevronLeft, Zap
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
// V8 MOTORLU İPHONE ORANLI SLIDER (Sadece Salon Fotoları İçin)
// ==========================================
const AutoSlider = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!images || images.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [images, currentIndex]);

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % images.length);
    const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

    if (!images || images.length === 0) return null;

    return (
        <div style={styles.sliderContainer}>
            <button onClick={prevSlide} style={styles.sliderBtnLeft}><ChevronLeft size={30} color="white" /></button>
            <div style={styles.sliderImageWrapper}>
                {images.map((img, idx) => (
                    <img key={idx} src={img} alt={`N1FIT Foto ${idx}`} style={{ ...styles.sliderImage, opacity: idx === currentIndex ? 1 : 0, transition: 'opacity 0.8s ease-in-out' }} />
                ))}
            </div>
            <button onClick={nextSlide} style={styles.sliderBtnRight}><ChevronRight size={30} color="white" /></button>
            <div style={styles.sliderDots}>
                {images.map((_, idx) => (
                    <div key={idx} onClick={() => setCurrentIndex(idx)} style={{ ...styles.dot, backgroundColor: idx === currentIndex ? '#d90429' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transform: idx === currentIndex ? 'scale(1.2)' : 'scale(1)' }} />
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
    const [vitrinPaketleri, setVitrinPaketleri] = useState([]);
    
    const [isNotifyGranted, setIsNotifyGranted] = useState(
        'Notification' in window ? Notification.permission === 'granted' : false
    );
    
    const PUBLIC_VAPID_KEY = "BGme68ndHvhXyZ8dtnIIcsE89ELVrcXIaiDNrA4zACgknZbOaCPL9ny1E6qlo7MoNr22EhFqv8NdFVMnw3V6hhY";

    const [profile, setProfile] = useState(null);
    const [workouts, setWorkouts] = useState([]);
    const [diets, setDiets] = useState([]);
    const [measurements, setMeasurements] = useState([]);

    const gymImages = [
        "/SalonunFotolari/Salon1.jpeg", "/SalonunFotolari/Salon2.jpeg", "/SalonunFotolari/Salon3.jpeg",
        "/SalonunFotolari/Salon4.jpeg", "/SalonunFotolari/Salon5.jpeg", "/SalonunFotolari/Salon6.jpeg",
        "/SalonunFotolari/Salon7.jpeg", "/SalonunFotolari/Salon8.jpeg", "/SalonunFotolari/Salon9.jpeg", "/SalonunFotolari/Salon10.jpeg"
    ];

    const parseJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
        } catch (e) { return null; }
    };

    useEffect(() => {
        const fetchPublicPackages = async () => {
            try {
                const res = await api.get('/Member/packages');
                setVitrinPaketleri(res.data);
            } catch (err) {
                console.error("Vitrin paketleri çekilirken motor yandı", err);
            }
        };
        fetchPublicPackages();

        // 2. Token ve Giriş Kontrolleri (Senin eski kodun aynısı)
        const token = localStorage.getItem('n1fit_token');
        if (token) {
            const payload = parseJwt(token);
            const userRole = payload ? (payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role) : '';
            if (userRole === 'Admin') { setIsLoggedIn(true); setLoading(false); return; }
            setIsLoggedIn(true);
            fetchMyData();
        } else { setLoading(false); }
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
            if (error.response?.status === 401) navigate('/login');
        }
    };

    const handleLogout = () => { localStorage.removeItem('n1fit_token'); window.location.href = '/'; };

    const handleEnableNotifications = async () => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const swReg = await navigator.serviceWorker.ready;
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    setIsNotifyGranted(true); 
                    const subscription = await swReg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(PUBLIC_VAPID_KEY) });
                    const subJSON = subscription.toJSON();
                    await api.post('/Member/save-subscription', { endpoint: subJSON.endpoint, p256dh: subJSON.keys.p256dh, auth: subJSON.keys.auth });
                    alert("Bildirimler Aktif!");
                } else { alert("Aktif Ederseniz Üyeliğiniz Bitmeden Haberdar Olursunuz!"); }
            } catch (error) { console.error("Motor yandı:", error); }
        } else { alert("Telefonun bu bildirimleri desteklemiyor!"); }
    };

    if (loading) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>Ağırlıklar Yükleniyor...</div>;

    return (
        <div style={styles.container}>
            <div style={{ backgroundColor: '#050505', minHeight: '100vh', color: 'white' }}>
                <Navbar activeTab={activeTab} setActiveTab={setActiveTab} isLoggedIn={isLoggedIn} onLogout={handleLogout} onOpenLogin={() => setIsLoginModalOpen(true)} />

                <div style={{ padding: '0 20px', paddingBottom: '80px' }}>
                    {isLoggedIn && !isNotifyGranted && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '20px' }}>
                            <button onClick={handleEnableNotifications} style={styles.notifyBtn}><AlertTriangle size={20} /> BİLDİRİMLERİ AÇ</button>
                        </div>
                    )}

                    {activeTab === 'home' && (
                        <div style={styles.landingContainer}>
                            <h1 style={styles.heroTitle}>N1<span style={{color: '#d90429'}}>FIT</span> SPOR MERKEZİ</h1>
                            <p style={styles.heroSubtitle}>Bilimin, Disiplinin ve 15 Yıllık Tecrübenin Buluştuğu Yer</p>

                            <AutoSlider images={gymImages} />

                            <div style={styles.aboutSection}>
                                <h2 style={styles.sectionTitle}>BİZ KİMİZ?</h2>
                                <p style={styles.paragraph}>Sadece bir spor salonu değil; bilimin, doğru metodolojinin ve <strong>15 yıllık sektörel tecrübenin</strong> bir araya geldiği bir yaşam dönüşüm merkeziyiz.</p>
                                <p style={styles.paragraph}>Fitness trendlerini değil, <strong>biyomekanik kuralları</strong> ve kanıtlanmış antrenman stratejilerini temel alıyoruz.</p>
                                
                                <div style={styles.missionGrid}>
                                    <div style={styles.missionCard}><Target size={40} color="#d90429" /><h3>Misyonumuz</h3><p>Sporu geçici bir heves olmaktan çıkarıp, bilimin ışığında sürdürülebilir bir yaşam tarzı haline getirmek.</p></div>
                                    <div style={styles.missionCard}><Activity size={40} color="#d90429" /><h3>Vizyonumuz</h3><p>Gelişmiş altyapımız ve akademik yaklaşımımızla bölgesel olarak standartları belirleyen lider marka olmak.</p></div>
                                </div>
                            </div>

                            <div style={styles.whyUsContainer}>
                                <h3 style={styles.whyUsTitle}>NEDEN BİZ?</h3>
                                <div style={styles.whyUsGrid}>
                                    <div style={styles.whyUsItem}><CheckCircle color="#d90429" /> 15+ Yıllık Sektörel Tecrübe</div>
                                    <div style={styles.whyUsItem}><CheckCircle color="#d90429" /> Biyomekanik ve Form Odaklı Yaklaşım</div>
                                    <div style={styles.whyUsItem}><CheckCircle color="#d90429" /> Federasyon Onaylı Profesyonel Kadro</div>
                                    <div style={styles.whyUsItem}><CheckCircle color="#d90429" /> %100 Kişiye Özel Gelişim Takibi</div>
                                </div>
                            </div>

                            <h2 style={styles.sectionTitle}>HİZMETLERİMİZ</h2>
                            <div style={styles.servicesGrid}>
                                <div style={styles.serviceCard}><Dumbbell size={40} color="#d90429" style={{marginBottom:'15px'}} /><h4>Fitness & Bodybuilding</h4><p>Sadece ağırlık kaldırmayın, vücudunuzu yönetin. En güvenli yoldan hedefe ulaşın.</p></div>
                                <div style={styles.serviceCard}><Zap size={40} color="#d90429" style={{marginBottom:'15px'}} /><h4>Pilates Studio</h4><p>Postür bozukluklarını gidermek ve core bölgenizi güçlendirmek için modern pilates.</p></div>
                                <div style={styles.serviceCard}><ShieldCheck size={40} color="#d90429" style={{marginBottom:'15px'}} /><h4>Kişiye Özel Beslenme</h4><p>Sürdürülemez diyetleri çöpe atın. Size özel optimize edilmiş beslenme planı.</p></div>
                            </div>

                            <h2 style={styles.sectionTitle} style={{marginTop: '60px', marginBottom: '20px'}}>PAKETLERİMİZ</h2>
                            
                            {/* ZİGZAG KART YAPISI AMQ! */}
                            <div style={styles.packageGrid}>
                                {vitrinPaketleri.map((pkg, idx) => (
                                    <div key={pkg.id} style={{
                                        ...styles.packageCard, 
                                        transform: idx % 2 !== 0 ? 'translateY(30px)' : 'none'
                                    }}>
                                        <h3 style={styles.pkgType}>{pkg.name}</h3>
                                        <h4 style={styles.pkgDuration}>{pkg.durationMonths} AY</h4>
                                        <div style={styles.pkgPrice}>{pkg.price} ₺</div>
                                        <hr style={styles.pkgDivider}/>
                                        <ul style={styles.pkgFeatures}>
                                            <li>✓ Sınırsız Alet Kullanımı</li>
                                            <li>✓ Soyunma Odası & Duş</li>
                                            <li>✓ Profesyonel Destek</li>
                                        </ul>
                                    </div>
                                ))}
                            </div>

                            <div style={styles.ctaContainer}>
                                <a href="tel:5396078155" style={{ textDecoration: 'none' }}><button style={styles.ctaBtnPrimary}>Ücretsiz Tanışma Seansı Randevusu Al <ChevronRight /></button></a>
                                {/* <button disabled style={{ ...styles.ctaBtnSecondary, opacity: 0.4, cursor: 'not-allowed', borderColor: '#444', color: '#666' }}>Hemen Kaydol, Değişimi Başlat (Çok Yakında) <Zap /></button> */}
                            </div>

                            <footer style={styles.footer}>
                                <div style={styles.footerLogo}>N1<span style={{color:'#d90429'}}>FIT</span></div>
                                <p style={styles.footerText}>Bahanelere yer yok, sadece sonuç var!</p>
                                
                                <div style={styles.contactInfo}>
                                    <div style={styles.contactItem}><Phone size={20} color="#d90429"/> <span>539 607 81 55 &nbsp; | &nbsp; 535 049 54 81</span></div>
                                    <div style={styles.contactItem}><MapPin size={20} color="#d90429"/> <span>Kültür Mahallesi, Yavuz Selim Sokak No:8 <br/> Gölyaka / Düzce</span></div>
                                    
                                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        {/* INSTAGRAM */}
                                        <a href="https://www.instagram.com/n1fitspormerkezi/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                            <div style={{...styles.contactItem, cursor: 'pointer', transition: '0.3s', border: '1px solid #d90429'}}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d90429" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                                <span style={{ color: '#fff', fontWeight: 'bold', letterSpacing: '1px' }}>@n1fitspormerkezi</span>
                                            </div>
                                        </a>

                                        {/* YOUTUBE SVG MERMİSİ */}
                                        <a href="https://www.youtube.com/@N1F%C4%B0TSPORMERKEZ%C4%B0" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                            <div style={{...styles.contactItem, cursor: 'pointer', transition: '0.3s', border: '1px solid #d90429'}}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d90429" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
                                                <span style={{ color: '#fff', fontWeight: 'bold', letterSpacing: '1px' }}>YouTube Kanalımız</span>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                                <div style={styles.copyright}>© 2026 N1FIT Spor Merkezi. Tüm Hakları Saklıdır.</div>
                            </footer>
                        </div>
                    )}
                    {isLoggedIn && activeTab === 'membership' && <MembershipTab />}
                    {isLoggedIn && activeTab === 'workout' && <WorkoutTab />}
                    {isLoggedIn && activeTab === 'diet' && <DietTab />}
                    {isLoggedIn && activeTab === 'measure' && <MeasurementTab />}
                </div>

                <MemberLoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={() => { setIsLoggedIn(true); window.location.reload(); }} />
            </div>
        </div>
    );
};

// TASARIMIN JİLET KISMI
const styles = {
    container: { minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white' },
    notifyBtn: { backgroundColor: '#d90429', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(217,4,41,0.4)' },
    landingContainer: { textAlign: 'center', marginTop: '40px', maxWidth: '1000px', margin: '40px auto 0 auto' },
    heroTitle: { fontSize: '3.5rem', fontWeight: '900', color: '#fff', textTransform: 'uppercase', marginBottom: '10px' },
    heroSubtitle: { fontSize: '1.2rem', color: '#aaa', marginBottom: '40px', fontWeight: '600' },
    sliderContainer: { position: 'relative', width: '100%', maxWidth: '450px', aspectRatio: '3/4', margin: '0 auto 50px auto', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 0 40px rgba(217, 4, 41, 0.25)', backgroundColor: '#050505' },
    sliderImageWrapper: { width: '100%', height: '100%', position: 'relative' },
    sliderImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    sliderBtnLeft: { position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', backgroundColor: 'rgba(0, 0, 0, 0.6)', border: 'none', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: '0.3s' },
    sliderBtnRight: { position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)', backgroundColor: 'rgba(0, 0, 0, 0.6)', border: 'none', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: '0.3s' },
    sliderDots: { position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 10 },
    dot: { width: '10px', height: '10px', borderRadius: '50%', transition: 'all 0.3s' },
    
    // ZİGZAG PAKET KARTLARI CSS
    packageGrid: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', padding: '20px 0 60px 0' },
    packageCard: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '15px', width: '260px', padding: '30px 20px', textAlign: 'center', transition: 'transform 0.3s', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
    pkgType: { color: '#d90429', fontSize: '1.4rem', fontWeight: '900', margin: 0, textTransform: 'uppercase' },
    pkgDuration: { color: '#fff', fontSize: '1.1rem', marginTop: '5px', fontWeight: 'bold' },
    pkgPrice: { fontSize: '2.2rem', fontWeight: '900', margin: '20px 0', color: '#fff' },
    pkgDivider: { borderColor: '#333', marginBottom: '20px' },
    pkgFeatures: { listStyle: 'none', padding: 0, color: '#aaa', fontSize: '0.95rem', lineHeight: '2' },

    aboutSection: { backgroundColor: '#111', padding: '40px', borderRadius: '15px', border: '1px solid #222', marginBottom: '40px', textAlign: 'left' },
    sectionTitle: { fontSize: '2.2rem', fontWeight: '900', color: '#fff', marginBottom: '25px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' },
    paragraph: { fontSize: '1.1rem', color: '#bbb', lineHeight: '1.8', marginBottom: '20px' },
    missionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '40px' },
    missionCard: { backgroundColor: '#0a0a0a', padding: '25px', borderRadius: '10px', borderLeft: '4px solid #d90429' },
    whyUsContainer: { margin: '50px 0', padding: '30px', backgroundColor: 'rgba(217, 4, 41, 0.05)', borderRadius: '15px', border: '1px solid rgba(217, 4, 41, 0.2)' },
    whyUsTitle: { fontSize: '1.5rem', fontWeight: 'bold', color: '#d90429', marginBottom: '20px' },
    whyUsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', textAlign: 'left' },
    whyUsItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '600', color: '#fff' },
    servicesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '50px' },
    serviceCard: { backgroundColor: '#111', padding: '30px', borderRadius: '15px', border: '1px solid #222', transition: 'transform 0.3s, boxShadow 0.3s', textAlign: 'left' },
    ctaContainer: { display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', marginTop: '40px', marginBottom: '60px' },
    ctaBtnPrimary: { backgroundColor: '#d90429', color: 'white', padding: '18px 40px', fontSize: '1.2rem', fontWeight: 'bold', border: 'none', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 30px rgba(217, 4, 41, 0.4)', transition: '0.3s' },
    ctaBtnSecondary: { backgroundColor: 'transparent', color: '#fff', padding: '15px 35px', fontSize: '1.1rem', fontWeight: 'bold', border: '2px solid #d90429', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: '0.3s' },
    footer: { backgroundColor: '#050505', borderTop: '2px solid #222', padding: '50px 20px', textAlign: 'center', marginTop: '40px' },
    footerLogo: { fontSize: '2.5rem', fontWeight: '900', letterSpacing: '2px', marginBottom: '10px' },
    footerText: { color: '#666', fontSize: '1rem', fontStyle: 'italic', marginBottom: '30px' },
    contactInfo: { display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', marginBottom: '40px' },
    contactItem: { display: 'flex', alignItems: 'center', gap: '15px', color: '#ccc', fontSize: '1.1rem', backgroundColor: '#111', padding: '15px 30px', borderRadius: '50px', border: '1px solid #333' },
    copyright: { color: '#444', fontSize: '0.9rem', marginTop: '20px' }
};

export default MemberDashboard;