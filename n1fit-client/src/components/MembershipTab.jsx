import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Calendar, Snowflake, AlertTriangle } from 'lucide-react';

const MembershipTab = () => {
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('n1fit_token');
        if (!token) return;
        api.get('/Member/my-profile')
           .then(res => setProfile(res.data))
           .catch(err => console.error("Profil çekilemedi:", err));
    }, []);

    if (!profile) return <div style={{ color: '#aaa', textAlign: 'center', marginTop: '50px' }}>Bilgiler toparlanıyor, bekle...</div>;

    const formatDate = (dateString) => {
        if (!dateString) return "Belirsiz";
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = profile.membershipStartDate ? new Date(profile.membershipStartDate) : null;
    if (startDate) startDate.setHours(0, 0, 0, 0);

    const isFuture = startDate && startDate > today;
    const daysUntilStart = isFuture ? Math.ceil((startDate - today) / (1000 * 60 * 60 * 24)) : 0;

    let statusText = '';
    let statusColor = '';

    if (profile.isFrozen) {
        statusText = 'DONDURULDU (BEKLEMEDE)';
        statusColor = '#3b82f6';
    } else if (isFuture) {
        statusText = 'PASİF (BAŞLAMADI)';
        statusColor = '#f59e0b';
    } else if (profile.daysLeft <= 0) {
        statusText = 'PASİF (SÜRESİ BİTMİŞ)';
        statusColor = '#d90429';
    } else {
        statusText = 'AKTİF ÜYE';
        statusColor = '#10b981';
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' }}>

                    <h3 style={{ color: 'white', margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {profile.isFrozen ? <Snowflake size={22} color="#3b82f6" /> : <Calendar size={22} color="#10b981" />}
                        <span>{profile.firstName} {profile.lastName}</span>
                    </h3>

                    <div style={{
                        backgroundColor: statusColor,
                        color: 'white',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontWeight: '900',
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        alignSelf: 'center'
                    }}>
                        {statusText}
                    </div>

                </div>

                <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem' }}>
                    {profile.email}{profile.phoneNumber ? ` • ${profile.phoneNumber}` : ''}
                </p>

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

                {isFuture && (
                    <div style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid #f59e0b',
                        color: '#fcd34d',
                        padding: '12px',
                        borderRadius: '8px',
                        marginTop: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                    }}>
                        <Calendar size={20} />
                        <span>BİLGİ: Üyelik başlangıç tarihin {formatDate(profile.membershipStartDate)}. Başlangıç gününe {daysUntilStart} gün var. O tarihte üyeliğin ve salon kullanımın otomatik olarak aktifleşecektir.</span>
                    </div>
                )}

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

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: profile.isFrozen ? 'rgba(59, 130, 246, 0.1)' : (isFuture ? 'rgba(245, 158, 11, 0.12)' : (profile.daysLeft < 10 ? 'rgba(217, 4, 41, 0.1)' : 'rgba(16, 185, 129, 0.1)')),
                        padding: '12px',
                        borderRadius: '8px',
                        border: profile.isFrozen ? '1px solid #3b82f6' : (isFuture ? '1px solid #f59e0b' : (profile.daysLeft < 10 ? '1px solid #d90429' : '1px solid #10b981'))
                    }}>
                        <span style={{ color: profile.isFrozen ? '#3b82f6' : (isFuture ? '#f59e0b' : (profile.daysLeft < 10 ? '#d90429' : '#10b981')), fontWeight: 'bold' }}>
                            {isFuture ? "Başlama Durumu:" : "Kalan Süre:"}
                        </span>
                        <span style={{ color: profile.isFrozen ? '#3b82f6' : (isFuture ? '#f59e0b' : (profile.daysLeft < 10 ? '#d90429' : '#10b981')), fontWeight: '900', fontSize: isFuture ? '1rem' : '1.3rem' }}>
                            {isFuture ? `${daysUntilStart} GÜN SONRA BAŞLAYACAK` : (profile.isFrozen ? "DONDURULDU" : `${profile.daysLeft} GÜN`)}
                        </span>
                    </div>

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
