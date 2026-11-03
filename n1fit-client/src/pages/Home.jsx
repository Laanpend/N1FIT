import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dumbbell, ChevronRight, ChevronLeft, Zap, ShieldCheck,
    Target, Activity, CheckCircle, Phone, MapPin, Download,
    Clock, Calendar, MessageCircle, ExternalLink, Sparkles,
    Flame, Layers, Gauge, HeartHandshake, Menu, X,
    Star, Sun, Moon, Award, UserCheck, Timer
} from 'lucide-react';
import api from '../api/axiosConfig';
import InstallAppBanner from '../components/InstallAppBanner';
import CampaignPopup from '../components/CampaignPopup';

const InstagramIcon = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
);

const getSiteStyles = (themeConfig = {}) => {
    const themeAccent = themeConfig?.accentColor || '#e50914';
    const themeGlow = themeConfig?.accentGlow || 'rgba(229, 9, 20, 0.4)';
    const cornerStyle = themeConfig?.cornerStyle || 'rounded';
    const navbarStyle = themeConfig?.navbarStyle || 'blur_glass';

    const cardRadius = cornerStyle === 'sharp' ? '4px' : cornerStyle === 'pill' ? '28px' : '16px';
    const btnRadius = cornerStyle === 'sharp' ? '4px' : cornerStyle === 'pill' ? '30px' : '10px';
    const badgeRadius = cornerStyle === 'sharp' ? '4px' : cornerStyle === 'pill' ? '30px' : '20px';
    const smRadius = cornerStyle === 'sharp' ? '2px' : cornerStyle === 'pill' ? '12px' : '6px';
    const avatarRadius = cornerStyle === 'sharp' ? '4px' : '50%';
    const navbarBg = navbarStyle === 'solid_black' ? '#060709' : 'rgba(10, 10, 12, 0.88)';
    const navbarBackdrop = navbarStyle === 'solid_black' ? 'none' : 'blur(16px)';

    const accentBgSubtle = themeAccent.startsWith('#') ? `${themeAccent}18` : 'rgba(229, 9, 20, 0.12)';
    const accentBgMedium = themeAccent.startsWith('#') ? `${themeAccent}25` : 'rgba(229, 9, 20, 0.2)';
    const accentBorder = themeAccent.startsWith('#') ? `${themeAccent}55` : 'rgba(229, 9, 20, 0.4)';

    return {
        container: {
            minHeight: '100vh',
            backgroundColor: '#08090a',
            color: '#edf2f4',
            fontFamily: "'Inter', sans-serif",
            overflowX: 'hidden',
            width: '100%',
            maxWidth: '100vw',
            boxSizing: 'border-box'
        },
        webNavbar: {
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            backgroundColor: navbarBg,
            backdropFilter: navbarBackdrop,
            WebkitBackdropFilter: navbarBackdrop,
            borderBottom: '1px solid #1f2228',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 4%',
            boxSizing: 'border-box',
            width: '100%'
        },
        navLeft: { display: 'flex', alignItems: 'center', gap: '30px' },
        logo: {
            fontSize: '1.9rem',
            fontWeight: '900',
            letterSpacing: '1px',
            cursor: 'pointer',
            color: '#fff'
        },
        navLinksDesktop: { display: 'flex', gap: '22px', alignItems: 'center' },
        navLinkBtn: {
            background: 'none',
            border: 'none',
            color: '#aaa',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'color 0.2s',
            padding: '6px 8px'
        },
        navRight: { display: 'flex', alignItems: 'center', gap: '12px' },
        navContactBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(37, 211, 102, 0.15)',
            color: '#25D366',
            border: '1px solid rgba(37, 211, 102, 0.4)',
            padding: '9px 18px',
            borderRadius: btnRadius,
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.85rem'
        },
        navInstallBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: accentBgSubtle,
            color: themeAccent,
            border: `1px solid ${accentBorder}`,
            padding: '8px 14px',
            borderRadius: btnRadius,
            fontSize: '0.82rem',
            fontWeight: 'bold',
            cursor: 'pointer'
        },
        navLoginBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: themeAccent,
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: btnRadius,
            fontSize: '0.82rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: `0 4px 14px ${themeGlow}`
        },
        navMemberBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#16a34a',
            color: 'white',
            border: '1px solid #4ade80',
            padding: '8px 14px',
            borderRadius: btnRadius,
            fontSize: '0.82rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(22, 163, 74, 0.4)'
        },
        hero: {
            position: 'relative',
            minHeight: '85vh',
            display: 'flex',
            alignItems: 'center',
            backgroundImage: 'linear-gradient(to right, rgba(8,9,10,0.96) 25%, rgba(8,9,10,0.72) 70%, rgba(8,9,10,0.92) 100%), url("/SalonunFotolari/Salon1.jpeg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderBottom: '1px solid #1a1c22',
            padding: '60px 0'
        },
        overlay: { width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '40px 5%', boxSizing: 'border-box' },
        eyebrowContainer: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: accentBgSubtle,
            border: `1px solid ${accentBorder}`,
            padding: '6px 16px',
            borderRadius: badgeRadius,
            marginBottom: '20px'
        },
        eyebrowPulse: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: themeAccent, boxShadow: `0 0 10px ${themeAccent}` },
        eyebrow: { color: themeAccent, fontWeight: 'bold', letterSpacing: '1.5px', fontSize: '0.78rem', textTransform: 'uppercase' },
        title: { fontSize: '3.6rem', fontWeight: '900', lineHeight: 1.1, margin: 0, letterSpacing: '-1px' },
        titleAccent: {
            color: themeAccent,
            textShadow: `0 0 30px ${themeGlow}`
        },
        subtitle: { fontSize: '1.15rem', color: '#bbb', maxWidth: '640px', margin: '22px 0 32px 0', lineHeight: 1.7 },
        btnGroup: { display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' },
        mainBtn: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: themeAccent,
            color: 'white',
            border: 'none',
            padding: '14px 28px',
            borderRadius: btnRadius,
            fontWeight: '900',
            cursor: 'pointer',
            fontSize: '0.98rem',
            letterSpacing: '0.5px',
            boxShadow: `0 8px 25px ${themeGlow}`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            textDecoration: 'none'
        },
        secondaryBtn: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            color: '#fff',
            border: `1px solid ${accentBorder}`,
            padding: '14px 24px',
            borderRadius: btnRadius,
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'background-color 0.2s',
            textDecoration: 'none'
        },
        whatsAppBtn: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(37, 211, 102, 0.15)',
            color: '#4ade80',
            border: '1px solid rgba(37, 211, 102, 0.4)',
            padding: '14px 22px',
            borderRadius: btnRadius,
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.95rem',
            textDecoration: 'none'
        },
        statGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginTop: '55px',
            paddingTop: '35px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        },
        statCard: {
            backgroundColor: 'rgba(18, 19, 23, 0.85)',
            border: '1px solid #23272f',
            borderRadius: cardRadius,
            padding: '20px',
            boxSizing: 'border-box'
        },
        statNumber: { fontSize: '2rem', fontWeight: '900', color: themeAccent },
        statLabel: { fontSize: '0.82rem', color: '#aaa', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.8px' },
        appSection: {
            padding: '70px 0',
            backgroundColor: '#0a0b0e',
            borderTop: '1px solid #1a1c22',
            borderBottom: '1px solid #1a1c22'
        },
        appContainer: {
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 5%',
            display: 'flex',
            alignItems: 'center',
            gap: '60px',
            boxSizing: 'border-box'
        },
        appLeft: { flex: '1.2' },
        appBadge: {
            display: 'inline-block',
            fontSize: '0.75rem',
            fontWeight: '900',
            color: themeAccent,
            letterSpacing: '1.5px',
            marginBottom: '12px',
            textTransform: 'uppercase',
            backgroundColor: accentBgSubtle,
            border: `1px solid ${accentBorder}`,
            padding: '4px 12px',
            borderRadius: badgeRadius
        },
        appTitle: { fontSize: '2.5rem', fontWeight: '900', margin: '0 0 16px 0', lineHeight: 1.2, color: '#fff' },
        appParagraph: { color: '#aaa', fontSize: '1.02rem', lineHeight: 1.7, margin: 0 },
        appFeatureGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '30px 0' },
        appFeatureItem: { display: 'flex', gap: '14px', alignItems: 'flex-start' },
        appFeatureIcon: {
            padding: '10px',
            backgroundColor: accentBgSubtle,
            borderRadius: btnRadius,
            border: `1px solid ${accentBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
        },
        appFeatureTitle: { margin: '0 0 4px 0', fontSize: '0.98rem', fontWeight: 'bold', color: '#fff' },
        appFeatureDesc: { margin: 0, fontSize: '0.82rem', color: '#888', lineHeight: 1.5 },
        appDownloadRow: { display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' },
        appInstallBtnHero: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: themeAccent,
            color: '#fff',
            padding: '13px 24px',
            borderRadius: btnRadius,
            fontWeight: 'bold',
            fontSize: '0.92rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: `0 6px 20px ${themeGlow}`
        },
        appLoginDirectBtn: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#16181d',
            color: '#ccc',
            border: '1px solid #2b2f38',
            padding: '13px 20px',
            borderRadius: btnRadius,
            fontWeight: 'bold',
            fontSize: '0.92rem',
            cursor: 'pointer'
        },
        appRight: { flex: '0.8', display: 'flex', justifyContent: 'center' },
        phoneMockup: {
            width: '260px',
            height: '460px',
            backgroundColor: '#000',
            borderRadius: cornerStyle === 'sharp' ? '8px' : '42px',
            border: '5px solid #23272f',
            padding: '12px',
            boxShadow: `0 25px 60px ${themeGlow}`,
            position: 'relative',
            boxSizing: 'border-box'
        },
        phoneSpeaker: {
            width: '60px',
            height: '4px',
            backgroundColor: '#222',
            borderRadius: smRadius,
            margin: '0 auto 12px auto'
        },
        phoneScreen: {
            backgroundColor: '#101216',
            borderRadius: cornerStyle === 'sharp' ? '6px' : '30px',
            height: 'calc(100% - 16px)',
            padding: '16px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid #1f2228'
        },
        phoneHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #1c1e24' },
        phoneBody: { display: 'flex', flexDirection: 'column', gap: '12px' },
        phoneGreeting: { backgroundColor: accentBgSubtle, padding: '10px', borderRadius: btnRadius, border: `1px solid ${accentBorder}` },
        phoneCard: { backgroundColor: '#181a20', padding: '10px', borderRadius: cardRadius, border: '1px solid #23272f' },
        phoneBtn: { backgroundColor: themeAccent, color: '#fff', textAlign: 'center', padding: '8px', borderRadius: smRadius, fontSize: '0.75rem', fontWeight: 'bold' },
        sectionPadding: { padding: '75px 0' },
        maxContainer: { maxWidth: '1200px', margin: '0 auto', padding: '0 5%', boxSizing: 'border-box' },
        sectionEyebrow: { color: themeAccent, fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '1.5px', marginBottom: '8px', textTransform: 'uppercase' },
        sectionTitle: { fontSize: '2.5rem', fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.5px', margin: '0 0 16px 0' },
        paragraph: { fontSize: '1.05rem', color: '#aaa', lineHeight: 1.8, margin: 0 },
        missionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '26px' },
        missionCard: { backgroundColor: '#111317', padding: '32px 26px', borderRadius: cardRadius, border: '1px solid #1f232b', boxSizing: 'border-box' },
        missionTitle: { fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', marginBottom: '12px' },
        missionDesc: { fontSize: '0.92rem', color: '#999', lineHeight: 1.7, margin: 0 },
        filterTabContainer: { display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '40px' },
        filterTabBtn: {
            padding: '10px 22px',
            backgroundColor: '#16181d',
            color: '#aaa',
            border: '1px solid #282c36',
            borderRadius: btnRadius,
            fontWeight: 'bold',
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
        },
        filterTabBtnActive: {
            backgroundColor: themeAccent,
            color: '#fff',
            borderColor: themeAccent,
            boxShadow: `0 4px 15px ${themeGlow}`
        },
        equipmentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '26px' },
        equipmentCard: { backgroundColor: '#121418', borderRadius: cardRadius, border: '1px solid #232730', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        equipmentImgWrapper: { width: '100%', height: '220px', position: 'relative', overflow: 'hidden' },
        equipmentImg: { width: '100%', height: '100%', objectFit: 'cover' },
        equipmentBadge: { position: 'absolute', top: '12px', left: '12px', backgroundColor: accentBgMedium, border: `1px solid ${accentBorder}`, color: themeAccent, padding: '4px 10px', borderRadius: badgeRadius, fontSize: '0.72rem', fontWeight: 'bold' },
        equipmentBody: { padding: '22px', display: 'flex', flexDirection: 'column', flex: 1 },
        equipmentCardTitle: { fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', margin: '0 0 8px 0' },
        equipmentCardDesc: { fontSize: '0.85rem', color: '#888', lineHeight: 1.6, margin: 0 },
        sliderContainer: { position: 'relative', width: '100%', maxWidth: '450px', aspectRatio: '3/4', margin: '0 auto', overflow: 'hidden', borderRadius: cardRadius },
        sliderImageWrapper: { width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: cardRadius },
        sliderImage: { width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, borderRadius: cardRadius },
        sliderBtnLeft: { position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', zIndex: 10 },
        sliderBtnRight: { position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', zIndex: 10 },
        sliderDots: { position: 'absolute', bottom: '12px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '6px', zIndex: 10 },
        dot: { width: '8px', height: '8px', borderRadius: '50%', transition: 'all 0.3s' },
        hoursGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' },
        hoursCard: { backgroundColor: '#111317', padding: '32px 28px', borderRadius: cardRadius, border: '1px solid #1f232b', boxSizing: 'border-box' },
        hoursHeader: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' },
        hoursCardTitle: { fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', margin: 0 },
        hoursItemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #1b1e26' },
        hoursDay: { fontSize: '0.92rem', color: '#ccc' },
        hoursTime: { fontSize: '0.95rem', fontWeight: 'bold', color: '#fff' },
        hoursSpecialNote: {
            marginTop: '22px',
            backgroundColor: accentBgSubtle,
            border: `1px solid ${accentBorder}`,
            borderRadius: cardRadius,
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        packageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' },
        packageCard: {
            backgroundColor: '#121418',
            border: '1px solid #262933',
            borderRadius: cardRadius,
            padding: '36px 28px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            boxSizing: 'border-box'
        },
        pkgBadge: {
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: accentBgMedium,
            color: themeAccent,
            border: `1px solid ${themeAccent}`,
            padding: '4px 14px',
            borderRadius: badgeRadius,
            fontSize: '0.72rem',
            fontWeight: 'bold',
            letterSpacing: '1px',
            textTransform: 'uppercase'
        },
        pkgType: { color: '#fff', fontSize: '1.3rem', fontWeight: '900', margin: '0 0 10px 0' },
        pkgPrice: { fontSize: '2.5rem', fontWeight: '900', margin: '14px 0', color: '#fff' },
        pkgDivider: { borderColor: '#23272f', marginBottom: '18px' },
        pkgFeatures: { listStyle: 'none', padding: 0, color: '#aaa', fontSize: '0.88rem', lineHeight: 2.2, marginBottom: '28px', flex: 1 },
        pkgBtn: {
            display: 'block',
            textAlign: 'center',
            backgroundColor: '#25D366',
            color: '#000',
            border: 'none',
            padding: '14px',
            borderRadius: btnRadius,
            fontWeight: '900',
            cursor: 'pointer',
            fontSize: '0.95rem',
            textDecoration: 'none'
        },
        contactWrapper: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '30px' },
        contactCard: { backgroundColor: '#111317', padding: '36px 30px', borderRadius: cardRadius, border: '1px solid #1f232b', boxSizing: 'border-box' },
        contactRow: { display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '22px' },
        whatsAppLeadBtn: {
            width: '100%',
            backgroundColor: '#25D366',
            color: '#000',
            padding: '15px',
            borderRadius: btnRadius,
            border: 'none',
            fontWeight: '900',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginTop: '10px',
            boxSizing: 'border-box'
        },
        mapCard: {
            backgroundColor: '#111317',
            padding: '36px 30px',
            borderRadius: cardRadius,
            border: '1px solid #23272f',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            justifyContent: 'center'
        },
        mapNavBtn: {
            marginTop: '22px',
            backgroundColor: accentBgSubtle,
            color: themeAccent,
            border: `1px solid ${themeAccent}`,
            padding: '12px 24px',
            borderRadius: btnRadius,
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxSizing: 'border-box'
        },
        footer: { backgroundColor: '#050506', borderTop: '1px solid #1a1c22', padding: '40px 20px', textAlign: 'center' },
        footerContent: { maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' },
        footerLogo: { fontSize: '2.2rem', fontWeight: '900', letterSpacing: '2px', color: '#fff', marginBottom: '8px', cursor: 'pointer' },
        footerText: { color: '#666', fontSize: '0.95rem', fontStyle: 'italic', marginBottom: '16px' },
        footerSocials: { display: 'flex', gap: '12px', marginBottom: '20px' },
        footerSocialIconBtn: {
            width: '42px',
            height: '42px',
            borderRadius: cornerStyle === 'sharp' ? '4px' : '50%',
            backgroundColor: '#14161d',
            border: '1px solid #282c38',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
        },
        footerSocialLink: { color: '#bbb', textDecoration: 'none', fontSize: '0.88rem' },
        copyright: { color: '#444', fontSize: '0.82rem' }
    };
};

const defaultStyles = getSiteStyles({});

const CountdownTimer = ({ targetDate, onFinish, radius = '8px' }) => {
    const calculateTimeLeft = () => {
        if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: true };
        const difference = +new Date(targetDate) - +new Date();
        if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: true };

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
            isFinished: false
        };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            const tl = calculateTimeLeft();
            setTimeLeft(tl);
            if (tl.isFinished && onFinish) onFinish();
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[
                { label: 'GÜN', val: timeLeft.days },
                { label: 'SAAT', val: timeLeft.hours },
                { label: 'DAKİKA', val: timeLeft.minutes },
                { label: 'SANİYE', val: timeLeft.seconds }
            ].map((slot, i) => (
                <div key={i} style={{
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    minWidth: '44px',
                    textAlign: 'center'
                }}>
                    <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '900', lineHeight: 1 }}>
                        {String(slot.val).padStart(2, '0')}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.62rem', fontWeight: '800', marginTop: '2px' }}>
                        {slot.label}
                    </div>
                </div>
            ))}
        </div>
    );
};

const BeforeAfterSlider = ({ beforeImg, afterImg, labelBefore = "ÖNCESİ", labelAfter = "SONRASI", radius = '16px', badgeRadius = '8px', accentColor = '#e50914' }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = React.useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleMove = (clientX) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        let percentage = (x / rect.width) * 100;
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;
        setSliderPos(percentage);
    };

    const handleTouchMove = (e) => {
        if (e.touches && e.touches[0]) {
            handleMove(e.touches[0].clientX);
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            handleMove(e.clientX);
        }
    };

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                height: '380px',
                borderRadius: '16px',
                overflow: 'hidden',
                userSelect: 'none',
                cursor: 'ew-resize',
                border: '1px solid #232736',
                boxShadow: '0 15px 35px rgba(0,0,0,0.5)'
            }}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onClick={(e) => handleMove(e.clientX)}
        >
            {/* Sonrası (Arka Katman) */}
            <img
                src={afterImg || '/SalonunFotolari/Salon3.jpeg'}
                alt={labelAfter}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
                position: 'absolute',
                top: 14,
                right: 14,
                backgroundColor: 'rgba(16, 185, 129, 0.9)',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: '900',
                padding: '4px 10px',
                borderRadius: '8px',
                letterSpacing: '1px',
                zIndex: 2
            }}>
                {labelAfter}
            </div>

            {/* Öncesi (Kırpılmış Üst Katman) */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: `${sliderPos}%`,
                overflow: 'hidden',
                borderRight: '3px solid #fff',
                boxShadow: '2px 0 10px rgba(0,0,0,0.5)'
            }}>
                <img
                    src={beforeImg || '/SalonunFotolari/Salon2.jpeg'}
                    alt={labelBefore}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: containerRef.current ? containerRef.current.clientWidth : '100%',
                        height: '100%',
                        objectFit: 'cover',
                        maxWidth: 'none'
                    }}
                />
                <div style={{
                    position: 'absolute',
                    top: 14,
                    left: 14,
                    backgroundColor: 'rgba(229, 9, 20, 0.9)',
                    color: '#fff',
                    fontSize: '0.72rem',
                    fontWeight: '900',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    letterSpacing: '1px'
                }}>
                    {labelBefore}
                </div>
            </div>

            {/* Sürgü Tutamağı (Handle) */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: `${sliderPos}%`,
                transform: 'translate(-50%, -50%)',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', gap: '3px' }}>
                    <span style={{ width: '2px', height: '14px', backgroundColor: '#222' }} />
                    <span style={{ width: '2px', height: '14px', backgroundColor: '#222' }} />
                </div>
            </div>
        </div>
    );
};


const WhatsAppIcon = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
);

const YouTubeIcon = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill={color}></polygon>
    </svg>
);


const AutoSlider = ({ images, styles: customStyles }) => {
    const s = customStyles || (typeof styles !== 'undefined' ? styles : defaultStyles);
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
        <div style={s.sliderContainer}>
            <button onClick={prevSlide} style={s.sliderBtnLeft} aria-label="Önceki Fotoğraf">
                <ChevronLeft size={28} color="white" />
            </button>
            <div style={s.sliderImageWrapper}>
                {images.map((img, idx) => {
                    const isNearby = Math.abs(idx - currentIndex) <= 1 || (currentIndex === 0 && idx === images.length - 1) || (currentIndex === images.length - 1 && idx === 0);
                    return (
                        <img
                            key={idx}
                            src={img}
                            alt={`N1FIT Spor Salonu Fotoğraf ${idx + 1}`}
                            loading={idx === 0 ? "eager" : "lazy"}
                            decoding="async"
                            style={{
                                ...s.sliderImage,
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                opacity: idx === currentIndex ? 1 : 0,
                                transition: 'opacity 0.6s ease-in-out',
                                willChange: 'opacity',
                                display: isNearby ? 'block' : 'none',
                                transform: 'translateZ(0)'
                            }}
                        />
                    );
                })}
            </div>
            <button onClick={nextSlide} style={s.sliderBtnRight} aria-label="Sonraki Fotoğraf">
                <ChevronRight size={28} color="white" />
            </button>
            <div style={s.sliderDots}>
                {images.map((_, idx) => (
                    <div
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        style={{
                            ...s.dot,
                            backgroundColor: idx === currentIndex ? '#d90429' : 'rgba(255,255,255,0.3)',
                            transform: idx === currentIndex ? 'scale(1.2)' : 'scale(1)'
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

const Home = () => {
    const [packages, setPackages] = useState([]);
    const [facilities, setFacilities] = useState(null);
    const [activeEquipTab, setActiveEquipTab] = useState('all');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState(0);

    // Ücretsiz Tanışma / Ön Kayıt Lead Formu State'i
    const [leadForm, setLeadForm] = useState({
        fullName: '',
        phone: '',
        goal: 'Kilo Verme & Yağ Yakımı',
        preferredTime: 'Akşam (18:00 - 23:00)',
        note: ''
    });
    const [leadSubmitting, setLeadSubmitting] = useState(false);
    const [leadSuccess, setLeadSuccess] = useState('');
    const [leadError, setLeadError] = useState('');

    // Dinamik Stüdyo Konteynırları & Pop-up Yapılandırması (Önbellekli Başlatma - Milisaniyelik Sıçramaları Engeller)
    const [siteStudio, setSiteStudio] = useState(() => {
        try {
            const cached = localStorage.getItem('n1fit_site_studio_cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed && parsed.containers?.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            // LocalStorage hatası durumunda varsayılanla devam
        }
        return {
        containers: [
            { id: 'hero-main', type: 'HERO', order: 1, isActive: true },
            { id: 'app-body-main', type: 'APP_BODY', order: 2, isActive: true },
            { id: 'about-main', type: 'ABOUT', order: 3, isActive: true },
            {
                id: 'before-after-main',
                type: 'BEFORE_AFTER',
                order: 4,
                isActive: true,
                title: 'DEĞİŞİM HİKAYELERİ & BAŞARI',
                subtitle: 'Disiplin ve doğru antrenman programlamasıyla üyelerimizin elde ettiği gerçek sonuçlar.',
                badgeText: 'ÖNCESİ / SONRASI',
                items: [
                    {
                        id: 1,
                        title: 'Murat S. - 3 Ayda 14 Kg Yağ Kaybı',
                        tag: 'Definasyon & Sıkılaşma',
                        description: 'Kişisel beslenme ve haftada 4 gün hipertrofi programı ile ulaşılan başarı hikayesi.',
                        imageUrl: '/SalonunFotolari/Salon2.jpeg',
                        extraInfo: '/SalonunFotolari/Salon3.jpeg'
                    },
                    {
                        id: 2,
                        title: 'Ayşe T. - Postür & Kuvvet Artışı',
                        tag: 'Kadın Seansı & Pilates',
                        description: 'Kadınlara özel seanslarda skolyoz rahatsızlığıma yönelik güçlenme ve sıkılaşma.',
                        imageUrl: '/SalonunFotolari/Salon6.jpeg',
                        extraInfo: '/SalonunFotolari/Salon7.jpeg'
                    }
                ]
            },
            {
                id: 'reviews-main',
                type: 'REVIEWS',
                order: 5,
                isActive: true,
                title: 'ÜYELERİMİZ NELER SÖYLÜYOR?',
                subtitle: 'Google Haritalar 4.9 Puan ve 150+ Gerçek Üye Değerlendirmesi.',
                badgeText: 'GERÇEK KULLANICI DENEYİMLERİ',
                items: [
                    {
                        id: 1,
                        title: 'Ahmet Karadeniz',
                        subtitle: '1 Yıldır N1FIT Üyesi',
                        description: 'Gölyaka bölgesinde ekipman kalitesi ve temizlik anlamında rakipsiz. Antrenörlerin ilgisi ve bilimsel yaklaşımı harika.',
                        extraInfo: '5'
                    },
                    {
                        id: 2,
                        title: 'Zeynep Yılmaz',
                        subtitle: 'Kadın Seansı Üyesi',
                        description: 'Kadınlara özel seans saatleri çok rahat ve güvenli. Tesis çok havadar ve hijyenik, herkese tavsiye ederim.',
                        extraInfo: '5'
                    },
                    {
                        id: 3,
                        title: 'Emre Aydın',
                        subtitle: 'Yarışmacı Sporcu',
                        description: 'Dumbell ağırlık parkuru ve biyomekanik Leg Press makinesi profesyoneller için tam standartta.',
                        extraInfo: '5'
                    }
                ]
            },
            {
                id: 'trainers-main',
                type: 'TRAINERS',
                order: 6,
                isActive: true,
                title: 'UZMAN ANTRENÖR KADROMUZ',
                subtitle: 'Biyomekanik ve hipertrofi alanında akademik temelli profesyonel koçlar.',
                badgeText: 'PROFESYONEL EKİP',
                items: [
                    {
                        id: 1,
                        title: 'Berkay İsak',
                        subtitle: 'Baş Antrenör & Kurucu',
                        tag: 'Biyomekanik • Hipertrofi • Anatomi',
                        description: '15 yıllık saha tecrübesi, yarışma hazırlığı ve sporcu anatomisi uzmanlığı.',
                        imageUrl: '/SalonunFotolari/Salon1.jpeg',
                        buttonText: 'Instagram: @berkayisak',
                        buttonLink: 'https://instagram.com/n1fitspormerkezi'
                    }
                ]
            },
            { id: 'equipment-main', type: 'EQUIPMENT_GALLERY', order: 7, isActive: true },
            {
                id: 'hours-main',
                type: 'HOURS',
                order: 8,
                isActive: true,
                showWeeklyTable: true,
                weeklySchedule: [
                    { day: 'Pazartesi', generalHours: '09:00 - 23:00', womenHours: '', hasWomenSession: false, note: 'Tüm gün genel kullanım' },
                    { day: 'Salı', generalHours: '09:00 - 23:00', womenHours: '', hasWomenSession: false, note: 'Tüm gün genel kullanım' },
                    { day: 'Çarşamba', generalHours: '20:00 - 23:00', womenHours: '09:00 - 20:00', hasWomenSession: true, note: '20:00 sonrası karma / genel' },
                    { day: 'Perşembe', generalHours: '09:00 - 23:00', womenHours: '', hasWomenSession: false, note: 'Tüm gün genel kullanım' },
                    { day: 'Cuma', generalHours: '09:00 - 18:00', womenHours: '18:00 - 23:00', hasWomenSession: true, note: '18:00 sonrası kadınlara özel' },
                    { day: 'Cumartesi', generalHours: '09:00 - 23:00', womenHours: '', hasWomenSession: false, note: 'Tüm gün genel kullanım' },
                    { day: 'Pazar', generalHours: '17:00 - 23:00', womenHours: '09:00 - 17:00', hasWomenSession: true, note: '17:00 sonrası karma / genel' }
                ]
            },
            { id: 'packages-main', type: 'PACKAGES', order: 9, isActive: true, autoSyncPackages: true },
            {
                id: 'special-main',
                type: 'SPECIAL_CUSTOM',
                order: 10,
                isActive: true,
                layoutMode: 'two_column',
                columns: 2,
                title: 'N1FIT ÖZEL BLOG & BİLİMSEL SPOR KÜLTÜRÜ',
                subtitle: 'Bilinçli spor, doğru beslenme ve sakatlıktan koruyan biyomekanik ilkeler.',
                badgeText: 'BİLGİ MERKEZİ',
                description: 'N1FIT olarak Gölyaka\'da sadece antrenman yaptırmıyoruz; sporcularımıza vücutlarını nasıl dinlemeleri gerektiğini, hangi hareketin hangi kasa odaklandığını ve sürdürülebilir beslenmeyi öğretiyoruz.',
                backgroundImage: '/SalonunFotolari/Salon4.jpeg',
                primaryButtonText: 'Paketleri İncele',
                primaryButtonLink: '#packages',
                items: [
                    {
                        id: 1,
                        title: 'Biyomekanik Açıların Önemi',
                        tag: 'Güvenli Egzersiz',
                        description: 'Eklemlere sıfır aşırı yük, kas fiberlerine maksimum gerilim ile sakatlıksız gelişim.',
                        buttonText: 'Detaylı Bilgi',
                        buttonLink: '#about'
                    },
                    {
                        id: 2,
                        title: 'Mifflin-St Jeor Beslenme Takibi',
                        tag: 'Kişisel Diyet',
                        description: 'Her üyenin bazal metabolizma hızına uygun kalori ve protein dağılımı.',
                        buttonText: 'Beslenme Modülü',
                        buttonLink: '/login'
                    }
                ]
            },
            {
                id: 'faq-main',
                type: 'FAQ',
                order: 11,
                isActive: true,
                title: 'SIKÇA SORULAN SORULAR',
                subtitle: 'Üyelik, kadınlara özel seanslar, antrenman programları ve salon kuralları hakkında merak ettikleriniz.',
                badgeText: 'MERAK EDİLENLER',
                items: [
                    {
                        id: 1,
                        title: 'Spora yeni başlıyorum, antrenman ve beslenme programı veriliyor mu?',
                        tag: 'Program & İlgi',
                        description: 'Evet! Kayıt olduğunuz ilk gün vücut analiziniz yapılır, hedefinize uygun antrenman programınız ve Mifflin-St Jeor tabanlı kişisel beslenme planınız N1FIT Mobil Uygulamasına tanımlanır.'
                    },
                    {
                        id: 2,
                        title: 'Kadınlara özel seans saatlerinde salonda erkek üye veya personel oluyor mu?',
                        tag: 'Kadın Seansları',
                        description: 'Kadınlara özel seans saatlerimizde (Çarşamba 09:00-20:00, Cuma 18:00-23:00, Pazar 09:00-17:00) salonumuz yalnızca kadın üyelerimizin kullanımına ayrılmaktadır.'
                    },
                    {
                        id: 3,
                        title: 'Üyeliğimi dondurma (askıya alma) hakkım var mı?',
                        tag: 'Üyelik Hakları',
                        description: 'Uzun dönemli (3, 6 ve 12 aylık) paketlerimizde hastalık, şehir dışı seyahat veya sınav dönemleri için üyelik dondurma hakkınız bulunmaktadır.'
                    },
                    {
                        id: 4,
                        title: 'Salona gelirken yanımda neler getirmeliyim?',
                        tag: 'Salon Kuralları',
                        description: 'Hijyen standartlarımız gereği dışarıda giyilmemiş temiz tabanlı spor ayakkabısı ve antrenman havlusu getirmeniz zorunludur. Kilitli dolaplar ve duş alanlarımız ücretsizdir.'
                    }
                ]
            },
            { id: 'contact-main', type: 'CONTACT', order: 12, isActive: true }
        ],
        popupConfig: { enabled: false },
        brandConfig: {
            logoUrl: '',
            brandNamePrefix: 'N1',
            brandNameAccent: 'FIT',
            displayMode: 'logo_and_text',
            instagramUrl: 'https://www.instagram.com/n1fitspormerkezi/',
            whatsAppNumber: '905396078154',
            youTubeUrl: 'https://www.youtube.com/@N1F%C4%B0TSPORMERKEZ%C4%B0',
            floatingWhatsAppEnabled: true,
            floatingWhatsAppText: 'Bize Ulaşın • WhatsApp',
            floatingWhatsAppMessage: 'Merhaba, N1FIT Spor Merkezi üyelik paketleri ve ücretsiz tanışma antrenmanı hakkında bilgi almak istiyorum.',
            floatingWhatsAppShowOnMobile: true
        },
        topBarConfig: {
            enabled: false,
            badgeText: 'DUYURU',
            text: '🌸 Kadınlara Özel Seanslar: Çarşamba 09:00-20:00 | Cuma 18:00-23:00 | Pazar 09:00-17:00 • Ücretsiz Tanışma Antrenmanı İçin Formu Doldurun!',
            backgroundColor: '#111520',
            textColor: '#ffffff',
            scrollingMarquee: false,
            buttonText: 'Ön Kayıt Ol',
            buttonLink: '#contact'
        },
        countdownConfig: {
            enabled: false,
            badgeText: 'SINIRLI SÜRE',
            title: 'YENİ SEZON ERKEN KAYIT İNDİRİMİ',
            subtitle: 'Kontenjanlar dolmadan önce avantajlı üyelik fırsatını yakalayın!',
            targetDate: '2026-12-01T23:59:59',
            buttonText: 'Fırsatı Yakala',
            buttonLink: '#packages',
            backgroundColor: '#990000'
        },
        greetingConfig: {
            enabled: true,
            morningGreeting: 'Güne Güçlü ve Enerjik Başla, Gölyaka!',
            afternoonGreeting: 'Günün Zirve Performansını Yakala!',
            eveningGreeting: 'Günün Yorgunluğunu ve Stresini Salonda Bırak!',
            nightGreeting: 'Yarın İçin Hazırlan, Hedeflerinden Asla Vazgeçme!'
        },
        seoConfig: {
            metaTitle: "N1FIT Spor Merkezi | Gölyaka Fitness & Vücut Geliştirme",
            metaDescription: "Bilimsel antrenman, profesyonel ekipmanlar, kadınlara özel seanslar ve 15 yıllık tecrübeyle Gölyaka'da fitness standartlarını yükseltiyoruz.",
            keywords: "gölyaka spor salonu, düzce fitness, n1fit, vücut geliştirme, kadın seansları, kişisel antrenör",
            ogTitle: "N1FIT Spor Merkezi Gölyaka",
            ogDescription: "Bilimin, disiplinin ve 15 yıllık tecrübenin buluştuğu yer. Hemen keşfedin!",
            ogImageUrl: "/SalonunFotolari/Salon1.jpeg",
            canonicalUrl: "https://n1fit.com.tr",
            structuredDataEnabled: true
        },
        themeConfig: {
            preset: 'red_power',
            accentColor: '#e50914',
            accentGlow: 'rgba(229, 9, 20, 0.4)',
            backgroundPattern: 'carbon_fiber',
            cornerStyle: 'rounded',
            navbarStyle: 'blur_glass'
        }
    };
});

    // DİNAMİK TEMA MOTORU DEĞİŞKENLERİ
    const themeConfig = siteStudio.themeConfig || {};
    const themeAccent = themeConfig.accentColor || '#e50914';
    const themeGlow = themeConfig.accentGlow || 'rgba(229, 9, 20, 0.4)';
    const cornerStyle = themeConfig.cornerStyle || 'rounded';
    const navbarStyle = themeConfig.navbarStyle || 'blur_glass';
    const backgroundPattern = themeConfig.backgroundPattern || 'carbon_fiber';

    const cardRadius = cornerStyle === 'sharp' ? '4px' : cornerStyle === 'pill' ? '28px' : '16px';
    const btnRadius = cornerStyle === 'sharp' ? '4px' : cornerStyle === 'pill' ? '30px' : '10px';
    const badgeRadius = cornerStyle === 'sharp' ? '4px' : cornerStyle === 'pill' ? '30px' : '20px';
    const smRadius = cornerStyle === 'sharp' ? '2px' : cornerStyle === 'pill' ? '12px' : '6px';
    const avatarRadius = cornerStyle === 'sharp' ? '4px' : '50%';

    const styles = useMemo(() => getSiteStyles(siteStudio.themeConfig), [siteStudio.themeConfig]);

    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    useEffect(() => {
        const handleHashScroll = () => {
            if (window.location.hash) {
                const targetId = window.location.hash.replace('#', '');
                setTimeout(() => {
                    const el = document.getElementById(targetId);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 300);
            }
        };

        handleHashScroll();
        window.addEventListener('hashchange', handleHashScroll);
        return () => window.removeEventListener('hashchange', handleHashScroll);
    }, [siteStudio.containers, packages.length]);

    const defaultGymImages = [
        "/SalonunFotolari/Salon1.jpeg?v=2", "/SalonunFotolari/Salon2.jpeg?v=2", "/SalonunFotolari/Salon3.jpeg?v=2",
        "/SalonunFotolari/Salon4.jpeg?v=2", "/SalonunFotolari/Salon5.jpeg?v=2", "/SalonunFotolari/Salon6.jpeg?v=2",
        "/SalonunFotolari/Salon7.jpeg?v=2", "/SalonunFotolari/Salon8.jpeg?v=2", "/SalonunFotolari/Salon9.jpeg?v=2",
        "/SalonunFotolari/Salon10.jpeg?v=2"
    ];

    useEffect(() => {
        // Web sitesinde sergilenmesi için adminin vitrine açtığı paketleri çek
        api.get('/Member/packages')
            .then(res => setPackages(res.data || []))
            .catch(err => console.error("Paketler çekilemedi:", err));

        // Adminin düzenlediği ekipman kartları ve salon fotoğraflarını çek
        api.get('/Member/facilities')
            .then(res => {
                if (res.data) setFacilities(res.data);
            })
            .catch(err => console.log("Tesis yapılandırması çekilemedi, varsayılanlar devrede:", err));

        // Dinamik Stüdyo Konteynırlarını ve Karşılama Pop-up'ını Çek (Önbelleğe yaz - Gelecek açılışlarda 0ms sıçramasız yükleme)
        api.get('/Admin/public/site-studio')
            .then(res => {
                if (res.data && res.data.containers?.length > 0) {
                    setSiteStudio(res.data);
                    try {
                        localStorage.setItem('n1fit_site_studio_cache', JSON.stringify(res.data));
                    } catch (e) {
                        // ignore quota error
                    }
                }
            })
            .catch(err => console.log("Site Studio verisi çekilemedi, varsayılan şablon devrede:", err));
    }, []);

    // SEO, OpenGraph ve Schema.org Entegrasyonu (Doğrudan Backend ve Frontend Senkronizasyonu)
    useEffect(() => {
        if (!siteStudio || !siteStudio.seoConfig) return;
        const seo = siteStudio.seoConfig;

        // 1. Title
        if (seo.metaTitle) {
            document.title = seo.metaTitle;
        }

        // 2. Meta description
        if (seo.metaDescription) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', seo.metaDescription);
        }

        // 3. Keywords
        if (seo.keywords) {
            let metaKw = document.querySelector('meta[name="keywords"]');
            if (!metaKw) {
                metaKw = document.createElement('meta');
                metaKw.setAttribute('name', 'keywords');
                document.head.appendChild(metaKw);
            }
            metaKw.setAttribute('content', seo.keywords);
        }

        // 4. OpenGraph tags helper
        const setOgTag = (property, content) => {
            if (!content) return;
            let tag = document.querySelector(`meta[property="${property}"]`);
            if (!tag) {
                tag = document.createElement('meta');
                tag.setAttribute('property', property);
                document.head.appendChild(tag);
            }
            tag.setAttribute('content', content);
        };

        setOgTag('og:title', seo.ogTitle || seo.metaTitle);
        setOgTag('og:description', seo.ogDescription || seo.metaDescription);
        setOgTag('og:image', seo.ogImageUrl);
        setOgTag('og:url', seo.canonicalUrl || window.location.href);

        // 5. Canonical link
        if (seo.canonicalUrl) {
            let canonicalLink = document.querySelector('link[rel="canonical"]');
            if (!canonicalLink) {
                canonicalLink = document.createElement('link');
                canonicalLink.setAttribute('rel', 'canonical');
                document.head.appendChild(canonicalLink);
            }
            canonicalLink.setAttribute('href', seo.canonicalUrl);
        }

        // 6. Schema.org JSON-LD Structured Data
        if (seo.structuredDataEnabled !== false) {
            const schemaId = 'n1fit-gym-schema';
            let schemaScript = document.getElementById(schemaId);
            if (!schemaScript) {
                schemaScript = document.createElement('script');
                schemaScript.id = schemaId;
                schemaScript.type = 'application/ld+json';
                document.head.appendChild(schemaScript);
            }
            schemaScript.textContent = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SportsClub",
                "name": seo.ogTitle || "N1FIT Spor Merkezi",
                "description": seo.metaDescription || "Gölyaka Düzce Spor Merkezi",
                "image": seo.ogImageUrl || "https://n1fit.com.tr/SalonunFotolari/Salon1.jpeg",
                "telephone": `+${siteStudio.brandConfig?.whatsAppNumber || '905396078154'}`,
                "url": seo.canonicalUrl || "https://n1fit.com.tr",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Kültür, Yavuz Selim Sk. No:8",
                    "addressLocality": "Gölyaka",
                    "addressRegion": "Düzce",
                    "postalCode": "81100",
                    "addressCountry": "TR"
                },
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": 40.7788,
                    "longitude": 31.0264
                },
                "openingHoursSpecification": [
                    {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                        "opens": "08:30",
                        "closes": "23:00"
                    }
                ],
                "priceRange": "$$"
            });
        }
    }, [siteStudio.seoConfig]);


    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleNavClick = (id) => {
        setMobileMenuOpen(false);
        scrollToSection(id);
    };

    const handleWhatsApp = (topic = "genel") => {
        let msg = "Merhaba,%20N1FIT%20Spor%20Merkezi%20üyelik%20ve%20salon%20hakkında%20bilgi%20almak%20istiyorum.";
        if (topic !== "genel") {
            msg = `Merhaba,%20N1FIT%20"${encodeURIComponent(topic)}"%20üyelik%20paketi%20hakkında%20bilgi%20ve%20kayıt%20olmak%20istiyorum.`;
        }
        const phone = siteStudio.brandConfig?.whatsAppNumber || "905396078154";
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    };

    // Ekipman & Alanlar Kartları Varsayılan Verisi (Admin panelinden tamamen güncellenebilir)
    const defaultEquipmentItems = [
        {
            id: 1,
            cat: 'free',
            title: '1.5 kg - 40 kg Tam Set Dumbell Parkuru',
            desc: '1.5 kg’dan 40 kg’a kadar çift istasyon tam set kauçuk dumbellar, ayarlanabilir profesyonel sehpalar ve serbest ağırlık alanı.',
            tag: 'Serbest Ağırlık',
            img: '/SalonunFotolari/Salon1.jpeg?v=2'
        },
        {
            id: 2,
            cat: 'machines',
            title: 'Leg Press & Alt Gövde İstasyonu',
            desc: 'Ağır bacak geliştirme ve alt gövde kuvvet artışı için tasarlanmış, biyomekanik açılı profesyonel Leg Press istasyonu.',
            tag: 'Özel Makine',
            img: '/SalonunFotolari/Salon2.jpeg?v=2'
        },
        {
            id: 3,
            cat: 'free',
            title: 'Squat Kafesi (Power Rack)',
            desc: 'Ağır Squat, Overhead Press ve Deadlift için ayarlanabilir emniyet barlı sağlam kafes sistemi ile sıfır riskte maksimum güç.',
            tag: 'Güç & Güvenlik',
            img: '/SalonunFotolari/Salon3.jpeg?v=2'
        },
        {
            id: 4,
            cat: 'machines',
            title: 'Chest Press & İzole Göğüs Makineleri',
            desc: 'Omuz eklemini yormadan göğüs kas liflerini maksimum gerilimle hedef alan biyomekanik izole Chest Press istasyonu.',
            tag: 'İzole İstasyon',
            img: '/SalonunFotolari/Salon4.jpeg?v=2'
        },
        {
            id: 5,
            cat: 'cardio',
            title: 'Yüksek Tempolu Koşu Bantları',
            desc: 'Dokunmatik dijital göstergeli, eğim ve hız kontrollü profesyonel kardiyo parkuru ile yağ yakımınızı hızlandırın.',
            tag: 'Kardiyo',
            img: '/SalonunFotolari/Salon5.jpeg?v=2'
        },
        {
            id: 6,
            cat: 'pilates',
            title: 'Reformer & Grup Pilates Stüdyosu',
            desc: 'Esneklik, core direnci ve postür düzeltmeye odaklı özel ekipmanlı, ferah kadın ve grup pilates stüdyosu.',
            tag: 'Pilates Stüdyosu',
            img: '/SalonunFotolari/Salon6.jpeg?v=2'
        },
        {
            id: 7,
            cat: 'machines',
            title: 'Lat Pulldown & Kablo İstasyonları',
            desc: 'Çok yönlü kablo açıları, Lat Pulldown ve triceps/biceps çekiş mekanizmalarıyla eksiksiz sırt ve kol gelişimi.',
            tag: 'Kablo Parkuru',
            img: '/SalonunFotolari/Salon10.jpeg?v=2'
        }
    ];

    const currentEquipmentList = (facilities?.equipmentCards && facilities.equipmentCards.length > 0)
        ? facilities.equipmentCards.filter(c => c.isVisible !== false)
        : defaultEquipmentItems;

    const filteredEquipment = activeEquipTab === 'all'
        ? currentEquipmentList
        : currentEquipmentList.filter(item => item.cat === activeEquipTab);

    const activeGalleryImages = (facilities?.galleryPhotos && facilities.galleryPhotos.length > 0)
        ? facilities.galleryPhotos.filter(p => p.isVisible !== false).map(p => p.img)
        : defaultGymImages;

    // Dinamik Saat Selamlaması
    const getGreetingInfo = () => {
        const gc = siteStudio.greetingConfig;
        if (!gc || gc.enabled === false) return null;
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            return { text: gc.morningGreeting || 'Güne Güçlü ve Enerjik Başla, Gölyaka!', icon: '🌅' };
        } else if (hour >= 12 && hour < 17) {
            return { text: gc.afternoonGreeting || 'Günün Zirve Performansını Yakala!', icon: '☀️' };
        } else if (hour >= 17 && hour < 22) {
            return { text: gc.eveningGreeting || 'Günün Yorgunluğunu ve Stresini Salonda Bırak!', icon: '🌇' };
        } else {
            return { text: gc.nightGreeting || 'Yarın İçin Hazırlan, Hedeflerinden Asla Vazgeçme!', icon: '🌙' };
        }
    };

    // --- DİNAMİK KONTEYNIR RENDER FONKSİYONLARI ---
    const renderHero = (c) => {
        const greeting = getGreetingInfo();
        return (
            <section key={c.id} style={{ ...styles.hero, ...(c.backgroundImage ? { backgroundImage: `linear-gradient(to right, rgba(8,9,10,0.96) 25%, rgba(8,9,10,0.72) 70%, rgba(8,9,10,0.92) 100%), url("${c.backgroundImage}")` } : {}) }}>
                <div style={styles.overlay} className="hero-overlay-responsive">
                    {greeting && (
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.14)',
                            padding: '6px 14px',
                            borderRadius: '30px',
                            fontSize: '0.82rem',
                            color: '#e5e7eb',
                            fontWeight: '700',
                            marginBottom: '12px',
                            backdropFilter: 'blur(8px)'
                        }}>
                            <span>{greeting.icon}</span>
                            <span>{greeting.text}</span>
                        </div>
                    )}
                    <div style={styles.eyebrowContainer}>
                        <span style={styles.eyebrowPulse}></span>
                        <span style={styles.eyebrow}>{c.badgeText || "GÖLYAKA / DÜZCE'NİN EN DONANIMLI SPOR MERKEZİ"}</span>
                    </div>

                    <h1 style={styles.title} className="hero-title-responsive">
                        {c.title ? (
                            c.title.includes('\n') ? c.title.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>) : c.title
                        ) : (
                            <>BİLİMSEL SPORUN <br /><span style={styles.titleAccent}>MERKEZİ</span></>
                        )}
                    </h1>

                    <p style={styles.subtitle} className="hero-subtitle-responsive">
                        {c.subtitle || (
                            <>Bilimin, Disiplinin ve <strong>15 Yıllık Sektörel Tecrübenin</strong> Buluştuğu Yer. Hedefinize biyomekaniğe uygun makineler, sakatlık riskini sıfırlayan form takibi ve kişiye özel beslenme desteği ile ulaşın.</>
                        )}
                    </p>

                    <div style={styles.btnGroup} className="hero-btn-group-responsive">
                        <button onClick={() => { if (c.primaryButtonLink?.startsWith('#')) scrollToSection(c.primaryButtonLink.slice(1)); else if (c.primaryButtonLink) window.location.href = c.primaryButtonLink; else scrollToSection('packages'); }} style={styles.mainBtn}>
                            <Flame size={20} /> {c.primaryButtonText || 'Kulübü Keşfet & Katıl'}
                        </button>

                        <button onClick={() => { if (c.secondaryButtonLink?.startsWith('#')) scrollToSection(c.secondaryButtonLink.slice(1)); else if (c.secondaryButtonLink) window.location.href = c.secondaryButtonLink; else scrollToSection('app-section'); }} style={styles.secondaryBtn}>
                            <Download size={18} color={themeAccent} /> {c.secondaryButtonText || 'N1FIT Mobil Uygulamayı İndir'}
                        </button>

                        <button onClick={() => scrollToSection('contact')} style={{ ...styles.secondaryBtn, borderColor: 'rgba(74, 222, 128, 0.45)', color: '#4ade80' }}>
                            <Sparkles size={18} color="#4ade80" /> Ücretsiz Tanışma Randevusu
                        </button>
                    </div>

                    {/* SAYAÇ / STAT BARI */}
                    <div id="stats" style={styles.statGrid} className="hero-stat-grid">
                        {c.items && c.items.length > 0 ? (
                            c.items.map((stat, sIdx) => (
                                <div key={stat.id || sIdx} style={styles.statCard} className="stat-card-responsive">
                                    <div style={styles.statNumber} className="stat-number-responsive">{stat.extraInfo || stat.tag || stat.title}</div>
                                    <div style={styles.statLabel} className="stat-label-responsive">{stat.title || stat.description}</div>
                                </div>
                            ))
                        ) : (
                            <>
                                <div style={styles.statCard} className="stat-card-responsive">
                                    <div style={styles.statNumber} className="stat-number-responsive">150+ m²</div>
                                    <div style={styles.statLabel} className="stat-label-responsive">Ferah Antrenman Alanı</div>
                                </div>
                                <div style={styles.statCard} className="stat-card-responsive">
                                    <div style={styles.statNumber} className="stat-number-responsive">20+</div>
                                    <div style={styles.statLabel} className="stat-label-responsive">Özel İzole İstasyon & Makine</div>
                                </div>
                                <div style={styles.statCard} className="stat-card-responsive">
                                    <div style={{ ...styles.statNumber, color: '#fff' }} className="stat-number-responsive">15+ YIL</div>
                                    <div style={styles.statLabel} className="stat-label-responsive">Sektörel & Akademik Tecrübe</div>
                                </div>
                                <div style={{ ...styles.statCard }} className="stat-card-responsive">
                                    <div style={{ ...styles.statNumber, color: '#4ade80' }} className="stat-number-responsive">%100</div>
                                    <div style={styles.statLabel} className="stat-label-responsive">Kişiye Özel Antrenman & Diyet Takibi</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>
        );
    };

    const renderAppBody = (c) => (
        <section key={c.id} id="app-section" style={{ ...styles.appSection, backgroundColor: c.backgroundColor || 'transparent' }} className="section-responsive">
            <div style={styles.appContainer} className="app-container-responsive">
                <div style={styles.appLeft} className="app-left-responsive">
                    <div style={styles.appBadge} className="app-badge-responsive">{c.badgeText || "N1FIT DİJİTAL SPORCU ASİSTANI"}</div>
                    <h2 style={styles.appTitle} className="section-title-responsive app-title-responsive">
                        {c.title ? (
                            c.title.includes('\n') ? c.title.split('\n').map((l, i) => <React.Fragment key={i}>{l}<br/></React.Fragment>) : c.title
                        ) : (
                            <>Web Sitemiz Bilgi Verir, <br /><span style={{ color: themeAccent }}>Antrenmanı Cebin Yönetir!</span></>
                        )}
                    </h2>
                    <p style={styles.appParagraph} className="app-paragraph-responsive">
                        {c.subtitle || "Web sitemiz salonumuzun kurumsal vitrinidir. Günlük antrenman programınız, setleriniz, beslenme listeniz ve gelişim ölçümleriniz ise resmi N1FIT Mobil Uygulamamızla daima cebinizde."}
                    </p>

                    <div style={styles.appFeatureGrid} className="app-feature-grid-responsive">
                        <div style={styles.appFeatureItem} className="app-feature-item-responsive">
                            <div style={styles.appFeatureIcon}><Dumbbell size={22} color={themeAccent} /></div>
                            <div>
                                <h4 style={styles.appFeatureTitle}>Antrenman & Set Takibi</h4>
                                <p style={styles.appFeatureDesc}>Koçunuzun hazırladığı hareketleri, setleri ve girdiğiniz ağırlıkları cebinizden kaydedin.</p>
                            </div>
                        </div>

                        <div style={styles.appFeatureItem} className="app-feature-item-responsive">
                            <div style={styles.appFeatureIcon}><Activity size={22} color={themeAccent} /></div>
                            <div>
                                <h4 style={styles.appFeatureTitle}>Kişiye Özel Beslenme & Kalori</h4>
                                <p style={styles.appFeatureDesc}>Hedefinize optimize edilmiş öğünler, kalori ve makro hesapları tek ekranda.</p>
                            </div>
                        </div>

                        <div style={styles.appFeatureItem} className="app-feature-item-responsive">
                            <div style={styles.appFeatureIcon}><Target size={22} color={themeAccent} /></div>
                            <div>
                                <h4 style={styles.appFeatureTitle}>Gelişim & Vücut Ölçüleri</h4>
                                <p style={styles.appFeatureDesc}>Kilo, yağ oranı ve bölgesel ölçümlerinizin grafiksel gelişimini izleyin.</p>
                            </div>
                        </div>

                        <div style={styles.appFeatureItem} className="app-feature-item-responsive">
                            <div style={styles.appFeatureIcon}><Clock size={22} color={themeAccent} /></div>
                            <div>
                                <h4 style={styles.appFeatureTitle}>Kalan Üyelik Süresi Kontrolü</h4>
                                <p style={styles.appFeatureDesc}>Paketinizin kalan gün sayısını anlık görün, bitiş tarihinden önce haberdar olun.</p>
                            </div>
                        </div>
                    </div>

                    <div style={styles.appDownloadRow} className="app-download-row-responsive">
                        <InstallAppBanner
                            customButtonOnly={true}
                            buttonText="📲 Mobil Uygulamamızı İndirin (Android & iPhone)"
                            buttonStyle={styles.appInstallBtnHero}
                        />
                    </div>
                </div>

                <div style={styles.appRight} className="app-right-responsive">
                    <div style={styles.phoneMockup} className="phone-mockup-responsive">
                        <div style={styles.phoneSpeaker}></div>
                        <div style={styles.phoneScreen}>
                            <div style={styles.phoneHeader}>
                                <span style={{ fontSize: '0.8rem', color: '#888' }}>N1FIT Sporcu Portalı</span>
                                <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 'bold' }}>● AKTİF</span>
                            </div>
                            <div style={styles.phoneBody}>
                                <div style={styles.phoneGreeting}>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff' }}>HOŞ GELDİN SPORCU! 💪</div>
                                    <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '2px' }}>Bugünkü Antrenman: Göğüs & Ön Kol</div>
                                </div>

                                <div style={styles.phoneCard}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 'bold' }}>Incline Dumbbell Press</span>
                                        <span style={{ fontSize: '0.75rem', color: '#d90429', fontWeight: 'bold' }}>4 Set x 10 Tekrar</span>
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '4px' }}>Dumbell Parkuru: 24 kg</div>
                                </div>

                                <div style={styles.phoneCard}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 'bold' }}>Leg Press & Calf</span>
                                        <span style={{ fontSize: '0.75rem', color: '#d90429', fontWeight: 'bold' }}>4 Set x 12 Tekrar</span>
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '4px' }}>Ağırlık: 160 kg</div>
                                </div>

                                <div style={{ ...styles.phoneCard, borderLeft: '3px solid #4ade80' }}>
                                    <div style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 'bold' }}>Günlük Kalori Hedefi</div>
                                    <div style={{ fontSize: '0.72rem', color: '#ccc', marginTop: '2px' }}>2400 kcal | 160g Protein</div>
                                </div>

                                <div style={styles.phoneBtn}>Antrenmanı Tamamla ✔</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );

    const renderAbout = (c) => (
        <section key={c.id} id="about" style={{ ...styles.sectionPadding, backgroundColor: c.backgroundColor || 'transparent' }} className="section-responsive">
            <div style={styles.maxContainer}>
                <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 50px auto' }}>
                    <div style={styles.sectionEyebrow}>{c.badgeText || "KULÜP FELSEFEMİZ"}</div>
                    <h2 style={styles.sectionTitle} className="section-title-responsive">{c.title || "BİZ KİMİZ?"}</h2>
                    <p style={styles.paragraph}>
                        {c.subtitle || (
                            <>N1FIT, sadece ağırlık kaldırılan bir yer değil; bilimin, biyomekanik prensiplerin ve <strong>15 yıllık sektörel tecrübenin</strong> bir araya geldiği bir yaşam dönüşüm merkezidir.</>
                        )}
                    </p>
                    {c.description && (
                        <p style={styles.paragraph}>{c.description}</p>
                    )}
                </div>

                <div style={styles.missionGrid} className="mission-grid-responsive">
                    {c.items && c.items.length > 0 ? (
                        c.items.map((item, mIdx) => (
                            <div key={item.id || mIdx} style={styles.missionCard}>
                                <Target size={42} color={themeAccent} style={{ marginBottom: '14px' }} />
                                <h3 style={styles.missionTitle}>{item.title}</h3>
                                <p style={styles.missionDesc}>{item.description}</p>
                            </div>
                        ))
                    ) : (
                        <>
                            <div style={styles.missionCard}>
                                <Target size={42} color={themeAccent} style={{ marginBottom: '14px' }} />
                                <h3 style={styles.missionTitle}>Biyomekanik & Doğru Form</h3>
                                <p style={styles.missionDesc}>
                                    Açıları özel hesaplanmış izole makineler ve emniyet barlı serbest ağırlık kafesleri. Sakatlık riskini sıfırlayan, hedeflenen kası maksimum uyaran profesyonel donanım.
                                </p>
                            </div>
                            <div style={styles.missionCard}>
                                <Activity size={42} color={themeAccent} style={{ marginBottom: '14px' }} />
                                <h3 style={styles.missionTitle}>Disiplinli Atmosfer</h3>
                                <p style={styles.missionDesc}>
                                    Boş vakit öldürülen değil, herkesin kendi sınırlarını zorladığı odaklanmış bir motivasyon ortamı. Bahanelere yer yok, sadece disiplin ve sonuç var.
                                </p>
                            </div>
                            <div style={styles.missionCard}>
                                <ShieldCheck size={42} color={themeAccent} style={{ marginBottom: '14px' }} />
                                <h3 style={styles.missionTitle}>Üst Düzey Hijyen & Konfor</h3>
                                <p style={styles.missionDesc}>
                                    Sürekli yenilenen hava sirkülasyonu, düzenli dezenfekte edilen aletler, temiz duş ve kilitli soyunma odaları ile sağlığınız her şeyin önünde.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );

    const renderEquipment = (c) => {
        const sliderImgs = (c.galleryPhotos && c.galleryPhotos.length > 0) ? c.galleryPhotos : activeGalleryImages;
        const showSlider = c.showSlider !== false && sliderImgs && sliderImgs.length > 0;
        const sliderIsTop = c.sliderPosition === 'top';

        const sliderBlock = showSlider && (
            <div style={{ margin: sliderIsTop ? '0 0 55px 0' : '65px 0 0 0', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    SALONUMUZDAN GÖRÜNTÜLER
                </h3>
                <AutoSlider images={sliderImgs} styles={styles} />
            </div>
        );

        return (
            <section key={c.id} id="equipment" style={{ ...styles.sectionPadding, backgroundColor: c.backgroundColor || 'transparent', borderTop: '1px solid #1f2228', borderBottom: '1px solid #1f2228' }} className="section-responsive">
                <div style={styles.maxContainer}>
                    <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 40px auto' }}>
                        <div style={styles.sectionEyebrow}>{c.badgeText || "DONANIM & ENVANTER"}</div>
                        <h2 style={styles.sectionTitle} className="section-title-responsive">{c.title || "EKİPMAN VE ALANLARIMIZ"}</h2>
                        <p style={styles.paragraph}>
                            {c.subtitle || "Hedefiniz ister kuvvet artışı, ister hacim, ister kondisyon olsun; N1FIT Gölyaka'daki 150+ m² tesisinde ihtiyacınız olan tüm donanıma sahiptir."}
                        </p>

                        <div style={styles.filterTabContainer} className="filter-tab-responsive">
                            <button onClick={() => setActiveEquipTab('all')} style={{ ...styles.filterTabBtn, ...(activeEquipTab === 'all' ? styles.filterTabBtnActive : {}) }} className="filter-tab-btn-responsive">Tüm Ekipmanlar</button>
                            <button onClick={() => setActiveEquipTab('free')} style={{ ...styles.filterTabBtn, ...(activeEquipTab === 'free' ? styles.filterTabBtnActive : {}) }} className="filter-tab-btn-responsive">Serbest Ağırlık & Dumbell</button>
                            <button onClick={() => setActiveEquipTab('machines')} style={{ ...styles.filterTabBtn, ...(activeEquipTab === 'machines' ? styles.filterTabBtnActive : {}) }} className="filter-tab-btn-responsive">Özel & İzole Makineler</button>
                            <button onClick={() => setActiveEquipTab('cardio')} style={{ ...styles.filterTabBtn, ...(activeEquipTab === 'cardio' ? styles.filterTabBtnActive : {}) }} className="filter-tab-btn-responsive">Kardiyo Parkuru</button>
                            <button onClick={() => setActiveEquipTab('pilates')} style={{ ...styles.filterTabBtn, ...(activeEquipTab === 'pilates' ? styles.filterTabBtnActive : {}) }} className="filter-tab-btn-responsive">Pilates & Stüdyo</button>
                        </div>
                    </div>

                    {/* Slider Ekipmanların Üstünde İstenmişse */}
                    {sliderIsTop && sliderBlock}

                    <div style={styles.equipmentGrid} className="equipment-grid-responsive">
                        {filteredEquipment.map(item => (
                            <div key={item.id} style={{ ...styles.equipmentCard, contentVisibility: 'auto' }}>
                                <div style={styles.equipmentImgWrapper}>
                                    <img
                                        src={item.img}
                                        alt={item.title}
                                        loading="lazy"
                                        decoding="async"
                                        style={styles.equipmentImg}
                                    />
                                    <span style={styles.equipmentBadge}>{item.tag}</span>
                                </div>
                                <div style={styles.equipmentBody}>
                                    <h4 style={styles.equipmentCardTitle}>{item.title}</h4>
                                    <p style={styles.equipmentCardDesc}>{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Slider Ekipmanların Altında (Varsayılan) */}
                    {!sliderIsTop && sliderBlock}
                </div>
            </section>
        );
    };

    const renderHours = (c) => {
        const defaultWeekly = [
            { day: 'Pazartesi', generalHours: '09:00 - 23:00', womenHours: '', hasWomenSession: false, note: 'Tüm gün genel kullanım' },
            { day: 'Salı', generalHours: '09:00 - 23:00', womenHours: '', hasWomenSession: false, note: 'Tüm gün genel kullanım' },
            { day: 'Çarşamba', generalHours: '20:00 - 23:00', womenHours: '09:00 - 20:00', hasWomenSession: true, note: '20:00 sonrası karma / genel' },
            { day: 'Perşembe', generalHours: '09:00 - 23:00', womenHours: '', hasWomenSession: false, note: 'Tüm gün genel kullanım' },
            { day: 'Cuma', generalHours: '09:00 - 18:00', womenHours: '18:00 - 23:00', hasWomenSession: true, note: '18:00 sonrası kadınlara özel' },
            { day: 'Cumartesi', generalHours: '09:00 - 23:00', womenHours: '', hasWomenSession: false, note: 'Tüm gün genel kullanım' },
            { day: 'Pazar', generalHours: '17:00 - 23:00', womenHours: '09:00 - 17:00', hasWomenSession: true, note: '17:00 sonrası karma / genel' }
        ];
        const weeklySchedule = (c.weeklySchedule && c.weeklySchedule.length > 0) ? c.weeklySchedule : defaultWeekly;
        const todayName = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][new Date().getDay()];

        return (
            <section key={c.id} id="hours" style={{ ...styles.sectionPadding, backgroundColor: c.backgroundColor || 'transparent' }} className="section-responsive">
                <div style={styles.maxContainer}>
                    <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 40px auto' }}>
                        <div style={styles.sectionEyebrow}>{c.badgeText || "GÜNLÜK VE ÖZEL PROGRAM"}</div>
                        <h2 style={styles.sectionTitle} className="section-title-responsive">{c.title || "ÇALIŞMA SAATLERİMİZ"}</h2>
                        <p style={styles.paragraph}>
                            {c.subtitle || "Haftanın her günü geniş çalışma saatlerimiz ve kadın üyelerimize özel ayrılmış seanslarımızla hizmetinizdeyiz."}
                        </p>
                    </div>

                    <div style={styles.hoursGrid} className="hours-grid-responsive">
                        {c.items && c.items.length > 0 ? (
                            c.items.map((item, hIdx) => (
                                <div key={item.id || hIdx} style={{ ...styles.hoursCard, ...(hIdx === 1 ? { border: '1px solid rgba(217, 4, 41, 0.4)', backgroundColor: '#131215' } : {}) }} className="hours-card-responsive">
                                    <div style={styles.hoursHeader}>
                                        {hIdx === 1 ? <HeartHandshake size={28} color={themeAccent} /> : <Clock size={28} color={themeAccent} />}
                                        <div>
                                            <h3 style={{ ...styles.hoursCardTitle, ...(hIdx === 1 ? { color: themeAccent } : {}) }}>{item.title}</h3>
                                            <span style={{ fontSize: '0.85rem', color: '#888' }}>{item.tag || item.extraInfo}</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '14px', lineHeight: '1.6' }}>{item.description}</p>
                                </div>
                            ))
                        ) : (
                            <>
                                <div style={styles.hoursCard} className="hours-card-responsive">
                                    <div style={styles.hoursHeader}>
                                        <Clock size={28} color={themeAccent} />
                                        <div>
                                            <h3 style={styles.hoursCardTitle}>Genel Salon Saatleri</h3>
                                            <span style={{ fontSize: '0.85rem', color: '#888' }}>Haftanın Her Günü Kesintisiz</span>
                                        </div>
                                    </div>
                                    <div style={styles.hoursItemRow}>
                                        <span style={styles.hoursDay}>Pazartesi - Pazar (Hergün):</span>
                                        <span style={styles.hoursTime}>09:00 - 23:00</span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '16px', lineHeight: '1.6' }}>
                                        Çalışma temponuza ve günlük rutininize uygun saatlerde sıra beklemeden antrenman yapabilirsiniz.
                                    </p>
                                </div>

                                <div style={{ ...styles.hoursCard, border: '1px solid rgba(217, 4, 41, 0.4)', backgroundColor: '#131215' }} className="hours-card-responsive">
                                    <div style={styles.hoursHeader}>
                                        <HeartHandshake size={28} color={themeAccent} />
                                        <div>
                                            <h3 style={{ ...styles.hoursCardTitle, color: themeAccent }}>Kadın Günleri ve Saatleri</h3>
                                            <span style={{ fontSize: '0.85rem', color: '#bbb' }}>Kadın Üyelerimize Özel Seanslar</span>
                                        </div>
                                    </div>
                                    <div style={styles.hoursItemRow}>
                                        <span style={{ ...styles.hoursDay, color: '#fff', fontWeight: 'bold' }}>Çarşamba:</span>
                                        <span style={{ ...styles.hoursTime, color: themeAccent }}>09:00 - 20:00</span>
                                    </div>
                                    <div style={styles.hoursItemRow}>
                                        <span style={{ ...styles.hoursDay, color: '#fff', fontWeight: 'bold' }}>Cuma:</span>
                                        <span style={{ ...styles.hoursTime, color: themeAccent }}>18:00 - 23:00</span>
                                    </div>
                                    <div style={styles.hoursItemRow}>
                                        <span style={{ ...styles.hoursDay, color: '#fff', fontWeight: 'bold' }}>Pazar:</span>
                                        <span style={{ ...styles.hoursTime, color: themeAccent }}>09:00 - 17:00</span>
                                    </div>
                                    <div style={styles.hoursSpecialNote}>
                                        <Sparkles size={18} color={themeAccent} style={{ flexShrink: 0 }} />
                                        <span>
                                            <strong>Önemli Bilgilendirme:</strong> Kadın saatlerinden sonra salonumuz <strong>23:00'a kadar</strong> genel hizmet vermektedir.
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* 7 GÜNLÜK GÖRSEL HAFTALIK SEANS TAKVİMİ TABLOSU */}
                    {c.showWeeklyTable !== false && (
                        <div style={{
                            marginTop: '36px',
                            backgroundColor: '#0e1017',
                            border: '1px solid #1e222e',
                            borderRadius: cardRadius,
                            padding: '28px 24px',
                            boxShadow: '0 16px 40px rgba(0,0,0,0.65)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #1c202c', paddingBottom: '16px' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Calendar size={22} color={themeAccent} />
                                        HAFTALIK SEANS & ÇALIŞMA TAKVİMİ
                                    </h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#9ca3af' }}>
                                        Kadınlara özel seans günlerini ve genel karma antrenman saatlerini gün bazında inceleyin.
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <span style={{ backgroundColor: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.45)', color: '#f87171', padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800' }}>
                                        🌸 Kadınlara Özel Seans
                                    </span>
                                    <span style={{ backgroundColor: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.35)', color: '#60a5fa', padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800' }}>
                                        🏋️ Genel / Karma Seans
                                    </span>
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #1e2330', textAlign: 'left', color: '#8e96a8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                                            <th style={{ padding: '12px 14px' }}>Gün</th>
                                            <th style={{ padding: '12px 14px' }}>🌸 Kadınlara Özel Saatler</th>
                                            <th style={{ padding: '12px 14px' }}>🏋️ Genel / Karma Saatler</th>
                                            <th style={{ padding: '12px 14px' }}>Durum & Açıklama</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {weeklySchedule.map((row, rIdx) => {
                                            const dayLabel = row.dayName || row.day || '';
                                            const isWomen = Boolean(row.isWomenDay ?? row.hasWomenSession);
                                            const womenHrs = row.womenOnlyHours || row.womenHours || '';
                                            const isToday = dayLabel === todayName;
                                            return (
                                                <tr
                                                    key={dayLabel || rIdx}
                                                    style={{
                                                        borderBottom: '1px solid #161922',
                                                        backgroundColor: isToday ? 'rgba(229, 9, 20, 0.09)' : (isWomen ? 'rgba(229, 9, 20, 0.03)' : 'transparent'),
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                >
                                                    <td style={{ padding: '14px', fontWeight: '900', color: '#fff', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span>{dayLabel}</span>
                                                        {isToday && (
                                                            <span style={{ backgroundColor: themeAccent, color: '#fff', fontSize: '0.65rem', fontWeight: '900', padding: '2px 8px', borderRadius: '12px', letterSpacing: '0.5px' }}>
                                                                BUGÜN
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '14px' }}>
                                                        {isWomen ? (
                                                            <span style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                backgroundColor: 'rgba(229, 9, 20, 0.18)',
                                                                border: '1px solid rgba(229, 9, 20, 0.5)',
                                                                color: '#fca5a5',
                                                                padding: '5px 12px',
                                                                borderRadius: '8px',
                                                                fontSize: '0.84rem',
                                                                fontWeight: '800'
                                                            }}>
                                                                🌸 {womenHrs || 'Belirtilmedi'}
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: '#555', fontSize: '0.82rem' }}>—</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '14px' }}>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                                            color: '#93c5fd',
                                                            padding: '5px 12px',
                                                            borderRadius: '8px',
                                                            fontSize: '0.84rem',
                                                            fontWeight: '800'
                                                        }}>
                                                            🕒 {row.generalHours || '09:00 - 23:00'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '14px', color: '#9ca3af', fontSize: '0.84rem', fontWeight: '600' }}>
                                                        {row.note || (isWomen ? 'Kadın seansı + Genel kullanım' : 'Tüm gün genel kullanım')}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        );
    };

    const renderPackages = (c) => {
        const themeConfig = siteStudio.themeConfig || {};
        const themeAccent = themeConfig.accentColor || '#e50914';
        const themeGlow = themeConfig.accentGlow || 'rgba(229, 9, 20, 0.4)';
        const cardRadius = themeConfig.cornerStyle === 'sharp' ? '4px' : themeConfig.cornerStyle === 'pill' ? '28px' : '20px';
        const btnRadius = themeConfig.cornerStyle === 'sharp' ? '4px' : themeConfig.cornerStyle === 'pill' ? '28px' : '12px';

        return (
            <section key={c.id} id="packages" style={{ ...styles.sectionPadding, backgroundColor: c.backgroundColor || 'transparent', borderTop: '1px solid #1a1c22' }} className="section-responsive">
                <div style={styles.maxContainer}>
                    <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 48px auto' }}>
                        <div style={{
                            display: 'inline-block',
                            backgroundColor: themeAccent.startsWith('#') ? `${themeAccent}18` : 'rgba(229,9,20,0.15)',
                            color: themeAccent,
                            border: `1px solid ${themeAccent}`,
                            padding: '6px 16px',
                            borderRadius: '30px',
                            fontSize: '0.78rem',
                            fontWeight: '900',
                            letterSpacing: '1.2px',
                            marginBottom: '14px',
                            textTransform: 'uppercase'
                        }}>{c.badgeText || "ŞEFFAF FİYATLANDIRMA"}</div>
                        <h2 style={{ ...styles.sectionTitle, fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.5px' }} className="section-title-responsive">{c.title || "ÜYELİK PAKETLERİ"}</h2>
                        <p style={{ ...styles.paragraph, color: '#9ca3af', fontSize: '1rem', lineHeight: 1.6 }}>
                            {c.subtitle || "Hedeflerinize ve bütçenize en uygun paketi seçin, antrenmana bugün başlayın."}
                        </p>
                    </div>

                    {packages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#101218', borderRadius: '16px', border: '1px solid #202430' }}>
                            <p style={{ color: '#9ca3af', fontSize: '1.05rem', margin: 0 }}>Şu anda vitrinde sergilenen aktif paket bulunmamaktadır.</p>
                            <button onClick={() => handleWhatsApp('genel')} style={{ ...styles.mainBtn, backgroundColor: themeAccent, display: 'inline-flex', marginTop: '18px' }}>
                                WhatsApp ile Bilgi Alın →
                            </button>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                            gap: '28px',
                            maxWidth: '1100px',
                            margin: '0 auto',
                            alignItems: 'stretch',
                            boxSizing: 'border-box'
                        }} className="package-grid-responsive">
                            {packages.map((pkg, idx) => {
                                const isFeatured = idx === 1 || pkg.name?.toLowerCase().includes('kadın') || pkg.name?.toLowerCase().includes('yıllık') || pkg.name?.toLowerCase().includes('3 ay');
                                return (
                                    <div
                                        key={pkg.id}
                                        style={{
                                            backgroundColor: isFeatured ? '#131620' : '#0e1017',
                                            border: isFeatured ? `2px solid ${themeAccent}` : '1px solid #1e222e',
                                            borderRadius: cardRadius,
                                            padding: '44px 28px 32px 28px',
                                            textAlign: 'center',
                                            boxShadow: isFeatured ? `0 20px 50px rgba(0,0,0,0.85), 0 0 35px ${themeGlow}` : '0 12px 35px rgba(0,0,0,0.6)',
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            transform: isFeatured ? 'translateY(-6px)' : 'none',
                                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                            boxSizing: 'border-box'
                                        }}
                                        className="package-card-responsive"
                                    >
                                        {isFeatured && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '-14px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                backgroundColor: themeAccent,
                                                color: '#ffffff',
                                                fontSize: '0.72rem',
                                                fontWeight: '900',
                                                letterSpacing: '1px',
                                                padding: '6px 18px',
                                                borderRadius: '30px',
                                                boxShadow: `0 4px 15px ${themeGlow}`,
                                                whiteSpace: 'nowrap',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                <Sparkles size={12} color="#fff" />
                                                EN ÇOK TERCİH EDİLEN
                                            </div>
                                        )}

                                        <div>
                                            <h3 style={{
                                                color: '#ffffff',
                                                fontSize: '1.4rem',
                                                fontWeight: '900',
                                                margin: '0 0 6px 0',
                                                letterSpacing: '-0.3px'
                                            }}>{pkg.name}</h3>

                                            <div style={{
                                                color: '#8e96a8',
                                                fontSize: '0.88rem',
                                                fontWeight: '600',
                                                marginBottom: '20px'
                                            }}>{pkg.durationMonths} Ay Sınırsız Erişim</div>

                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'baseline',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                padding: '16px 0',
                                                borderTop: '1px solid #1c202b',
                                                borderBottom: '1px solid #1c202b',
                                                marginBottom: '24px'
                                            }}>
                                                <span style={{
                                                    fontSize: '3rem',
                                                    fontWeight: '900',
                                                    color: '#ffffff',
                                                    lineHeight: 1,
                                                    letterSpacing: '-1.5px'
                                                }}>{pkg.price}</span>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                    <span style={{ fontSize: '1.15rem', fontWeight: '900', color: themeAccent }}>TL</span>
                                                    <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: '600' }}>/ Sefer</span>
                                                </div>
                                            </div>

                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '13px',
                                                textAlign: 'left',
                                                marginBottom: '30px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#d1d5db' }}>
                                                    <CheckCircle size={17} color={themeAccent} style={{ flexShrink: 0 }} />
                                                    <span>Tüm Ekipmanlara Sınırsız Erişim</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#d1d5db' }}>
                                                    <CheckCircle size={17} color={themeAccent} style={{ flexShrink: 0 }} />
                                                    <span>N1FIT Mobil Antrenör Uygulaması</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#d1d5db' }}>
                                                    <CheckCircle size={17} color={themeAccent} style={{ flexShrink: 0 }} />
                                                    <span>Ücretsiz Vücut Analizi & Ölçüm</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#d1d5db' }}>
                                                    <CheckCircle size={17} color={themeAccent} style={{ flexShrink: 0 }} />
                                                    <span>Bireysel Kalori & Beslenme Takibi</span>
                                                </div>
                                                {pkg.description && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#9ca3af', fontStyle: 'italic', marginTop: '4px' }}>
                                                        <span>💬 {pkg.description}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleWhatsApp(pkg.name)}
                                            style={{
                                                width: '100%',
                                                padding: '14px 20px',
                                                backgroundColor: isFeatured ? themeAccent : 'rgba(255, 255, 255, 0.08)',
                                                color: '#ffffff',
                                                border: isFeatured ? 'none' : '1px solid #282d3b',
                                                borderRadius: btnRadius,
                                                fontWeight: '900',
                                                fontSize: '0.94rem',
                                                letterSpacing: '0.5px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                boxShadow: isFeatured ? `0 8px 24px ${themeGlow}` : 'none',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <span>Hemen Kaydol & Başla</span>
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        );
    };

    const renderBanner = (c) => (
        <section key={c.id} style={{ ...styles.sectionPadding, backgroundColor: c.backgroundColor || 'transparent', borderTop: '1px solid #1f2228', borderBottom: '1px solid #1f2228' }} className="section-responsive">
            <div style={styles.maxContainer}>
                <div style={{
                    position: 'relative',
                    borderRadius: cardRadius,
                    overflow: 'hidden',
                    minHeight: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '40px',
                    backgroundImage: `linear-gradient(to right, rgba(10,10,12,0.95) 25%, rgba(10,10,12,0.7) 70%, rgba(10,10,12,0.95) 100%), url("${c.backgroundImage || '/SalonunFotolari/Salon1.jpeg'}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid #2a2e39',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
                }}>
                    <div style={{ maxWidth: '650px', zIndex: 2 }}>
                        {c.badgeText && (
                            <div style={{ display: 'inline-block', backgroundColor: 'rgba(217, 4, 41, 0.2)', border: '1px solid #d90429', color: themeAccent, padding: '4px 12px', borderRadius: '14px', fontSize: '0.8rem', fontWeight: '800', marginBottom: '12px', textTransform: 'uppercase' }}>
                                {c.badgeText}
                            </div>
                        )}
                        <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#fff', margin: '0 0 10px 0', lineHeight: 1.2 }}>
                            {c.title}
                        </h2>
                        {c.subtitle && (
                            <p style={{ color: '#ccc', fontSize: '1.05rem', margin: '0 0 20px 0', lineHeight: 1.6 }}>
                                {c.subtitle}
                            </p>
                        )}
                        {c.primaryButtonText && (
                            <a
                                href={c.primaryButtonLink || '#'}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    backgroundColor: themeAccent,
                                    color: '#fff',
                                    padding: '12px 24px',
                                    borderRadius: btnRadius,
                                    fontWeight: '800',
                                    textDecoration: 'none',
                                    boxShadow: `0 6px 20px ${themeGlow}`
                                }}
                            >
                                {c.primaryButtonText} →
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );

    const handleLeadSubmit = async (e) => {
        e.preventDefault();
        setLeadError('');
        setLeadSuccess('');
        if (!leadForm.fullName.trim() || !leadForm.phone.trim()) {
            setLeadError('Lütfen Ad Soyad ve Telefon Numarası alanlarını doldurunuz.');
            return;
        }
        setLeadSubmitting(true);
        try {
            const res = await api.post('/Admin/public/site-lead', {
                fullName: leadForm.fullName.trim(),
                phone: leadForm.phone.trim(),
                goal: leadForm.goal,
                preferredTime: leadForm.preferredTime,
                note: leadForm.note.trim(),
                sourceSection: 'Web Ücretsiz Tanışma & Ön Kayıt Formu'
            });
            setLeadSuccess(res.data?.message || 'Başvurunuz başarıyla alındı! Antrenör ekibimiz en kısa sürede sizinle iletişime geçecektir.');
            setLeadForm({
                fullName: '',
                phone: '',
                goal: 'Kilo Verme & Yağ Yakımı',
                preferredTime: 'Akşam (18:00 - 23:00)',
                note: ''
            });
        } catch (err) {
            setLeadError(err.response?.data?.message || 'Başvuru gönderilirken bir hata oluştu. Lütfen WhatsApp hattımızdan bize ulaşın.');
        } finally {
            setLeadSubmitting(false);
        }
    };

    const renderFaq = (c) => {
        const defaultFaqs = [
            {
                id: 1,
                title: 'Spora yeni başlıyorum, antrenman ve beslenme programı veriliyor mu?',
                tag: 'Program & İlgi',
                description: 'Evet! Kayıt olduğunuz ilk gün vücut analiziniz yapılır, hedefinize uygun antrenman programınız ve Mifflin-St Jeor tabanlı kişisel beslenme planınız N1FIT Mobil Uygulamasına tanımlanır.'
            },
            {
                id: 2,
                title: 'Kadınlara özel seans saatlerinde salonda erkek üye veya personel oluyor mu?',
                tag: 'Kadın Seansları',
                description: 'Kadınlara özel seans saatlerimizde (Çarşamba 09:00-20:00, Cuma 18:00-23:00, Pazar 09:00-17:00) salonumuz yalnızca kadın üyelerimizin kullanımına ayrılmaktadır.'
            },
            {
                id: 3,
                title: 'Üyeliğimi dondurma (askıya alma) hakkım var mı?',
                tag: 'Üyelik Hakları',
                description: 'Uzun dönemli (3, 6 ve 12 aylık) paketlerimizde hastalık, şehir dışı seyahat veya sınav dönemleri için üyelik dondurma hakkınız bulunmaktadır.'
            },
            {
                id: 4,
                title: 'Salona gelirken yanımda neler getirmeliyim?',
                tag: 'Salon Kuralları',
                description: 'Hijyen standartlarımız gereği dışarıda giyilmemiş temiz tabanlı spor ayakkabısı ve antrenman havlusu getirmeniz zorunludur. Kilitli dolaplar ve duş alanlarımız ücretsizdir.'
            }
        ];
        const faqItems = (c.items && c.items.length > 0) ? c.items : defaultFaqs;

        return (
            <section key={c.id} id="faq" style={{ ...styles.sectionPadding, backgroundColor: c.backgroundColor || 'transparent', borderTop: '1px solid #1a1c22' }} className="section-responsive">
                <div style={styles.maxContainer}>
                    <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 42px auto' }}>
                        <div style={styles.sectionEyebrow}>{c.badgeText || "MERAK EDİLENLER"}</div>
                        <h2 style={styles.sectionTitle} className="section-title-responsive">{c.title || "SIKÇA SORULAN SORULAR"}</h2>
                        <p style={styles.paragraph}>
                            {c.subtitle || "Üyelik sistemi, kadınlara özel seanslarımız, antrenman programları ve salon işleyişi hakkında en çok sorulan sorular."}
                        </p>
                    </div>

                    <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {faqItems.map((item, idx) => {
                            const isOpen = openFaqIndex === idx;
                            return (
                                <div
                                    key={item.id || idx}
                                    style={{
                                        backgroundColor: isOpen ? '#12151e' : '#0d0f15',
                                        border: isOpen ? `1px solid ${themeAccent}` : '1px solid #1e222e',
                                        borderRadius: cardRadius,
                                        overflow: 'hidden',
                                        transition: 'all 0.25s ease',
                                        boxShadow: isOpen ? `0 12px 30px rgba(0,0,0,0.6), 0 0 20px ${themeGlow}` : 'none'
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                                        style={{
                                            width: '100%',
                                            background: 'none',
                                            border: 'none',
                                            padding: '20px 24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '16px',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            color: '#fff'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                            {item.tag && (
                                                <span style={{
                                                    backgroundColor: 'rgba(229, 9, 20, 0.16)',
                                                    border: '1px solid rgba(229, 9, 20, 0.45)',
                                                    color: '#f87171',
                                                    padding: '3px 10px',
                                                    borderRadius: '14px',
                                                    fontSize: '0.72rem',
                                                    fontWeight: '800',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {item.tag}
                                                </span>
                                            )}
                                            <span style={{ fontSize: '1.05rem', fontWeight: '800', color: isOpen ? '#fff' : '#e5e7eb', lineHeight: 1.4 }}>
                                                {item.title}
                                            </span>
                                        </div>
                                        <span style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: isOpen ? themeAccent : '#1a1e29',
                                            color: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '900',
                                            fontSize: '1.1rem',
                                            flexShrink: 0,
                                            transition: 'all 0.2s ease'
                                        }}>
                                            {isOpen ? '−' : '+'}
                                        </span>
                                    </button>
                                    {isOpen && (
                                        <div style={{
                                            padding: '0 24px 22px 24px',
                                            color: '#9ca3af',
                                            fontSize: '0.95rem',
                                            lineHeight: 1.7,
                                            borderTop: '1px solid rgba(255,255,255,0.06)',
                                            paddingTop: '16px'
                                        }}>
                                            {item.description}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        );
    };

    const renderContact = (c) => (
        <section key={c.id} id="contact" style={{ ...styles.sectionPadding, backgroundColor: c.backgroundColor || 'transparent' }} className="section-responsive">
            <div style={styles.maxContainer}>
                <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 40px auto' }}>
                    <div style={styles.sectionEyebrow}>{c.badgeText || "BİZE ULAŞIN"}</div>
                    <h2 style={styles.sectionTitle} className="section-title-responsive">{c.title || "SALONUMUZU ZİYARET EDİN"}</h2>
                    <p style={styles.paragraph}>
                        {c.subtitle || "Bir kahvemizi içmek, ekipmanlarımızı yerinde incelemek ve hedeflerinizi konuşmak için kapımız her zaman açık."}
                    </p>
                </div>

                {/* ÜCRETSİZ TANIŞMA ANTRENMANI & ÖN KAYIT FORMU KARTI */}
                <div style={{
                    backgroundColor: '#0e1118',
                    border: `1px solid ${themeAccent}`,
                    borderRadius: cardRadius,
                    padding: '32px 28px',
                    marginBottom: '32px',
                    boxShadow: `0 20px 50px rgba(0,0,0,0.75), 0 0 28px ${themeGlow}`,
                    boxSizing: 'border-box'
                }} className="lead-card-responsive">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '22px' }}>
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(74, 222, 128, 0.14)', border: '1px solid rgba(74, 222, 128, 0.4)', color: '#4ade80', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '900', marginBottom: '8px' }}>
                                🎁 ÜCRETSİZ TANIŞMA & VÜCUT ANALİZİ RANDEVUSU
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fff', margin: 0 }} className="lead-title-responsive">
                                Ön Kayıt & Bilgi Formu Bırakın, Sizi Arayalım!
                            </h3>
                            <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: '6px 0 0 0' }}>
                                İletişim bilgilerinizi ve antrenman hedefinizi bırakın; koçlarımız size özel üyelik avantajları ve tanışma antrenmanı için dönüş yapsın.
                            </p>
                        </div>
                    </div>

                    {leadSuccess && (
                        <div style={{ backgroundColor: 'rgba(22, 163, 74, 0.18)', border: '1px solid #22c55e', color: '#4ade80', padding: '14px 18px', borderRadius: '12px', marginBottom: '18px', fontWeight: '800', fontSize: '0.92rem' }}>
                            ✅ {leadSuccess}
                        </div>
                    )}
                    {leadError && (
                        <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.18)', border: '1px solid #ef4444', color: '#f87171', padding: '14px 18px', borderRadius: '12px', marginBottom: '18px', fontWeight: '800', fontSize: '0.92rem' }}>
                            ⚠️ {leadError}
                        </div>
                    )}

                    <form onSubmit={handleLeadSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', boxSizing: 'border-box' }} className="lead-form-grid-responsive">
                        <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', color: '#9ca3af', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>Adınız Soyadınız *</label>
                            <input
                                type="text"
                                required
                                placeholder="Örn: Ahmet Yılmaz"
                                value={leadForm.fullName}
                                onChange={(e) => setLeadForm({ ...leadForm, fullName: e.target.value })}
                                style={{ width: '100%', padding: '12px 14px', backgroundColor: '#151924', border: '1px solid #282f42', borderRadius: '10px', color: '#fff', fontSize: '0.92rem', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', color: '#9ca3af', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>Telefon Numaranız *</label>
                            <input
                                type="tel"
                                required
                                placeholder="Örn: 0539 607 81 54"
                                value={leadForm.phone}
                                onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                                style={{ width: '100%', padding: '12px 14px', backgroundColor: '#151924', border: '1px solid #282f42', borderRadius: '10px', color: '#fff', fontSize: '0.92rem', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', color: '#9ca3af', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>Antrenman Hedefiniz</label>
                            <select
                                value={leadForm.goal}
                                onChange={(e) => setLeadForm({ ...leadForm, goal: e.target.value })}
                                style={{ width: '100%', padding: '12px 14px', backgroundColor: '#151924', border: '1px solid #282f42', borderRadius: '10px', color: '#fff', fontSize: '0.92rem', boxSizing: 'border-box' }}
                            >
                                <option value="Kilo Verme & Yağ Yakımı">🔥 Kilo Verme & Yağ Yakımı</option>
                                <option value="Kas Gelişimi & Hacim (Hipertrofi)">💪 Kas Gelişimi & Hacim (Hipertrofi)</option>
                                <option value="Kadınlara Özel Seans & Sıkılaşma">🌸 Kadınlara Özel Seans & Sıkılaşma</option>
                                <option value="Birebir Özel Ders (PT) & Postür">🎯 Birebir Özel Ders (PT) & Postür</option>
                                <option value="Genel Kondisyon & Sağlıklı Yaşam">⚡ Genel Kondisyon & Sağlıklı Yaşam</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', color: '#9ca3af', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>Tercih Ettiğiniz Saatler</label>
                            <select
                                value={leadForm.preferredTime}
                                onChange={(e) => setLeadForm({ ...leadForm, preferredTime: e.target.value })}
                                style={{ width: '100%', padding: '12px 14px', backgroundColor: '#151924', border: '1px solid #282f42', borderRadius: '10px', color: '#fff', fontSize: '0.92rem', boxSizing: 'border-box' }}
                            >
                                <option value="Sabah (09:00 - 13:00)">🌅 Sabah (09:00 - 13:00)</option>
                                <option value="Öğleden Sonra (13:00 - 18:00)">☀️ Öğleden Sonra (13:00 - 18:00)</option>
                                <option value="Akşam (18:00 - 23:00)">🌇 Akşam (18:00 - 23:00)</option>
                                <option value="Kadınlara Özel Seans Saatleri">🌸 Kadınlara Özel Seans Saatleri</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }} className="lead-submit-row-responsive">
                            <input
                                type="text"
                                placeholder="Eklemek istediğiniz not veya soru (İsteğe bağlı)..."
                                value={leadForm.note}
                                onChange={(e) => setLeadForm({ ...leadForm, note: e.target.value })}
                                style={{ flex: '1 1 280px', padding: '12px 14px', backgroundColor: '#151924', border: '1px solid #282f42', borderRadius: '10px', color: '#fff', fontSize: '0.92rem', boxSizing: 'border-box' }}
                                className="lead-note-input-responsive"
                            />
                            <button
                                type="submit"
                                disabled={leadSubmitting}
                                style={{
                                    padding: '13px 26px',
                                    backgroundColor: themeAccent,
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: btnRadius,
                                    fontWeight: '900',
                                    fontSize: '0.95rem',
                                    cursor: leadSubmitting ? 'wait' : 'pointer',
                                    boxShadow: `0 8px 25px ${themeGlow}`,
                                    boxSizing: 'border-box'
                                }}
                                className="lead-submit-btn-responsive"
                            >
                                {leadSubmitting ? 'Gönderiliyor...' : '🎁 Ücretsiz Tanışma Randevusu Oluştur →'}
                            </button>
                        </div>
                    </form>
                </div>

                <div style={styles.contactWrapper} className="contact-wrapper-responsive">
                    <div style={styles.contactCard} className="contact-card-responsive">
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff', marginBottom: '20px' }}>
                            N1FIT SPOR MERKEZİ
                        </h3>

                        <div style={styles.contactRow}>
                            <MapPin size={22} color={themeAccent} style={{ flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Adres</div>
                                <div
                                    onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=K%C3%BClt%C3%BCr%2C+Yavuz+Selim+Sk.+No%3A8%2C+81100+G%C3%B6lyaka%2FD%C3%BCzce', '_blank')}
                                    style={{ color: '#fff', fontSize: '0.98rem', marginTop: '2px', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#d90429', wordBreak: 'break-word', lineHeight: '1.5' }}
                                    title="Haritada Konumu Gör"
                                >
                                    {c.description || "Kültür, Yavuz Selim Sk. No:8, 81100 Gölyaka/Düzce"}
                                </div>
                            </div>
                        </div>

                        <div style={styles.contactRow}>
                            <Phone size={22} color={themeAccent} style={{ flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Telefon Hatları</div>
                                <div style={{ color: '#fff', fontSize: '0.98rem', marginTop: '4px', fontWeight: 'bold', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                    <a href="tel:05396078154" style={{ color: '#fff', textDecoration: 'none' }}>0539 607 81 54</a>
                                    <span style={{ color: '#555' }}>|</span>
                                    <a href="tel:05350495481" style={{ color: '#fff', textDecoration: 'none' }}>0535 049 54 81</a>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '25px' }}>
                            <button onClick={() => handleWhatsApp('genel')} style={styles.whatsAppLeadBtn}>
                                <MessageCircle size={20} /> {c.primaryButtonText || "WhatsApp'tan Hemen Bilgi Al"}
                            </button>
                        </div>
                    </div>

                    <div style={styles.mapCard} className="map-card-responsive">
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(217, 4, 41, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', border: '1px solid #d90429' }}>
                            <MapPin size={28} color="#d90429" />
                        </div>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>Merkezi ve Kolay Ulaşım</h4>
                        <p style={{ color: '#aaa', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto 20px auto', lineHeight: '1.6' }}>
                            Gölyaka Kültür Mahallesi merkezinde bulunan tesisimizin önünde ücretsiz otopark alanı mevcuttur.
                        </p>
                        <button
                            type="button"
                            onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=K%C3%BClt%C3%BCr%2C+Yavuz+Selim+Sk.+No%3A8%2C+81100+G%C3%B6lyaka%2FD%C3%BCzce', '_blank')}
                            style={styles.mapNavBtn}
                        >
                            <ExternalLink size={16} /> Google Haritalarda Rota Oluştur
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );

    // 1. DEĞİŞİM & ÖNCESİ/SONRASI (BEFORE/AFTER SLIDER)
    const renderBeforeAfter = (c) => (
        <section key={c.id} id="before-after" style={{ ...styles.sectionPadding, backgroundColor: c.backgroundColor || 'transparent' }} className="section-responsive">
            <div style={styles.maxContainer}>
                <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 40px auto' }}>
                    {c.badgeText && <div style={styles.sectionEyebrow}>{c.badgeText}</div>}
                    <h2 style={styles.sectionTitle} className="section-title-responsive">{c.title || "DEĞİŞİM HİKAYELERİ & BAŞARI"}</h2>
                    <p style={styles.paragraph}>{c.subtitle || "Disiplin ve doğru antrenman programlamasıyla üyelerimizin elde ettiği gerçek sonuçlar."}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '30px' }}>
                    {(c.items || []).map((item, idx) => (
                        <div key={item.id || idx} style={{
                            backgroundColor: '#11131a',
                            border: '1px solid #202430',
                            borderRadius: cardRadius,
                            overflow: 'hidden',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            boxShadow: '0 15px 35px rgba(0,0,0,0.4)'
                        }}>
                            <BeforeAfterSlider
                                beforeImg={item.imageUrl}
                                afterImg={item.extraInfo}
                                radius={cardRadius}
                                badgeRadius={badgeRadius}
                                accentColor={themeAccent}
                            />
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>
                                        {item.title}
                                    </h3>
                                    {item.tag && (
                                        <span style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: '0.75rem', fontWeight: '800', padding: '3px 10px', borderRadius: badgeRadius }}>
                                            {item.tag}
                                        </span>
                                    )}
                                </div>
                                {item.description && (
                                    <p style={{ color: '#9aa0b0', fontSize: '0.92rem', lineHeight: '1.6', margin: 0 }}>
                                        "{item.description}"
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    // 2. GOOGLE & ÜYE YORUMLARI VİTRİNİ
    const renderReviews = (c) => (
        <section key={c.id} id="reviews" style={{ ...styles.sectionPadding, backgroundColor: c.backgroundColor || 'transparent' }} className="section-responsive">
            <div style={styles.maxContainer}>
                <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 30px auto' }}>
                    {c.badgeText && <div style={styles.sectionEyebrow}>{c.badgeText}</div>}
                    <h2 style={styles.sectionTitle} className="section-title-responsive">{c.title || "ÜYELERİMİZ NELER SÖYLÜYOR?"}</h2>
                    <p style={styles.paragraph}>{c.subtitle || "Google Haritalar 4.9 Puan ve 150+ Gerçek Üye Değerlendirmesi."}</p>

                    {/* Google Rating Badge */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        backgroundColor: '#161922',
                        border: '1px solid #2b3040',
                        padding: '10px 22px',
                        borderRadius: badgeRadius,
                        marginTop: '10px',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                    }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>4.9</span>
                        <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                            <Star size={16} fill="#f59e0b" />
                            <Star size={16} fill="#f59e0b" />
                            <Star size={16} fill="#f59e0b" />
                            <Star size={16} fill="#f59e0b" />
                            <Star size={16} fill="#f59e0b" />
                        </div>
                        <span style={{ color: '#888', fontSize: '0.85rem' }}>| 150+ Google Yorumu</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '30px' }}>
                    {(c.items || []).map((item, idx) => (
                        <div key={item.id || idx} style={{
                            backgroundColor: '#12141c',
                            border: '1px solid #1e222e',
                            borderRadius: cardRadius,
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                        }}>
                            <div>
                                <div style={{ display: 'flex', gap: '2px', color: '#f59e0b', marginBottom: '14px' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={15} fill="#f59e0b" />
                                    ))}
                                </div>
                                <p style={{ color: '#d1d5db', fontSize: '0.94rem', lineHeight: '1.7', margin: 0, fontStyle: 'italic' }}>
                                    "{item.description}"
                                </p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #1f2330' }}>
                                <div style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: avatarRadius,
                                    backgroundColor: themeAccent,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontWeight: '900',
                                    fontSize: '1rem'
                                }}>
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: avatarRadius, objectFit: 'cover' }} />
                                    ) : (
                                        (item.title || 'Ü')[0]
                                    )}
                                </div>
                                <div>
                                    <div style={{ color: '#fff', fontWeight: '800', fontSize: '0.95rem' }}>{item.title}</div>
                                    <div style={{ color: '#888', fontSize: '0.78rem' }}>{item.subtitle || 'Doğrulanmış Üye'}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    // 3. EĞİTMEN & ANTRENÖR KADROSU
    const renderTrainers = (c) => (
        <section key={c.id} id="trainers" style={{ ...styles.sectionPadding, backgroundColor: c.backgroundColor || 'transparent' }} className="section-responsive">
            <div style={styles.maxContainer}>
                <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 40px auto' }}>
                    {c.badgeText && <div style={styles.sectionEyebrow}>{c.badgeText}</div>}
                    <h2 style={styles.sectionTitle} className="section-title-responsive">{c.title || "UZMAN ANTRENÖR KADROMUZ"}</h2>
                    <p style={styles.paragraph}>{c.subtitle || "Biyomekanik ve hipertrofi alanında akademik temelli profesyonel koçlar."}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '26px' }}>
                    {(c.items || []).map((trainer, idx) => (
                        <div key={trainer.id || idx} style={{
                            backgroundColor: '#12141c',
                            border: '1px solid #1f2330',
                            borderRadius: cardRadius,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 15px 35px rgba(0,0,0,0.4)'
                        }}>
                            <div style={{ height: '300px', position: 'relative', overflow: 'hidden' }}>
                                <img
                                    src={trainer.imageUrl || '/SalonunFotolari/Salon1.jpeg'}
                                    alt={trainer.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'linear-gradient(to top, rgba(18,20,28,1) 0%, transparent 60%)'
                                }} />
                            </div>

                            <div style={{ padding: '22px', marginTop: '-30px', position: 'relative', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <h3 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: '900', margin: '0 0 4px 0' }}>
                                    {trainer.title}
                                </h3>
                                <div style={{ color: themeAccent, fontSize: '0.85rem', fontWeight: '800', marginBottom: '10px' }}>
                                    {trainer.subtitle || 'Antrenör'}
                                </div>
                                {trainer.tag && (
                                    <div style={{ display: 'inline-block', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.08)', color: '#ccc', fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: badgeRadius, marginBottom: '12px' }}>
                                        {trainer.tag}
                                    </div>
                                )}
                                {trainer.description && (
                                    <p style={{ color: '#9aa0b0', fontSize: '0.88rem', lineHeight: '1.6', margin: '0 0 16px 0', flex: 1 }}>
                                        {trainer.description}
                                    </p>
                                )}
                                {trainer.buttonText && (
                                    <a
                                        href={trainer.buttonLink || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            backgroundColor: '#1b1f29',
                                            border: '1px solid #2d3345',
                                            color: '#fff',
                                            padding: '10px',
                                            borderRadius: btnRadius,
                                            fontSize: '0.85rem',
                                            fontWeight: '700',
                                            textDecoration: 'none',
                                            marginTop: 'auto'
                                        }}
                                    >
                                        <InstagramIcon size={16} /> {trainer.buttonText}
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    // 4. GERİ SAYIM SAYACI KAMPANYA BANDI (COUNTDOWN CAMPAIGN)
    const renderCountdownCampaign = (c) => (
        <section key={c.id} style={{ ...styles.sectionPadding, backgroundColor: c.backgroundColor || 'transparent', borderTop: '1px solid #1f2330', borderBottom: '1px solid #1f2330' }} className="section-responsive">
            <div style={styles.maxContainer}>
                <div style={{
                    backgroundColor: '#12141c',
                    border: `1px solid ${themeAccent}`,
                    borderRadius: cardRadius,
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '20px',
                    boxShadow: `0 20px 50px ${themeGlow}`
                }}>
                    {c.badgeText && (
                        <div style={{ backgroundColor: themeAccent, color: '#fff', padding: '4px 14px', borderRadius: badgeRadius, fontSize: '0.75rem', fontWeight: '900', letterSpacing: '1px' }}>
                            {c.badgeText}
                        </div>
                    )}
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#fff', margin: 0 }}>
                        {c.title}
                    </h2>
                    {c.subtitle && (
                        <p style={{ color: '#aaa', fontSize: '1rem', margin: 0, maxWidth: '650px' }}>
                            {c.subtitle}
                        </p>
                    )}
                    <CountdownTimer radius={btnRadius} targetDate={c.primaryButtonLink?.includes('202') ? c.primaryButtonLink : siteStudio.countdownConfig?.targetDate || '2026-12-01T23:59:59'} />
                    {c.primaryButtonText && (
                        <a href={c.primaryButtonLink || '#packages'} style={{ ...styles.mainBtn, marginTop: '10px' }}>
                            {c.primaryButtonText} →
                        </a>
                    )}
                </div>
            </div>
        </section>
    );

    const renderBrandLogo = (inFooter = false) => {
        const brand = siteStudio.brandConfig || {
            logoUrl: '',
            brandNamePrefix: 'N1',
            brandNameAccent: 'FIT',
            displayMode: 'logo_and_text'
        };

        const hasLogo = Boolean(brand.logoUrl);
        const mode = brand.displayMode || 'logo_and_text';
        const showLogo = hasLogo && (mode === 'logo_only' || mode === 'logo_and_text');
        const showText = !hasLogo || mode === 'text_only' || mode === 'logo_and_text';

        return (
            <div
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
                {showLogo && (
                    <img
                        src={brand.logoUrl}
                        alt="Logo"
                        style={{
                            height: inFooter ? '32px' : '38px',
                            width: 'auto',
                            objectFit: 'contain',
                            maxHeight: inFooter ? 36 : 42
                        }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                )}
                {showText && (
                    <div style={inFooter ? styles.footerLogo : styles.logo}>
                        {brand.brandNamePrefix || 'N1'}
                        <span style={{ color: themeAccent }}>{brand.brandNameAccent || 'FIT'}</span>
                    </div>
                )}
            </div>
        );
    };

    const renderSpecialCustom = (c) => {
        const layoutMode = c.layoutMode || 'card_grid';
        const columns = c.columns || 3;
        const items = c.items || [];

        return (
            <section
                key={c.id}
                id={c.id}
                style={{
                    ...styles.sectionPadding,
                    backgroundColor: c.backgroundColor || 'transparent',
                    borderTop: '1px solid #1a1d24',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                className="section-responsive"
            >
                <div style={styles.maxContainer}>
                    {/* Başlık & Rozet Alanı */}
                    {(c.title || c.subtitle || c.badgeText) && (
                        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 45px auto' }}>
                            {c.badgeText && (
                                <div style={styles.sectionEyebrow}>{c.badgeText}</div>
                            )}
                            {c.title && (
                                <h2 style={styles.sectionTitle} className="section-title-responsive">
                                    {c.title}
                                </h2>
                            )}
                            {c.subtitle && (
                                <p style={styles.paragraph}>
                                    {c.subtitle}
                                </p>
                            )}
                        </div>
                    )}

                    {/* 1. DÜZEN: SAĞLI SOLLU (TWO COLUMN - BLOG / HİKAYE / GÖRSEL + METİN) */}
                    {layoutMode === 'two_column' && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: '36px',
                            alignItems: 'center',
                            backgroundColor: '#0f1117',
                            border: '1px solid #1f2330',
                            borderRadius: '24px',
                            padding: '36px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                        }}>
                            <div>
                                {c.description && (
                                    <p style={{ color: '#d1d5db', fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '24px', whiteSpace: 'pre-line' }}>
                                        {c.description}
                                    </p>
                                )}

                                {items.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                        {items.map((item, idx) => (
                                            <div key={item.id || idx} style={{
                                                backgroundColor: '#161922',
                                                border: '1px solid #232736',
                                                borderRadius: '14px',
                                                padding: '16px 20px'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                    <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>
                                                        {item.title}
                                                    </h4>
                                                    {(item.tag || item.extraInfo) && (
                                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#ff4d5a', backgroundColor: 'rgba(229,9,20,0.12)', padding: '2px 8px', borderRadius: '6px' }}>
                                                            {item.tag || item.extraInfo}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.description && (
                                                    <p style={{ color: '#9aa0b0', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                                                        {item.description}
                                                    </p>
                                                )}
                                                {item.buttonText && (
                                                    <a
                                                        href={item.buttonLink || '#'}
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#e50914', fontSize: '0.85rem', fontWeight: '700', marginTop: 10, textDecoration: 'none' }}
                                                    >
                                                        {item.buttonText} →
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {(c.primaryButtonText || c.secondaryButtonText) && (
                                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '16px' }}>
                                        {c.primaryButtonText && (
                                            <a href={c.primaryButtonLink || '#'} style={styles.mainBtn}>
                                                {c.primaryButtonText}
                                            </a>
                                        )}
                                        {c.secondaryButtonText && (
                                            <a href={c.secondaryButtonLink || '#'} style={styles.outlineBtn}>
                                                {c.secondaryButtonText}
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', minHeight: '320px', border: '1px solid #282c3c' }}>
                                <img
                                    src={c.backgroundImage || (items[0]?.imageUrl) || '/SalonunFotolari/Salon2.jpeg'}
                                    alt={c.title || 'Özel Blok Görseli'}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'linear-gradient(to top, rgba(15,17,23,0.85) 0%, transparent 50%)'
                                }} />
                            </div>
                        </div>
                    )}

                    {/* 2. DÜZEN: ÖZEL KART IZGARASI (GRID - 1, 2, 3, 4 Sütun) */}
                    {layoutMode === 'card_grid' && (
                        <>
                            {c.description && (
                                <div style={{ textAlign: 'center', maxWidth: '750px', margin: '-20px auto 35px auto', color: '#a0a7b8', fontSize: '1rem', lineHeight: '1.7' }}>
                                    {c.description}
                                </div>
                            )}

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(auto-fit, minmax(${columns === 1 ? '100%' : columns === 2 ? '340px' : columns === 4 ? '230px' : '280px'}, 1fr))`,
                                gap: '24px'
                            }}>
                                {items.map((item, idx) => (
                                    <div
                                        key={item.id || idx}
                                        style={{
                                            backgroundColor: '#11131a',
                                            border: '1px solid #1e222d',
                                            borderRadius: '18px',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                            transition: 'transform 0.2s ease, border-color 0.2s ease'
                                        }}
                                    >
                                        {/* Kart Fotoğrafı */}
                                        {item.imageUrl && (
                                            <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.title}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                                {(item.tag || item.extraInfo) && (
                                                    <div style={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#e50914', color: '#fff', fontSize: '0.72rem', fontWeight: '800', padding: '3px 10px', borderRadius: badgeRadius }}>
                                                        {item.tag || item.extraInfo}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                            {!item.imageUrl && (item.tag || item.extraInfo) && (
                                                <div style={{ display: 'inline-block', alignSelf: 'flex-start', backgroundColor: 'rgba(229,9,20,0.15)', color: '#ff4d5a', fontSize: '0.72rem', fontWeight: '800', padding: '3px 10px', borderRadius: badgeRadius, marginBottom: 10 }}>
                                                    {item.tag || item.extraInfo}
                                                </div>
                                            )}

                                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', margin: '0 0 8px 0' }}>
                                                {item.title}
                                            </h3>

                                            {item.subtitle && (
                                                <div style={{ fontSize: '0.85rem', color: '#9aa0b0', fontWeight: '600', marginBottom: 12 }}>
                                                    {item.subtitle}
                                                </div>
                                            )}

                                            {item.description && (
                                                <p style={{ color: '#8c95a6', fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 16px 0', flex: 1 }}>
                                                    {item.description}
                                                </p>
                                            )}

                                            {item.buttonText && (
                                                <a
                                                    href={item.buttonLink || '#'}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        backgroundColor: '#1b1f29',
                                                        border: '1px solid #2b3040',
                                                        color: '#fff',
                                                        padding: '10px 18px',
                                                        borderRadius: '10px',
                                                        fontSize: '0.88rem',
                                                        fontWeight: '700',
                                                        textDecoration: 'none',
                                                        marginTop: 'auto'
                                                    }}
                                                >
                                                    {item.buttonText} →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {(c.primaryButtonText || c.secondaryButtonText) && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '40px' }}>
                                    {c.primaryButtonText && (
                                        <a href={c.primaryButtonLink || '#'} style={styles.mainBtn}>
                                            {c.primaryButtonText}
                                        </a>
                                    )}
                                    {c.secondaryButtonText && (
                                        <a href={c.secondaryButtonLink || '#'} style={styles.outlineBtn}>
                                            {c.secondaryButtonText}
                                        </a>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* 3. DÜZEN: TAM GENİŞLİKTE METİN & MAKALE (FULL TEXT) */}
                    {layoutMode === 'full_text' && (
                        <div style={{
                            maxWidth: '850px',
                            margin: '0 auto',
                            backgroundColor: '#0f1117',
                            border: '1px solid #1f2330',
                            borderRadius: '24px',
                            padding: '40px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                        }}>
                            {c.backgroundImage && (
                                <div style={{ borderRadius: '16px', overflow: 'hidden', maxHeight: '350px', marginBottom: '28px', border: '1px solid #282c3c' }}>
                                    <img src={c.backgroundImage} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            )}

                            {c.description && (
                                <div style={{ color: '#d1d5db', fontSize: '1.08rem', lineHeight: '1.9', whiteSpace: 'pre-line', marginBottom: '30px' }}>
                                    {c.description}
                                </div>
                            )}

                            {items.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '24px', borderTop: '1px solid #232736', paddingTop: '24px' }}>
                                    {items.map((item, idx) => (
                                        <div key={item.id || idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                            {item.imageUrl && (
                                                <img src={item.imageUrl} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                                            )}
                                            <div>
                                                <h4 style={{ color: '#fff', fontSize: '1.1rem', margin: '0 0 6px 0' }}>{item.title}</h4>
                                                <p style={{ color: '#9aa0b0', margin: 0, fontSize: '0.92rem', lineHeight: '1.6' }}>{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {(c.primaryButtonText || c.secondaryButtonText) && (
                                <div style={{ display: 'flex', gap: '14px', marginTop: '30px' }}>
                                    {c.primaryButtonText && (
                                        <a href={c.primaryButtonLink || '#'} style={styles.mainBtn}>
                                            {c.primaryButtonText}
                                        </a>
                                    )}
                                    {c.secondaryButtonText && (
                                        <a href={c.secondaryButtonLink || '#'} style={styles.outlineBtn}>
                                            {c.secondaryButtonText}
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        );
    };

    const themeBgStyle = (() => {
        const pattern = siteStudio.themeConfig?.backgroundPattern || 'carbon_fiber';
        if (pattern === 'carbon_fiber') {
            return {
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1.5px, transparent 1.5px)',
                backgroundSize: '24px 24px',
                backgroundColor: '#08090a',
                backgroundAttachment: 'fixed'
            };
        } else if (pattern === 'mesh_grid') {
            return {
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                backgroundColor: '#06070a',
                backgroundAttachment: 'fixed'
            };
        } else if (pattern === 'radial_glow') {
            return {
                backgroundImage: `radial-gradient(circle at 50% 0%, ${themeGlow || 'rgba(234, 179, 8, 0.25)'} 0%, rgba(8, 9, 12, 0.95) 55%, #060709 100%)`,
                backgroundColor: '#060709',
                backgroundAttachment: 'fixed'
            };
        } else {
            return { backgroundColor: '#060709' };
        }
    })();

    return (
        <div style={{ ...styles.container, ...themeBgStyle }}>
            {/* MOBİL VE RESPONSİVE GELİŞMİŞ CSS */}
            <style>{`
                .nav-links-desktop {
                    display: flex;
                    gap: 20px;
                    align-items: center;
                }
                .mobile-menu-btn {
                    display: none;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid #2a2e38;
                    border-radius: ${btnRadius};
                    color: #fff;
                    padding: 7px 9px;
                    cursor: pointer;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .mobile-menu-btn:hover, .mobile-menu-btn:active {
                    background: ${themeAccent}20;
                    border-color: ${themeAccent};
                }

                /* Mobil Menü Çekmecesi & Karartma */
                .mobile-drawer-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.78);
                    backdrop-filter: blur(6px);
                    -webkit-backdrop-filter: blur(6px);
                    z-index: 2000;
                    display: flex;
                    justify-content: flex-end;
                    animation: n1fitFadeIn 0.2s ease-out;
                }
                .mobile-drawer {
                    width: 82%;
                    max-width: 320px;
                    height: 100%;
                    background-color: #0d0f13;
                    border-left: 1px solid #222630;
                    display: flex;
                    flex-direction: column;
                    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.85);
                    animation: n1fitSlideRight 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    box-sizing: border-box;
                }
                @keyframes n1fitFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes n1fitSlideRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .mobile-drawer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid #1a1d24;
                }
                .mobile-drawer-logo {
                    font-size: 1.5rem;
                    font-weight: 900;
                    letter-spacing: 1px;
                    color: #fff;
                }
                .mobile-drawer-close {
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid #2a2e38;
                    border-radius: ${btnRadius};
                    color: #bbb;
                    padding: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .mobile-drawer-nav {
                    display: flex;
                    flex-direction: column;
                    padding: 12px 14px;
                    gap: 4px;
                    overflow-y: auto;
                    flex: 1;
                }
                .mobile-drawer-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                    padding: 13px 14px;
                    background: transparent;
                    border: none;
                    border-radius: ${btnRadius};
                    color: #eee;
                    font-size: 0.92rem;
                    font-weight: 600;
                    text-align: left;
                    cursor: pointer;
                    transition: background 0.15s, color 0.15s;
                }
                .mobile-drawer-item:active, .mobile-drawer-item:hover {
                    background: rgba(217, 4, 41, 0.12);
                    color: #ff4d6d;
                }
                .mobile-drawer-footer {
                    padding: 16px;
                    border-top: 1px solid #1a1d24;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    background: #090a0d;
                }
                .mobile-drawer-whatsapp {
                    width: 100%;
                    background-color: #25D366;
                    color: #000;
                    border: none;
                    border-radius: 8px;
                    padding: 12px;
                    font-weight: bold;
                    font-size: 0.88rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                }
                .mobile-drawer-download {
                    width: 100%;
                    background-color: rgba(217, 4, 41, 0.15);
                    color: #ff4d6d;
                    border: 1px solid #d90429;
                    border-radius: 8px;
                    padding: 12px;
                    font-weight: bold;
                    font-size: 0.88rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                }

                /* 960px altı: Tablet ve Telefon Uyumluluğu */
                @media (max-width: 960px) {
                    .nav-links-desktop {
                        display: none !important;
                    }
                    .mobile-menu-btn {
                        display: inline-flex !important;
                    }
                    .hero-stat-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 12px !important;
                        margin-top: 36px !important;
                    }
                    .app-container-responsive {
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 36px !important;
                        text-align: center !important;
                        align-items: center !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    .app-left-responsive {
                        width: 100% !important;
                        max-width: 680px !important;
                        box-sizing: border-box !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        text-align: center !important;
                    }
                    .app-title-responsive {
                        font-size: clamp(1.75rem, 5.5vw, 2.4rem) !important;
                        line-height: 1.25 !important;
                        margin-bottom: 14px !important;
                    }
                    .app-paragraph-responsive {
                        font-size: 0.98rem !important;
                        line-height: 1.65 !important;
                        max-width: 560px !important;
                        margin: 0 auto !important;
                    }
                    .app-feature-grid-responsive {
                        grid-template-columns: 1fr !important;
                        gap: 14px !important;
                        width: 100% !important;
                        max-width: 520px !important;
                        margin: 24px auto !important;
                        text-align: left !important;
                    }
                    .app-download-row-responsive {
                        width: 100% !important;
                        display: flex !important;
                        justify-content: center !important;
                    }
                    .app-download-row-responsive button {
                        width: 100% !important;
                        max-width: 420px !important;
                        justify-content: center !important;
                        box-sizing: border-box !important;
                    }
                    .app-right-responsive {
                        width: 100% !important;
                        display: flex !important;
                        justify-content: center !important;
                        align-items: center !important;
                    }
                    .phone-mockup-responsive {
                        width: 280px !important;
                        max-width: 88vw !important;
                        margin: 0 auto !important;
                        box-sizing: border-box !important;
                    }
                    .package-grid-responsive {
                        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important;
                        gap: 20px !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    .hours-grid-responsive {
                        grid-template-columns: 1fr !important;
                        gap: 20px !important;
                    }
                    .contact-wrapper-responsive {
                        grid-template-columns: 1fr !important;
                        gap: 20px !important;
                    }
                    .mission-grid-responsive {
                        grid-template-columns: 1fr !important;
                        gap: 18px !important;
                    }
                }

                /* 640px altı: Mobil Telefonlar */
                @media (max-width: 640px) {
                    .web-navbar-responsive {
                        padding: 10px 14px !important;
                    }
                    .nav-contact-text {
                        display: none;
                    }
                    .nav-contact-btn-responsive {
                        padding: 7px 10px !important;
                        border-radius: 8px !important;
                    }
                    .hero-overlay-responsive {
                        padding: 24px 14px !important;
                    }
                    .hero-btn-group-responsive {
                        flex-direction: column !important;
                        width: 100% !important;
                        gap: 10px !important;
                    }
                    .hero-btn-group-responsive button {
                        width: 100% !important;
                        justify-content: center !important;
                        padding: 14px 16px !important;
                        font-size: 0.92rem !important;
                        box-sizing: border-box !important;
                    }
                    .hero-title-responsive {
                        font-size: clamp(2rem, 8vw, 2.85rem) !important;
                    }
                    .hero-subtitle-responsive {
                        font-size: 0.95rem !important;
                        line-height: 1.6 !important;
                        margin: 16px 0 24px 0 !important;
                    }
                    .stat-card-responsive {
                        padding: 12px 10px !important;
                        text-align: center;
                    }
                    .stat-number-responsive {
                        font-size: 1.45rem !important;
                    }
                    .stat-label-responsive {
                        font-size: 0.72rem !important;
                    }
                    .section-responsive {
                        padding: 44px 12px !important;
                        overflow-x: hidden !important;
                    }
                    .section-title-responsive {
                        font-size: 1.85rem !important;
                    }
                    .filter-tab-responsive {
                        gap: 6px !important;
                    }
                    .filter-tab-btn-responsive {
                        padding: 7px 12px !important;
                        font-size: 0.78rem !important;
                    }
                    .equipment-grid-responsive {
                        grid-template-columns: 1fr !important;
                        gap: 18px !important;
                    }
                    .app-container-responsive {
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 28px !important;
                        padding: 0 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    .app-left-responsive {
                        width: 100% !important;
                        padding: 0 !important;
                        box-sizing: border-box !important;
                    }
                    .app-title-responsive {
                        font-size: 1.6rem !important;
                        line-height: 1.25 !important;
                    }
                    .app-feature-grid-responsive {
                        grid-template-columns: 1fr !important;
                        gap: 12px !important;
                        width: 100% !important;
                        margin: 20px 0 !important;
                    }
                    .app-feature-item-responsive {
                        padding: 12px 14px !important;
                        background: #11141c !important;
                        border: 1px solid #1f2533 !important;
                        border-radius: 12px !important;
                        box-sizing: border-box !important;
                        width: 100% !important;
                    }
                    .app-download-row-responsive button {
                        font-size: 0.86rem !important;
                        padding: 13px 14px !important;
                        white-space: normal !important;
                        line-height: 1.35 !important;
                        width: 100% !important;
                    }
                    .phone-mockup-responsive {
                        width: 270px !important;
                        max-width: 86vw !important;
                        margin: 0 auto !important;
                        box-sizing: border-box !important;
                    }
                    .package-grid-responsive {
                        grid-template-columns: 1fr !important;
                        gap: 22px !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                        padding: 0 !important;
                    }
                    .package-card-responsive {
                        width: 100% !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                        padding: 34px 18px 24px 18px !important;
                        margin: 0 auto !important;
                        transform: none !important;
                    }
                    .lead-card-responsive {
                        padding: 22px 14px !important;
                        box-sizing: border-box !important;
                        width: 100% !important;
                        border-radius: 14px !important;
                    }
                    .lead-title-responsive {
                        font-size: 1.25rem !important;
                        line-height: 1.35 !important;
                    }
                    .lead-form-grid-responsive {
                        grid-template-columns: 1fr !important;
                        gap: 12px !important;
                        width: 100% !important;
                    }
                    .lead-submit-row-responsive {
                        display: flex !important;
                        flex-direction: column !important;
                        width: 100% !important;
                        gap: 12px !important;
                    }
                    .lead-note-input-responsive {
                        width: 100% !important;
                        flex: 1 1 auto !important;
                        box-sizing: border-box !important;
                    }
                    .lead-submit-btn-responsive {
                        width: 100% !important;
                        white-space: normal !important;
                        text-align: center !important;
                        padding: 14px 16px !important;
                        font-size: 0.9rem !important;
                        line-height: 1.35 !important;
                        box-sizing: border-box !important;
                        display: flex !important;
                        justify-content: center !important;
                        align-items: center !important;
                    }
                    .hours-card-responsive {
                        padding: 22px 16px !important;
                    }
                    .contact-card-responsive, .map-card-responsive {
                        padding: 22px 16px !important;
                    }
                    .footer-responsive {
                        padding: 36px 16px 85px 16px !important;
                    }
                }
                @keyframes n1fitMarquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes n1fitWaPulse {
                    0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7), 0 10px 28px rgba(0,0,0,0.6); }
                    70% { box-shadow: 0 0 0 14px rgba(37, 211, 102, 0), 0 10px 28px rgba(0,0,0,0.6); }
                    100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0), 0 10px 28px rgba(0,0,0,0.6); }
                }
                @media (max-width: 640px) {
                    .floating-wa-hide-mobile {
                        display: none !important;
                    }
                    .floating-wa-label-mobile {
                        display: none !important;
                    }
                }
            `}</style>

            {/* 0. EN ÜST ACİL DUYURU & BİLGİLENDİRME ŞERİDİ (TOP BAR) */}
            {siteStudio.topBarConfig?.enabled && (
                <div style={{
                    backgroundColor: siteStudio.topBarConfig.backgroundColor || '#111520',
                    color: siteStudio.topBarConfig.textColor || '#ffffff',
                    padding: '8px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.12)',
                    zIndex: 1002,
                    position: 'relative',
                    overflow: 'hidden',
                    fontSize: '0.84rem',
                    fontWeight: '700'
                }}>
                    {siteStudio.topBarConfig.scrollingMarquee ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', whiteSpace: 'nowrap', animation: 'n1fitMarquee 24s linear infinite', width: 'max-content' }}>
                            {[0, 1].map((dup) => (
                                <div key={dup} style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', paddingRight: '40px' }}>
                                    {siteStudio.topBarConfig.badgeText && (
                                        <span style={{ backgroundColor: themeAccent, color: '#fff', padding: '2px 8px', borderRadius: badgeRadius, fontSize: '0.7rem', fontWeight: '900' }}>
                                            {siteStudio.topBarConfig.badgeText}
                                        </span>
                                    )}
                                    <span>{siteStudio.topBarConfig.text}</span>
                                    {siteStudio.topBarConfig.buttonText && (
                                        <a
                                            href={siteStudio.topBarConfig.buttonLink || '#contact'}
                                            style={{ color: '#4ade80', fontWeight: '900', textDecoration: 'underline', marginLeft: '6px' }}
                                        >
                                            {siteStudio.topBarConfig.buttonText} →
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', textAlign: 'center' }}>
                            {siteStudio.topBarConfig.badgeText && (
                                <span style={{ backgroundColor: themeAccent, color: '#fff', padding: '2px 9px', borderRadius: badgeRadius, fontSize: '0.7rem', fontWeight: '900', letterSpacing: '0.5px' }}>
                                    {siteStudio.topBarConfig.badgeText}
                                </span>
                            )}
                            <span>{siteStudio.topBarConfig.text}</span>
                            {siteStudio.topBarConfig.buttonText && (
                                <a
                                    href={siteStudio.topBarConfig.buttonLink || '#contact'}
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.14)',
                                        color: '#fff',
                                        padding: '3px 11px',
                                        borderRadius: btnRadius,
                                        fontSize: '0.75rem',
                                        fontWeight: '900',
                                        textDecoration: 'none',
                                        border: '1px solid rgba(255,255,255,0.25)'
                                    }}
                                >
                                    {siteStudio.topBarConfig.buttonText} →
                                </a>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* 1. KURUMSAL WEB SİTESİ ÜST NAVBARI */}
            {/* Sayfa Üstü Geri Sayım Bandı */}
            {siteStudio.countdownConfig?.enabled && (
                <div style={{
                    backgroundColor: siteStudio.countdownConfig.backgroundColor || '#990000',
                    color: '#fff',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    borderBottom: '1px solid rgba(255,255,255,0.2)',
                    zIndex: 1001,
                    position: 'relative'
                }}>
                    <span style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: badgeRadius, fontSize: '0.72rem', fontWeight: '900' }}>
                        {siteStudio.countdownConfig.badgeText || 'FIRSAT'}
                    </span>
                    <span>{siteStudio.countdownConfig.title}</span>
                    <CountdownTimer targetDate={siteStudio.countdownConfig.targetDate} />
                    {siteStudio.countdownConfig.buttonText && (
                        <a
                            href={siteStudio.countdownConfig.buttonLink || '#packages'}
                            style={{
                                backgroundColor: '#fff',
                                color: siteStudio.countdownConfig.backgroundColor || '#990000',
                                padding: '4px 12px',
                                borderRadius: btnRadius,
                                fontSize: '0.78rem',
                                fontWeight: '900',
                                textDecoration: 'none'
                            }}
                        >
                            {siteStudio.countdownConfig.buttonText} →
                        </a>
                    )}
                </div>
            )}

            <header style={styles.webNavbar} className="web-navbar-responsive">
                <div style={styles.navLeft}>
                    {renderBrandLogo()}
                    <nav style={styles.navLinksDesktop} className="nav-links-desktop">
                        <button type="button" onClick={() => scrollToSection('about')} style={styles.navLinkBtn}>Hakkımızda</button>
                        <button type="button" onClick={() => scrollToSection('equipment')} style={styles.navLinkBtn}>Ekipman & Alanlar</button>
                        <button type="button" onClick={() => scrollToSection('app-section')} style={styles.navLinkBtn}>Mobil Uygulama</button>
                        <button type="button" onClick={() => scrollToSection('packages')} style={styles.navLinkBtn}>Paketler</button>
                        <button type="button" onClick={() => scrollToSection('hours')} style={styles.navLinkBtn}>Kadın & Çalışma Saatleri</button>
                        <button type="button" onClick={() => scrollToSection('faq')} style={styles.navLinkBtn}>SSS</button>
                        <button type="button" onClick={() => scrollToSection('contact')} style={styles.navLinkBtn}>İletişim & Ön Kayıt</button>
                    </nav>
                </div>

                <div style={styles.navRight}>
                    <button onClick={() => handleWhatsApp('genel')} style={styles.navContactBtn} className="nav-contact-btn-responsive">
                        <MessageCircle size={16} /> <span className="nav-contact-text">WhatsApp İletişim</span>
                    </button>
                    <button
                        type="button"
                        className="mobile-menu-btn"
                        onClick={() => setMobileMenuOpen(prev => !prev)}
                        aria-label="Menü"
                    >
                        {mobileMenuOpen ? <X size={22} color="#fff" /> : <Menu size={22} color="#fff" />}
                    </button>
                </div>
            </header>

            {/* MOBİL MENÜ ÇEKMECESİ */}
            {mobileMenuOpen && (
                <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
                    <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-drawer-header">
                            {renderBrandLogo()}
                            <button
                                type="button"
                                className="mobile-drawer-close"
                                onClick={() => setMobileMenuOpen(false)}
                                aria-label="Kapat"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <nav className="mobile-drawer-nav">
                            <button
                                type="button"
                                className="mobile-drawer-item"
                                onClick={() => handleNavClick('about')}
                            >
                                <span>Hakkımızda</span>
                                <ChevronRight size={18} color="#666" />
                            </button>
                            <button
                                type="button"
                                className="mobile-drawer-item"
                                onClick={() => handleNavClick('stats')}
                            >
                                <span>Kulüp Özellikleri</span>
                                <ChevronRight size={18} color="#666" />
                            </button>
                            <button
                                type="button"
                                className="mobile-drawer-item"
                                onClick={() => handleNavClick('equipment')}
                            >
                                <span>Ekipman & Alanlar</span>
                                <ChevronRight size={18} color="#666" />
                            </button>
                            <button
                                type="button"
                                className="mobile-drawer-item"
                                onClick={() => handleNavClick('app-section')}
                            >
                                <span>Mobil Uygulama</span>
                                <ChevronRight size={18} color="#666" />
                            </button>
                            <button
                                type="button"
                                className="mobile-drawer-item"
                                onClick={() => handleNavClick('packages')}
                            >
                                <span>Vitrin Paketleri</span>
                                <ChevronRight size={18} color="#666" />
                            </button>
                            <button
                                type="button"
                                className="mobile-drawer-item"
                                onClick={() => handleNavClick('hours')}
                            >
                                <span>Kadın & Çalışma Saatleri</span>
                                <ChevronRight size={18} color="#666" />
                            </button>
                            <button
                                type="button"
                                className="mobile-drawer-item"
                                onClick={() => handleNavClick('faq')}
                            >
                                <span>Sıkça Sorulan Sorular (SSS)</span>
                                <ChevronRight size={18} color="#666" />
                            </button>
                            <button
                                type="button"
                                className="mobile-drawer-item"
                                onClick={() => handleNavClick('contact')}
                            >
                                <span>İletişim & Ücretsiz Ön Kayıt</span>
                                <ChevronRight size={18} color="#666" />
                            </button>
                        </nav>

                        <div className="mobile-drawer-footer">
                            <button
                                type="button"
                                className="mobile-drawer-whatsapp"
                                onClick={() => { handleWhatsApp('genel'); setMobileMenuOpen(false); }}
                            >
                                <MessageCircle size={18} /> WhatsApp ile Hemen Yazın
                            </button>
                            <button
                                type="button"
                                className="mobile-drawer-download"
                                onClick={() => handleNavClick('app-section')}
                            >
                                <Download size={18} /> Mobil Uygulamayı İndir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ziyaretçi Karşılama Pop-Up'ı (Admin Panelinden Yönetilebilir) */}
            <CampaignPopup config={siteStudio.popupConfig} themeConfig={siteStudio.themeConfig} />

            {/* Dinamik Konteynır Zinciri (Admin Panelinden Sıralanabilir, Eklenebilir, Gizlenebilir) */}
            {siteStudio.containers
                .filter(c => c.isActive)
                .sort((a, b) => a.order - b.order)
                .map(container => {
                    switch (container.type) {
                        case 'HERO':
                            return renderHero(container);
                        case 'APP_BODY':
                            return renderAppBody(container);
                        case 'ABOUT':
                            return renderAbout(container);
                        case 'EQUIPMENT_GALLERY':
                            return renderEquipment(container);
                        case 'HOURS':
                            return renderHours(container);
                        case 'PACKAGES':
                            return renderPackages(container);
                        case 'BANNER_CAMPAIGN':
                            return renderBanner(container);
                        case 'FAQ':
                            return renderFaq(container);
                        case 'CONTACT':
                            return renderContact(container);
                        case 'SPECIAL_CUSTOM':
                            return renderSpecialCustom(container);
                        case 'BEFORE_AFTER':
                            return renderBeforeAfter(container);
                        case 'REVIEWS':
                            return renderReviews(container);
                        case 'TRAINERS':
                            return renderTrainers(container);
                        case 'COUNTDOWN_CAMPAIGN':
                            return renderCountdownCampaign(container);
                        default:
                            return null;
                    }
                })}

            {/* 10. FOOTER */}
            <footer style={styles.footer} className="footer-responsive">
                <div style={styles.footerContent}>
                    {renderBrandLogo(true)}
                    <p style={styles.footerText}>Bahanelere yer yok, sadece sonuç var!</p>
                    <div style={styles.footerSocials}>
                        <a
                            href={siteStudio.brandConfig?.instagramUrl || "https://www.instagram.com/n1fitspormerkezi/"}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.footerSocialIconBtn}
                            title="Instagram"
                            aria-label="Instagram"
                        >
                            <InstagramIcon size={20} color="#fff" />
                        </a>
                        <a
                            href={`https://wa.me/${siteStudio.brandConfig?.whatsAppNumber || '905396078154'}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.footerSocialIconBtn}
                            title="WhatsApp"
                            aria-label="WhatsApp"
                        >
                            <WhatsAppIcon size={20} color="#fff" />
                        </a>
                        {siteStudio.brandConfig?.youTubeUrl && (
                            <a
                                href={siteStudio.brandConfig.youTubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={styles.footerSocialIconBtn}
                                title="YouTube"
                                aria-label="YouTube"
                            >
                                <YouTubeIcon size={20} color="#fff" />
                            </a>
                        )}
                    </div>
                    <div style={styles.copyright}>© 2026 N1FIT Spor Merkezi. Tüm Hakları Saklıdır. Gölyaka / Düzce</div>
                </div>
            </footer>

            {/* SAĞ ALT SABİT WHATSAPP CANLI SOHBET BALONCUĞU */}
            {siteStudio.brandConfig?.floatingWhatsAppEnabled !== false && (
                <a
                    href={`https://wa.me/${siteStudio.brandConfig?.whatsAppNumber || '905396078154'}?text=${encodeURIComponent(siteStudio.brandConfig?.floatingWhatsAppMessage || 'Merhaba, N1FIT Spor Merkezi üyelik ve salon hakkında bilgi almak istiyorum.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={siteStudio.brandConfig?.floatingWhatsAppShowOnMobile === false ? 'floating-wa-hide-mobile' : ''}
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        zIndex: 9998,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        backgroundColor: '#25D366',
                        color: '#ffffff',
                        padding: '12px 18px',
                        borderRadius: '40px',
                        textDecoration: 'none',
                        fontWeight: '900',
                        fontSize: '0.88rem',
                        animation: 'n1fitWaPulse 2.4s infinite',
                        border: '2px solid rgba(255,255,255,0.28)',
                        transition: 'transform 0.2s ease'
                    }}
                    title="WhatsApp Canlı Destek"
                >
                    <WhatsAppIcon size={22} color="#fff" />
                    <span className="floating-wa-label-mobile">
                        {siteStudio.brandConfig?.floatingWhatsAppText || 'Bize Ulaşın • WhatsApp'}
                    </span>
                </a>
            )}

            {/* Sabit Alt İndirme Banner'ı (Mobilde) */}
            <InstallAppBanner />
        </div>
    );
};

export default Home;
