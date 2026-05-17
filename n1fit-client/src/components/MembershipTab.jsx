import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Calendar, Snowflake, AlertTriangle } from 'lucide-react'; // İkonları buradan yakalıyoruz dayı

const MembershipTab = () => {
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('n1fit_token');
        if (!token) return;
        api.get('/Member/my-profile')
           .then(res => setProfile(res.data))
           .catch(err => console.error("Profil çekilemedi:", err));
    }, []);

    if (!profile) return <div style={{ color: '#aaa', textAlign: 'center', marginTop: '50px' }}>Bilgiler toparlanıyor aslanım, bekle...</div>;

    // Senin koddaki o jilet tarih tıraşlama fonksiyonu
    const formatDate = (dateString) => {
        if (!dateString) return "Belirsiz";
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    // ==========================================
    // 🛠️ 3 KADEMELİ CYBORG DURUM VE RENK MOTORU
    // ==========================================
    let statusText = '';
    let statusColor = '';

    if (profile.isFrozen) {
        statusText = 'DONDURULDU (BEKLEMEDE)';
        statusColor = '#3b82f6'; // Mavi (Buz teması amq)
    } else if (profile.daysLeft <= 0) {
        statusText = 'PASİF (SÜRESİ BİTMİŞ)';
        statusColor = '#d90429'; // Kan Kırmızı
    } else {
        statusText = 'AKTİF ÜYE';
        statusColor = '#10b981'; // Neon Yeşil
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ color: '#10b981', borderBottom: '2px solid #333', paddingBottom: '10px' }}>ÜYELİK BİLGİLERİN</h2>
            
            <div style={{ 
                backgroundColor: '#111', 
                padding: '25px', 
                borderRadius: '12px', 
                border: profile.isFrozen ? '2px solid #3b82f6' : '1px solid #222', 
                marginTop: '20px', 
                position: 'relative', 
                overflow: 'hidden' 
            }}>
                
                {/* SAĞ ÜSTTEKİ AKILLI ROZET */}
                <div style={{ 
                    position: 'absolute', 
                    top: '20px', 
                    right: '20px', 
                    backgroundColor: statusColor, 
                    color: 'white', 
                    padding: '5px 15px', 
                    borderRadius: '20px', 
                    fontWeight: '900', 
                    fontSize: '0.8rem', 
                    textTransform: 'uppercase' 
                }}>
                    {statusText}
                </div>

                {/* İSİM VE BAŞLIK ALANI */}
                <h3 style={{ color: 'white', marginTop: 0, fontSize: '1.5rem', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {profile.isFrozen ? <Snowflake size={22} color="#3b82f6" /> : <Calendar size={22} color="#10b981" />}
                    {profile.firstName} {profile.lastName}
                </h3>
                <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem' }}>{profile.email} • {profile.phoneNumber}</p>

                {/* DONDURULAN ADAMA ÖZEL UYARI BLOKU */}
                {profile.isFrozen && (
                    <div style={{ 
                        backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                        border: '1px solid #3b82f6', 
                        color: '#3b82f6', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        marginTop: '15px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                    }}>
                        <AlertTriangle size={20} />
                        <span>DİKKAT: Üyeliğin şu an dondurulmuş durumda. Günlerin eksilmiyor, salon kullanımın kapalıdır.</span>
                    </div>
                )}
                
                {/* VERİ METRİKLERİ GRID YAPISI */}
                <div style={{ marginTop: '25px', display: 'grid', gap: '15px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
                        <span style={{ color: '#888' }}>Mevcut Paket:</span>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>
                            {profile.packageName || "Paket Yok"} 
                            {profile.packagePrice > 0 && <span style={{ color: '#4ade80', marginLeft: '8px' }}>({profile.packagePrice} ₺)</span>}
                        </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
                        <span style={{ color: '#888' }}>Başlangıç Tarihi:</span>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>{formatDate(profile.membershipStartDate)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
                        <span style={{ color: '#888' }}>Bitiş Tarihi:</span>
                        <span style={{ color: profile.isFrozen ? '#3b82f6' : (profile.daysLeft > 0 ? '#10b981' : '#d90429'), fontWeight: 'bold' }}>
                            {formatDate(profile.subscriptionEndDate)}
                        </span>
                    </div>

                    {/* KALAN SÜRE KUTUSU (Senin İstediğin Renkli Kondisyon) */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        backgroundColor: profile.isFrozen ? 'rgba(59, 130, 246, 0.1)' : (profile.daysLeft < 10 ? 'rgba(217, 4, 41, 0.1)' : 'rgba(16, 185, 129, 0.1)'), 
                        padding: '12px', 
                        borderRadius: '8px', 
                        border: profile.isFrozen ? '1px solid #3b82f6' : (profile.daysLeft < 10 ? '1px solid #d90429' : '1px solid #10b981') 
                    }}>
                        <span style={{ color: profile.isFrozen ? '#3b82f6' : (profile.daysLeft < 10 ? '#d90429' : '#10b981'), fontWeight: 'bold' }}>Kalan Süre:</span>
                        <span style={{ color: profile.isFrozen ? '#3b82f6' : (profile.daysLeft < 10 ? '#d90429' : '#10b981'), fontWeight: '900', fontSize: '1.3rem' }}>
                            {profile.isFrozen ? "DONDURULDU" : `${profile.daysLeft} GÜN`}
                        </span>
                    </div>

                    {/* BORÇ VARSA KABAK GİBİ KIRMIZILIYORUZ */}
                    {Number(profile.totalDebt) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(217, 4, 41, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid #d90429' }}>
                            <span style={{ color: '#d90429', fontWeight: 'bold' }}>Kalan Borcunuz:</span>
                            <span style={{ color: '#d90429', fontWeight: '900', fontSize: '1.2rem' }}>{profile.totalDebt} ₺</span>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default MembershipTab;