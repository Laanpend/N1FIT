// PWA ve Cihaz Tespit Yardımcısı

export const isStandalonePWA = () => {
    if (typeof window === 'undefined') return false;

    // 1. Standart Display Mode Kontrolü (Yüklü PWA)
    const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches;

    // 2. iOS Safari WebApp Kontrolü (Ana Ekrana Eklenen PWA)
    const isIosStandalone = window.navigator?.standalone === true;

    // 3. Android Uygulama / TWA Kontrolü
    const isAndroidStandalone = document.referrer.includes('android-app://');

    // Sadece gerçekten cihazda kurulu olan PWA ise true döner; URL query ile aşılamaz!
    return isStandaloneDisplay || isIosStandalone || isAndroidStandalone;
};

export const isIOSDevice = () => {
    if (typeof window === 'undefined' || !navigator) return false;
    return /iPhone|iPad|iPod/i.test(navigator.userAgent || '') && !window.MSStream;
};

export const isAndroidDevice = () => {
    if (typeof window === 'undefined' || !navigator) return false;
    return /Android/i.test(navigator.userAgent || '');
};

export const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return isIOSDevice() || isAndroidDevice() || window.innerWidth <= 768;
};
