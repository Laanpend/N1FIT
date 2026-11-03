import React, { useState, useEffect } from 'react';

const CampaignPopup = ({ config, themeConfig }) => {
    const [isOpen, setIsOpen] = useState(false);

    const accentColor = themeConfig?.accentColor || '#e50914';
    const accentGlow = themeConfig?.accentGlow || 'rgba(229, 9, 20, 0.4)';
    const cornerRadius = themeConfig?.cornerStyle === 'sharp' ? '6px' : themeConfig?.cornerStyle === 'pill' ? '28px' : '22px';
    const btnRadius = themeConfig?.cornerStyle === 'sharp' ? '4px' : themeConfig?.cornerStyle === 'pill' ? '24px' : '14px';

    useEffect(() => {
        if (!config || !config.enabled) return;

        // Akıllı Zamanlama Kontrolü (Tarih Aralığı)
        if (config.autoSchedule) {
            const now = Date.now();
            if (config.startDate) {
                const startTime = new Date(config.startDate).getTime();
                if (!isNaN(startTime) && now < startTime) {
                    return; // Henüz yayın tarihi gelmedi
                }
            }
            if (config.endDate) {
                const endTime = new Date(config.endDate).getTime();
                if (!isNaN(endTime) && now > endTime) {
                    return; // Kampanya süresi doldu
                }
            }
        }

        const STORAGE_KEY = 'n1fit_campaign_popup_dismissed';
        const dismissedAt = localStorage.getItem(STORAGE_KEY);

        if (config.showFrequency === 'once_per_day' && dismissedAt) {
            const timePassed = Date.now() - parseInt(dismissedAt, 10);
            const oneDayMs = 24 * 60 * 60 * 1000;
            if (timePassed < oneDayMs) {
                return; // 24 saat geçmediyse gösterme
            }
        }

        // Sayfa açıldıktan 800ms sonra akıcı bir animasyonla aç
        const timer = setTimeout(() => {
            setIsOpen(true);
        }, 800);

        return () => clearTimeout(timer);
    }, [config]);

    const handleClose = () => {
        setIsOpen(false);
        try {
            localStorage.setItem('n1fit_campaign_popup_dismissed', Date.now().toString());
        } catch (e) {
            // LocalStorage erişim kısıtlıysa sessizce devam et
        }
    };

    const handleActionClick = () => {
        handleClose();
        if (config.buttonLink) {
            if (config.buttonLink.startsWith('#')) {
                const element = document.querySelector(config.buttonLink);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            } else {
                window.location.href = config.buttonLink;
            }
        }
    };

    if (!isOpen || !config || !config.enabled) return null;

    return (
        <div style={styles.overlay} onClick={handleClose}>
            <div
                style={{
                    ...styles.modal,
                    borderRadius: cornerRadius,
                    boxShadow: `0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px ${accentGlow}`,
                    borderColor: 'rgba(255, 255, 255, 0.12)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Kapatma Butonu */}
                <button
                    type="button"
                    style={styles.closeBtn}
                    onClick={handleClose}
                    aria-label="Kapat"
                >
                    ✕
                </button>

                {/* Kampanya Görseli (Varsa) */}
                {config.imageUrl && (
                    <div style={styles.imageContainer}>
                        <img
                            src={config.imageUrl}
                            alt={config.title || 'N1FIT Kampanya'}
                            style={styles.image}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div style={styles.imageGradient} />
                    </div>
                )}

                {/* İçerik Alanı */}
                <div style={styles.content}>
                    {config.badgeText && (
                        <div style={{
                            ...styles.badge,
                            backgroundColor: accentColor.startsWith('#') ? `${accentColor}22` : 'rgba(229, 9, 20, 0.15)',
                            borderColor: accentColor,
                            color: accentColor
                        }}>
                            <span style={{ ...styles.badgeDot, backgroundColor: accentColor }} />
                            {config.badgeText}
                        </div>
                    )}

                    <h2 style={styles.title}>{config.title || 'N1FIT Özel Fırsat!'}</h2>

                    {config.subtitle && (
                        <h4 style={{ ...styles.subtitle, color: accentColor }}>{config.subtitle}</h4>
                    )}

                    {config.description && (
                        <p style={styles.description}>{config.description}</p>
                    )}

                    <div style={styles.btnRow}>
                        <button
                            type="button"
                            style={{
                                ...styles.primaryBtn,
                                backgroundColor: accentColor,
                                borderRadius: btnRadius,
                                boxShadow: `0 8px 25px ${accentGlow}`
                            }}
                            onClick={handleActionClick}
                        >
                            {config.buttonText || 'Fırsatı İncele'}
                            <span style={{ marginLeft: 8 }}>→</span>
                        </button>

                        <button
                            type="button"
                            style={styles.secondaryBtn}
                            onClick={handleClose}
                        >
                            {config.secondaryButtonText || 'Daha Sonra'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
        animation: 'fadeIn 0.3s ease-out'
    },
    modal: {
        position: 'relative',
        backgroundColor: '#0e1015',
        border: '1px solid #2a2e39',
        width: '100%',
        maxWidth: '520px',
        overflow: 'hidden',
        animation: 'scaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column'
    },
    closeBtn: {
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 20,
        backgroundColor: 'rgba(15, 17, 23, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: '#ffffff',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '16px',
        backdropFilter: 'blur(4px)',
        transition: 'all 0.2s ease'
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: '240px',
        backgroundColor: '#161922',
        overflow: 'hidden'
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    imageGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '90px',
        background: 'linear-gradient(to top, #0e1015, transparent)'
    },
    content: {
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
    },
    badge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '20px',
        fontSize: '0.78rem',
        fontWeight: '800',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: '14px'
    },
    badgeDot: {
        width: '6px',
        height: '6px',
        borderRadius: '50%'
    },
    title: {
        color: '#ffffff',
        fontSize: '1.7rem',
        fontWeight: '900',
        letterSpacing: '-0.5px',
        lineHeight: 1.25,
        margin: '0 0 8px 0'
    },
    subtitle: {
        fontSize: '1.05rem',
        fontWeight: '700',
        margin: '0 0 12px 0'
    },
    description: {
        color: '#9aa0b0',
        fontSize: '0.92rem',
        lineHeight: 1.6,
        margin: '0 0 24px 0',
        maxWidth: '420px'
    },
    btnRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%'
    },
    primaryBtn: {
        width: '100%',
        padding: '14px',
        border: 'none',
        color: '#ffffff',
        fontSize: '1.02rem',
        fontWeight: '800',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease'
    },
    secondaryBtn: {
        width: '100%',
        padding: '10px',
        backgroundColor: 'transparent',
        border: 'none',
        color: '#6e7687',
        fontSize: '0.88rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'color 0.2s ease'
    }
};

export default CampaignPopup;
