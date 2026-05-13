import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, ChevronRight, PlayCircle } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('n1fit_token');

    return (
        <div style={styles.container}>
            {/* NAVBAR */}
            <nav style={styles.navbar}>
                <div style={styles.logo}>N1<span style={{color: '#d90429'}}>FIT</span></div>
                <div>
                    {token ? (
                        <button onClick={() => navigate('/member/dashboard')} style={styles.loginBtn}>Programlarım</button>
                    ) : (
                        <button onClick={() => navigate('/login')} style={styles.loginBtn}>Üye Girişi</button>
                    )}
                </div>
            </nav>

            {/* HERO SECTION */}
            <div style={styles.hero}>
                <div style={styles.overlay}>
                    <h1 style={styles.title}>SINIRLARI <br /> <span style={{color: '#d90429'}}>ZORLA!</span></h1>
                    <p style={styles.subtitle}>Kişisel antrenman programın, diyetin ve gelişim takibin tek tıkla elinin altında.</p>
                    <div style={styles.btnGroup}>
                        <button onClick={() => navigate('/login')} style={styles.mainBtn}>
                            HEMEN BAŞLA <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ÖZELLİKLER (DÜMENDEN) */}
            <div style={styles.features}>
                <div style={styles.featureCard}>
                    <Dumbbell color="#d90429" size={40} />
                    <h3>Özel Programlar</h3>
                    <p>Hocanın sana özel hazırladığı set ve tekrarlar.</p>
                </div>
                <div style={styles.featureCard}>
                    <PlayCircle color="#d90429" size={40} />
                    <h3>Videolu Anlatım</h3>
                    <p>Hangi hareketi nasıl yapacağını izleyerek öğren.</p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', fontFamily: 'Arial, sans-serif' },
    navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 50px', backgroundColor: 'rgba(0,0,0,0.8)', borderBottom: '1px solid #222' },
    logo: { fontSize: '2rem', fontWeight: 'bold', letterSpacing: '2px' },
    loginBtn: { backgroundColor: 'transparent', color: 'white', border: '1px solid #d90429', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' },
    hero: { height: '80vh', backgroundImage: 'url("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070")', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' },
    overlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '100px' },
    title: { fontSize: '5rem', margin: 0, lineHeight: 1.1 },
    subtitle: { fontSize: '1.2rem', color: '#ccc', maxWidth: '500px', margin: '20px 0' },
    mainBtn: { backgroundColor: '#d90429', color: 'white', border: 'none', padding: '15px 35px', borderRadius: '5px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
    features: { display: 'flex', justifyContent: 'center', gap: '50px', padding: '100px 50px' },
    featureCard: { textAlign: 'center', maxWidth: '250px' }
};

export default Home;