import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, CheckCircle, ChevronRight } from 'lucide-react';
import { isStandalonePWA, isIOSDevice, isAndroidDevice, isMobileDevice } from '../utils/pwaHelper';

const InstallAppBanner = ({ customButtonOnly = false, buttonText = "📲 Uygulamayı İndir", buttonStyle = null }) => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showIosModal, setShowIosModal] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Zaten yüklü mü?
        if (isStandalonePWA()) {
            setIsInstalled(true);
            return;
        }

        setIsMobile(isMobileDevice());

        // Daha önce bu oturumda kapatıldı mı?
        const isDismissed = sessionStorage.getItem('n1fit_install_dismissed');
        if (isDismissed) {
            setDismissed(true);
        }

        // Android / Chrome beforeinstallprompt yakalama
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            window.n1fitDeferredPrompt = e;
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
            console.log('N1FIT PWA başarıyla yüklendi.');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Globalde kayıtlı prompt varsa al
        if (window.n1fitDeferredPrompt) {
            setDeferredPrompt(window.n1fitDeferredPrompt);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async (e) => {
        if (e) e.stopPropagation();

        // 1. iOS Safari Kullanıcısı İse:
        if (isIOSDevice()) {
            setShowIosModal(true);
            return;
        }

        // 2. Android / Destekleyen Tarayıcı Kullanıcısı İse:
        const promptToUse = deferredPrompt || window.n1fitDeferredPrompt;
        if (promptToUse) {
            try {
                await promptToUse.prompt();
                const choice = await promptToUse.userChoice;
                if (choice.outcome === 'accepted') {
                    setIsInstalled(true);
                    setDeferredPrompt(null);
                    window.n1fitDeferredPrompt = null;
                }
            } catch (err) {
                console.error("Yükleme prompt hatası:", err);
            }
        } else {
            // Prompt henüz tetiklenmemiş veya tarayıcı menüsünden yapılmalıysa
            if (isAndroidDevice()) {
                alert("N1FIT uygulamasını yüklemek için Chrome menüsündeki (sağ üstteki 3 nokta ⋮) 'Uygulamayı Yükle' veya 'Ana Ekrana Ekle' seçeneğine dokunabilirsiniz.");
            } else {
                setShowIosModal(true);
            }
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        try {
            sessionStorage.setItem('n1fit_install_dismissed', 'true');
        } catch (e) {
            console.error(e);
        }
    };

    // Zaten PWA modunda çalışıyorsa hiçbir şey gösterme
    if (isInstalled) return null;

    // Sadece buton olarak çağrıldıysa
    if (customButtonOnly) {
        return (
            <>
                <button
                    type="button"
                    onClick={handleInstallClick}
                    style={buttonStyle || styles.defaultButton}
                >
                    <Download size={18} />
                    <span>{buttonText}</span>
                </button>

                {showIosModal && <IosInstallModal onClose={() => setShowIosModal(false)} />}
            </>
        );
    }

    // Kullanıcı kapattıysa veya mobil değilse alt yüzen çubuğu gösterme
    if (dismissed || !isMobile) return (
        <>
            {showIosModal && <IosInstallModal onClose={() => setShowIosModal(false)} />}
        </>
    );

    return (
        <>
            {/* MOBİL İÇİN TEMAYA UYGUN ALT YÜZEN İNDİRME ÇUBUĞU */}
            <div style={styles.floatingBanner}>
                <div style={styles.bannerContent}>
                    <div style={styles.badgeWrapper}>
                        <div style={styles.appIconBadge}>N1</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={styles.bannerTitle}>
                            N1<span style={{ color: '#d90429' }}>FIT</span> Uygulaması
                        </div>
                        <div style={styles.bannerSubtitle}>
                            Kişisel antrenman ve kalori takibi cebinde!
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        type="button"
                        onClick={handleInstallClick}
                        style={styles.installActionBtn}
                    >
                        <Download size={16} />
                        <span>İNDİR</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleDismiss}
                        style={styles.closeBtn}
                        aria-label="Kapat"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {showIosModal && <IosInstallModal onClose={() => setShowIosModal(false)} />}
        </>
    );
};

