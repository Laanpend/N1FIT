import React from 'react';
import { usePWA } from '../hooks/usePWA';
import { Download, Home, Dumbbell, Utensils, Ruler, LogOut, LogIn, CreditCard } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab, isLoggedIn, onLogout, onOpenLogin }) => {
    const { isInstallable, installPWA } = usePWA();

    // AHA SİLAH BURADA! Tıklanan sekme gizliyse (giriş yoksa) login modalını patlat!
    const handleTabClick = (tabName) => {
        if (!isLoggedIn && tabName !== 'home') {
            // Kimliği yoksa içeri alma, kapıdaki bodyguard'a (Login Modalına) yönlendir amq!
            onOpenLogin();
        } else {
            // Kimliği varsa veya ana sayfaya basıyorsa paşalar gibi geçir
            setActiveTab(tabName);
        }
    };

    return (
        <nav className="jilet-navbar">
            <div className="logo-kism">
                <span style={{ color: '#d90429' }}>N1</span>FIT
            </div>

            {isInstallable && (
                <button className="pwa-btn" onClick={installPWA}>
                    <Download size={18} /> İNDİR
                </button>
            )}

            <div className="nav-links">
                {/* ================= SOL KANAT ================= */}
                <button className={`nav-item ${activeTab === 'workout' ? 'active' : ''}`} onClick={() => handleTabClick('workout')}>
                    <Dumbbell size={24} />
                    <span>İdman</span>
                </button>
                <button className={`nav-item ${activeTab === 'diet' ? 'active' : ''}`} onClick={() => handleTabClick('diet')}>
                    <Utensils size={24} />
                    <span>Diyet</span>
                </button>

                {/* ================= KRAL BUTON (ANA SAYFA) ================= */}
                <div className="center-wrapper">
                    <button className={`nav-item center-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
                        <Home size={30} />
                    </button>
                </div>

                {/* ================= SAĞ KANAT ================= */}
                <button className={`nav-item ${activeTab === 'measure' ? 'active' : ''}`} onClick={() => handleTabClick('measure')}>
                    <Ruler size={24} />
                    <span>Ölçü</span>
                </button>
                
                {/* ÜYELİK BUTONU (Eksik olan mühimmatı buraya çaktık) */}
                <button className={`nav-item ${activeTab === 'membership' ? 'active' : ''}`} onClick={() => handleTabClick('membership')}>
                    <CreditCard size={24} />
                    <span>Üyelik</span>
                </button>
                
                {/* ================= GİRİŞ / ÇIKIŞ ================= */}
                {isLoggedIn ? (
                    <button className="nav-item" onClick={onLogout}>
                        <LogOut size={24} />
                        <span>Çıkış</span>
                    </button>
                ) : (
                    <button className="nav-item" onClick={onOpenLogin}>
                        <LogIn size={24} />
                        <span>Giriş</span>
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
