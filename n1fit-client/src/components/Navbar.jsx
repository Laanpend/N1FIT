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





// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { usePWA } from '../hooks/usePWA';
// import { Download } from 'lucide-react';

// const Navbar = ({ activeTab, setActiveTab, isLoggedIn, onLogout, onOpenLogin }) => {
//     const { isInstallable, installPWA } = usePWA();
//     const navigate = useNavigate();

//     return (
//         <nav className="jilet-navbar" style={styles.nav}>
//             <div className="logo-kism" style={styles.logo} onClick={() => setActiveTab('home')}>
//                 <span style={{ color: '#d90429' }}>N1</span>FIT
//             </div>
//             {/* <div style={styles.logo} onClick={() => setActiveTab('home')}>N1FIT</div> */}

//             <div style={styles.menu}>
//                 {/* Herkesin görebileceği ana sayfa linki */}
//                 <span onClick={() => setActiveTab('home')} style={activeTab === 'home' ? styles.activeLink : styles.link}>ANA SAYFA</span>

//                 {/* SADECE LOGIN YAPILINCA GELECEK MÜHİMMATLAR */}
//                 {isLoggedIn && (
//                     <>
//                         <span onClick={() => setActiveTab('membership')} style={activeTab === 'membership' ? styles.activeLink : styles.link}>ÜYELİK</span>
//                         <span onClick={() => setActiveTab('workout')} style={activeTab === 'workout' ? styles.activeLink : styles.link}>ANTRENMAN</span>
//                         <span onClick={() => setActiveTab('diet')} style={activeTab === 'diet' ? styles.activeLink : styles.link}>BESLENME</span>
//                         <span onClick={() => setActiveTab('measure')} style={activeTab === 'measure' ? styles.activeLink : styles.link}>ÖLÇÜLERİM</span>
//                     </>
//                 )}
//             </div>

//             <div style={styles.auth}>
//                 {/* EĞER TELEFONA KURULABİLİYORSA BU FİYAKALI BUTON ÇIKACAK! */}
//                 {isInstallable && (
//                     <button 
//                         onClick={installPWA} 
//                         style={{ 
//                             backgroundColor: '#3b82f6', 
//                             color: 'white', 
//                             border: 'none', 
//                             padding: '8px 15px', 
//                             borderRadius: '8px', 
//                             cursor: 'pointer', 
//                             fontWeight: 'bold', 
//                             display: 'flex', 
//                             alignItems: 'center', 
//                             gap: '5px',
//                             marginRight: '15px' 
//                         }}
//                     >
//                         <Download size={18} /> UYGULAMAYI İNDİR
//                     </button>
//                 )}

//                 {isLoggedIn ? (
//                     <button onClick={onLogout} style={styles.logoutBtn}>ÇIKIŞ YAP</button>
//                 ) : (
//                     <button onClick={onOpenLogin} style={styles.loginBtn}>GİRİŞ YAP</button>
//                 )}
//             </div>
//         </nav>
//     );
// };

// const styles = {
//     nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', backgroundColor: '#000', borderBottom: '1px solid #222'},
//     logo: { color: '#d90429', fontWeight: '900', fontSize: '1.5rem', cursor: 'pointer' },
//     menu: { display: 'flex', gap: '25px' },
//     link: { color: '#aaa', cursor: 'pointer', fontWeight: '600', transition: '0.3s' },
//     activeLink: { color: '#d90429', cursor: 'pointer', fontWeight: '900', borderBottom: '2px solid #d90429' },
//     loginBtn: { backgroundColor: '#d90429', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
//     logoutBtn: { backgroundColor: 'transparent', color: '#666', border: '1px solid #444', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer' }
// };

// export default Navbar;