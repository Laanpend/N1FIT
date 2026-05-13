import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Calendar, Clock, AlertTriangle, Snowflake, LogOut, Dumbbell, Activity } from 'lucide-react';
import api from '../api/axiosConfig';

const MemberDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Müşterinin tüm bilgilerini tutacağımız state
    const [profile, setProfile] = useState(null);
    const [workouts, setWorkouts] = useState([]);
    const [diets, setDiets] = useState([]);
    const [measurements, setMeasurements] = useState([]);
    const [expandedDay, setExpandedDay] = useState(null);

    useEffect(() => {
        // C# tarafında müşterinin sadece kendi bilgisini getiren bir uç yazman lazım dayıoğlu.
        // Şimdilik temsili bir endpoint atıyorum, sen bunu kendi C# ucuna göre düzeltirsin.
        fetchMyData();
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
        navigate('/login');
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

    // DİYET SİLME OPERASYONU
    

    return (
        <div style={styles.container}>
            {/* ÜST MENÜ */}
            <nav style={styles.navbar}>
                <div style={styles.logo}>N1<span style={{ color: '#d90429' }}>FIT</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>Hoş geldin, {profile?.firstName}!</span>
                    <button onClick={handleLogout} style={styles.logoutBtn}><LogOut size={18} /> Çıkış</button>
                </div>
            </nav>

            <div style={styles.main}>
                {/* 1. KISIM: ÜYELİK BİLGİLERİ (SENİN İSTEDİĞİN YER) */}
                <div style={{ ...styles.card, border: profile?.isFrozen ? '2px solid #3b82f6' : '1px solid #333' }}>
                    <h2 style={{ marginTop: 0, color: profile?.isFrozen ? '#3b82f6' : 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {profile?.isFrozen ? <Snowflake /> : <Calendar />}
                        Üyelik Durumun
                    </h2>

                    {profile?.isFrozen && (
                        <div style={styles.frozenAlert}>
                            <AlertTriangle size={20} />
                            DİKKAT: Üyeliğin şu an dondurulmuş durumda. Günlerin eksilmiyor, salon kullanımın kapalıdır.
                        </div>
                    )}

                    {/* ÜYELİK KARTI KISMI - FİYAT, BORÇ VE TEMİZ TARİHLER */}
                    <div style={styles.infoGrid}>
                        <div style={styles.infoBox}>
                            <span style={styles.infoLabel}>Mevcut Paket</span>
                            <span style={styles.infoValue}>{profile?.packageName || "Paket Yok"}</span>

                            {/* Fiyat ve Borç Zımbırtısı */}
                            <div style={{ marginTop: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                {profile?.packagePrice > 0 && (
                                    <span style={{ color: '#4ade80' }}>{profile.packagePrice} ₺</span>
                                )}
                                {Number(profile?.totalDebt) > 0 ? (
                                    <span style={{ color: '#d90429', marginLeft: '12px' }}>
                                        BORÇ: {profile.totalDebt} ₺
                                    </span>
                                ) : null}
                            </div>
                        </div>
                        <div style={styles.infoBox}>
                            <span style={styles.infoLabel}>Başlangıç Tarihi</span>
                            {/* Tıraşladığımız tarihi basıyoruz */}
                            <span style={styles.infoValue}>{formatDate(profile?.membershipStartDate)}</span>
                        </div>
                        <div style={styles.infoBox}>
                            <span style={styles.infoLabel}>Bitiş Tarihi</span>
                            <span style={styles.infoValue}>{formatDate(profile?.subscriptionEndDate)}</span>
                        </div>
                        <div style={{ ...styles.infoBox, backgroundColor: profile?.daysLeft < 10 ? 'rgba(217, 4, 41, 0.2)' : 'rgba(74, 222, 128, 0.2)' }}>
                            <span style={styles.infoLabel}>Kalan Süre</span>
                            <span style={{ ...styles.infoValue, color: profile?.daysLeft < 10 ? '#d90429' : '#4ade80', fontSize: '1.5rem' }}>
                                {profile?.isFrozen ? "DONDURULDU" : `${profile?.daysLeft} GÜN`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. KISIM: ANTRENMAN PROGRAMI (THUMBNAILLI VİDEOLAR) */}
                {/* MemberDashboard.jsx - AKORDEONLU ANTRENMAN PLANI */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {/* Önce hareketleri gün isimlerine göre grupluyoruz (Matrix'i çözdük amq) */}
                    {Object.entries(
                        workouts.reduce((acc, ex) => {
                            const day = ex.dayTitle || "Genel Program";
                            if (!acc[day]) acc[day] = [];
                            acc[day].push(ex);
                            return acc;
                        }, {})
                    ).map(([dayTitle, exercises], dayIdx) => (
                        <div key={dayIdx} style={{ backgroundColor: '#111', borderRadius: '8px', overflow: 'hidden', borderLeft: '4px solid #d90429' }}>

                            {/* GÜN BAŞLIĞI (Tıklayınca açılır kapanır dropdown) */}
                            <div
                                onClick={() => setExpandedDay(expandedDay === dayIdx ? null : dayIdx)}
                                style={{ padding: '18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0a0a' }}
                            >
                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'white' }}>
                                    {expandedDay === dayIdx ? '▼' : '▶'} {dayTitle}
                                </span>
                                <span style={{ color: '#666', fontSize: '0.8rem' }}>{exercises.length} Hareket</span>
                            </div>

                            {/* HAREKETLER (VİDEOLU VE CAFCAFLI) */}
                            {expandedDay === dayIdx && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', padding: '15px', backgroundColor: '#161616' }}>
                                    {exercises.map((ex, i) => {
                                        // Thumbnail hatasını çözen radar
                                        const videoId = ex.videoUrl?.split('v=')?.[1]?.split('&')?.[0];
                                        const thumbUrl = videoId
                                            ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
                                            : `https://placehold.co/300x200/111111/d90429.png?text=VIDEO+YOK`;

                                        return (
                                            <div key={i} style={{ backgroundColor: '#0a0a0a', borderRadius: '10px', overflow: 'hidden', border: '1px solid #222' }}>
                                                <div style={{ position: 'relative', height: '160px', cursor: 'pointer' }} onClick={() => window.open(ex.videoUrl, '_blank')}>
                                                    <img src={thumbUrl} alt={ex.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                                                        <PlayCircle size={45} color="#d90429" />
                                                    </div>
                                                </div>
                                                <div style={{ padding: '12px' }}>
                                                    <div style={{ fontWeight: 'bold', color: 'white', marginBottom: '5px' }}>{ex.name}</div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '0.85rem' }}>

                                                        {/* EĞER SET 0'DAN BÜYÜKSE BU BİR AĞIRLIK İDMANIDIR */}
                                                        {ex.sets > 0 ? (
                                                            <>
                                                                <span>Set: <b style={{ color: '#4ade80' }}>{ex.sets}</b></span>
                                                                <span>Tekrar: <b style={{ color: '#4ade80' }}>{ex.reps}</b></span>
                                                            </>
                                                        ) : (
                                                            // EĞER SET YOKSA BU KESİN KARDİYODUR AMQ! (Süre, Hız, Eğim basıyoruz)
                                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                                {ex.duration && <span>Süre: <b style={{ color: '#3b82f6' }}>{ex.duration} dk</b></span>}
                                                                {ex.speed && <span>Hız: <b style={{ color: '#3b82f6' }}>{ex.speed}</b></span>}
                                                                {ex.incline && <span>Eğim: <b style={{ color: '#3b82f6' }}>{ex.incline}</b></span>}
                                                            </div>
                                                        )}

                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* 3. KISIM: BESLENME PROGRAMI */}
                <div style={styles.card}>
                    <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><Clock color="#d90429" /> Beslenme Programım</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {diets.map((diet, i) => (
                            <div key={i} style={styles.dietRow}>
                                <div style={{ fontWeight: 'bold', color: '#d90429', minWidth: '80px' }}>{diet.time}</div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 5px 0' }}>{diet.mealName}</h4>
                                    <span style={{ color: '#aaa', fontSize: '0.9rem' }}>{diet.content}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
            {/* 4. KISIM: GELİŞİM TAKİBİ (ÖLÇÜLER) */}
            <div style={styles.card}>
                <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity color="#4ade80" /> Gelişim Tablosu
                </h2>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#1a1a1a', color: '#888', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                                <th style={{ padding: '12px' }}>Tarih</th>
                                <th style={{ padding: '12px' }}>Kilo</th>
                                <th style={{ padding: '12px' }}>Omuz</th>
                                <th style={{ padding: '12px' }}>Göğüs</th>
                                <th style={{ padding: '12px' }}>Kol (Sağ/Sol)</th>
                                <th style={{ padding: '12px' }}>Bel</th>
                                <th style={{ padding: '12px' }}>Boyun</th>
                            </tr>
                        </thead>
                        <tbody>
                            {measurements.map((m, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #222', backgroundColor: i === 0 ? 'rgba(74, 222, 128, 0.05)' : 'transparent' }}>
                                    <td style={{ padding: '12px', fontWeight: i === 0 ? 'bold' : 'normal', color: i === 0 ? '#4ade80' : 'white' }}>
                                        {m.recordDate || m.RecordDate ? new Date(m.recordDate || m.RecordDate).toLocaleDateString() : "Tarih Yok"}
                                    </td>
                                    <td style={{ padding: '12px' }}>{m.weight} {getDiff(m.weight, measurements[i + 1]?.weight, true)}</td>
                                    <td style={{ padding: '12px' }}>{m.shoulder} {getDiff(m.shoulder, measurements[i + 1]?.shoulder)}</td>
                                    <td style={{ padding: '12px' }}>{m.chest} {getDiff(m.chest, measurements[i + 1]?.chest)}</td>
                                    <td style={{ padding: '12px' }}>
                                        Sağ: {m.rightArm} {getDiff(m.rightArm, measurements[i + 1]?.rightArm)} <br />
                                        Sol: {m.leftArm} {getDiff(m.leftArm, measurements[i + 1]?.leftArm)}
                                    </td>
                                    <td style={{ padding: '12px' }}>{m.waist} {getDiff(m.waist, measurements[i + 1]?.waist, true)}</td>
                                    <td style={{ padding: '12px' }}>{m.neck} {getDiff(m.neck, measurements[i + 1]?.neck)}</td>
                                </tr>
                            ))}
                            {measurements.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Henüz ölçü girilmemiş dayıoğlu, basmaya devam!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
    dietRow: { display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #d90429' }
};

export default MemberDashboard;