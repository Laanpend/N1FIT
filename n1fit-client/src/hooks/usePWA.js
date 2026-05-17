import { useState, useEffect } from 'react';

export const usePWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            // Tarayıcının kendi kendine çıkardığı o sikko uyarıyı engelle!
            e.preventDefault();
            // Mermiyi cebimize koyuyoruz
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Eğer adam uygulamayı başarıyla kurarsa tetiklenir
        window.addEventListener('appinstalled', () => {
            setDeferredPrompt(null);
            setIsInstallable(false);
            console.log('N1FIT Telefona İndi Aslanım!');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const installPWA = async () => {
        if (!deferredPrompt) return;
        
        // Müşterinin önüne o "Ana Ekrana Ekle" sorusunu fırlat!
        deferredPrompt.prompt();
        
        // Adamın ne cevap verdiğini bekle
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('Adam dükkanı ana ekrana kurdu!');
        } else {
            console.log('Adam vazgeçti amq!');
        }
        
        // Soru sorulduğu için mermiyi boşa çıkar
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    return { isInstallable, installPWA };
};