// İOS (IPHONE / IPAD) İÇİN 3 ADIMLI KURULUM MODALI
const IosInstallModal = ({ onClose }) => {
    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={styles.modalLogo}>N1</div>
                        <div>
                            <h3 style={{ margin: 0, color: 'white', fontSize: '1.15rem', fontWeight: '800' }}>
                                N1<span style={{ color: '#d90429' }}>FIT</span> iPhone'a Yükle
                            </h3>
                            <span style={{ color: '#888', fontSize: '0.78rem' }}>
                                Safari ile 5 saniyede ana ekranına ekle
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} style={styles.modalCloseBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '20px 0' }}>
                    {/* ADIM 1 */}
                    <div style={styles.stepItem}>
                        <div style={styles.stepNumber}>1</div>
                        <div style={{ flex: 1 }}>
                            <div style={styles.stepText}>
                                Safari'nin altındaki <strong style={{ color: '#38bdf8' }}>Paylaş (Share)</strong> simgesine dokunun:
                            </div>
                            <div style={styles.stepIconBox}>
                                <Share size={20} color="#38bdf8" />
                                <span style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 'bold' }}>Paylaş Butonu (Ekranın en alt ortasında)</span>
                            </div>
                        </div>
                    </div>

                    {/* ADIM 2 */}
                    <div style={styles.stepItem}>
                        <div style={styles.stepNumber}>2</div>
                        <div style={{ flex: 1 }}>
                            <div style={styles.stepText}>
                                Açılan menüyü aşağı kaydırıp <strong style={{ color: '#4ade80' }}>'Ana Ekrana Ekle'</strong> seçeneğine dokunun:
                            </div>
                            <div style={styles.stepIconBox}>
                                <PlusSquare size={20} color="#4ade80" />
                                <span style={{ color: '#4ade80', fontSize: '0.85rem', fontWeight: 'bold' }}>Ana Ekrana Ekle (Add to Home Screen)</span>
                            </div>
                        </div>
                    </div>

                    {/* ADIM 3 */}
                    <div style={styles.stepItem}>
                        <div style={styles.stepNumber}>3</div>
                        <div style={{ flex: 1 }}>
                            <div style={styles.stepText}>
                                Sağ üst köşedeki <strong style={{ color: '#fff' }}>'Ekle'</strong> butonuna dokunun.
                            </div>
                            <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '4px' }}>
                                N1FIT logosu telefonunuzun ana ekranına bir uygulama olarak yerleşecektir!
                            </div>
                        </div>
                    </div>
                </div>

                <div style={styles.modalFooter}>
                    <button onClick={onClose} style={styles.modalSuccessBtn}>
                        <CheckCircle size={18} /> Harika, Anladım!
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    defaultButton: {
        backgroundColor: '#d90429',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 18px',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 15px rgba(217, 4, 41, 0.4)',
        transition: 'all 0.2s ease'
    },
    floatingBanner: {
        position: 'fixed',
        bottom: '16px',
        left: '12px',
        right: '12px',
        backgroundColor: 'rgba(17, 17, 19, 0.96)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(217, 4, 41, 0.4)',
        borderRadius: '14px',
        padding: '12px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
        zIndex: 99999,
        boxShadow: '0 10px 35px rgba(0, 0, 0, 0.9), 0 0 20px rgba(217, 4, 41, 0.25)',
        animation: 'fadeInUp 0.3s ease-out'
    },
    bannerContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flex: 1,
        minWidth: 0
    },
    badgeWrapper: {
        flexShrink: 0
    },
    appIconBadge: {
        width: '42px',
        height: '42px',
        borderRadius: '10px',
        backgroundColor: '#d90429',
        color: 'white',
        fontWeight: '900',
        fontSize: '1.1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(217, 4, 41, 0.5)',
        letterSpacing: '1px'
    },
    bannerTitle: {
        color: 'white',
        fontWeight: '800',
        fontSize: '0.96rem',
        letterSpacing: '0.5px'
    },
    bannerSubtitle: {
        color: '#aaa',
        fontSize: '0.76rem',
        marginTop: '2px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    installActionBtn: {
        backgroundColor: '#d90429',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 14px',
        fontWeight: '900',
        fontSize: '0.85rem',
        letterSpacing: '0.5px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexShrink: 0,
        boxShadow: '0 4px 14px rgba(217, 4, 41, 0.5)'
    },
    closeBtn: {
        backgroundColor: 'transparent',
        border: 'none',
        color: '#777',
        cursor: 'pointer',
        padding: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        flexShrink: 0
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 100000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        padding: '0'
    },
    modalCard: {
        backgroundColor: '#111',
        border: '1px solid #282828',
        borderTop: '2px solid #d90429',
        borderTopLeftRadius: '22px',
        borderTopRightRadius: '22px',
        width: '100%',
        maxWidth: '500px',
        padding: '24px 20px',
        boxShadow: '0 -15px 40px rgba(0, 0, 0, 0.9)',
        boxSizing: 'border-box',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #222',
        paddingBottom: '14px'
    },
    modalLogo: {
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        backgroundColor: '#d90429',
        color: 'white',
        fontWeight: '900',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1rem'
    },
    modalCloseBtn: {
        backgroundColor: '#222',
        border: 'none',
        color: '#aaa',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
    },
    stepItem: {
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        backgroundColor: '#161616',
        padding: '12px 14px',
        borderRadius: '10px',
        border: '1px solid #242424'
    },
    stepNumber: {
        width: '26px',
        height: '26px',
        borderRadius: '50%',
        backgroundColor: '#d90429',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: '2px'
    },
    stepText: {
        color: '#ddd',
        fontSize: '0.9rem',
        lineHeight: 1.4
    },
    stepIconBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '6px',
        backgroundColor: '#0a0a0a',
        padding: '6px 10px',
        borderRadius: '6px',
        border: '1px dashed #333'
    },
    modalFooter: {
        marginTop: '20px'
    },
    modalSuccessBtn: {
        width: '100%',
        backgroundColor: '#d90429',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        padding: '14px',
        fontWeight: 'bold',
        fontSize: '1rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxShadow: '0 6px 20px rgba(217, 4, 41, 0.4)'
    }
};

export default InstallAppBanner;
