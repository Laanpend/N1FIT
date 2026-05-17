import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePWA } from '../hooks/usePWA';
import { Download } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab, isLoggedIn, onLogout, onOpenLogin }) => {
    const { isInstallable, installPWA } = usePWA();
    const navigate = useNavigate();

    return (
        <nav style={styles.nav}>
            <div style={styles.logo} onClick={() => setActiveTab('home')}>
                <span style={{ color: '#d90429' }}>N1</span>FIT
            </div>
            {/* <div style={styles.logo} onClick={() => setActiveTab('home')}>N1FIT</div> */}

            <div style={styles.menu}>
                {/* Herkesin görebileceği ana sayfa linki */}
                <span onClick={() => setActiveTab('home')} style={activeTab === 'home' ? styles.activeLink : styles.link}>ANA SAYFA</span>

                {/* SADECE LOGIN YAPILINCA GELECEK MÜHİMMATLAR */}
                {isLoggedIn && (
                    <>
                        <span onClick={() => setActiveTab('membership')} style={activeTab === 'membership' ? styles.activeLink : styles.link}>ÜYELİK</span>
                        <span onClick={() => setActiveTab('workout')} style={activeTab === 'workout' ? styles.activeLink : styles.link}>ANTRENMAN</span>
                        <span onClick={() => setActiveTab('diet')} style={activeTab === 'diet' ? styles.activeLink : styles.link}>BESLENME</span>
                        <span onClick={() => setActiveTab('measure')} style={activeTab === 'measure' ? styles.activeLink : styles.link}>ÖLÇÜLERİM</span>
                    </>
                )}
            </div>

            <div style={styles.auth}>
                {/* EĞER TELEFONA KURULABİLİYORSA BU FİYAKALI BUTON ÇIKACAK! */}
                {isInstallable && (
                    <button 
                        onClick={installPWA} 
                        style={{ 
                            backgroundColor: '#3b82f6', 
                            color: 'white', 
                            border: 'none', 
                            padding: '8px 15px', 
                            borderRadius: '8px', 
                            cursor: 'pointer', 
                            fontWeight: 'bold', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '5px',
                            marginRight: '15px' 
                        }}
                    >
                        <Download size={18} /> UYGULAMAYI İNDİR
                    </button>
                )}

                {isLoggedIn ? (
                    <button onClick={onLogout} style={styles.logoutBtn}>ÇIKIŞ YAP</button>
                ) : (
                    <button onClick={onOpenLogin} style={styles.loginBtn}>GİRİŞ YAP</button>
                )}
            </div>
        </nav>
    );
};

const styles = {
    nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', backgroundColor: '#000', borderBottom: '1px solid #222', position: 'sticky', top: 0, zIndex: 1000 },
    logo: { color: '#d90429', fontWeight: '900', fontSize: '1.5rem', cursor: 'pointer' },
    menu: { display: 'flex', gap: '25px' },
    link: { color: '#aaa', cursor: 'pointer', fontWeight: '600', transition: '0.3s' },
    activeLink: { color: '#d90429', cursor: 'pointer', fontWeight: '900', borderBottom: '2px solid #d90429' },
    loginBtn: { backgroundColor: '#d90429', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
    logoutBtn: { backgroundColor: 'transparent', color: '#666', border: '1px solid #444', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer' }
};

export default Navbar;