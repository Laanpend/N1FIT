import React from 'react';
import { Home, Dumbbell, Utensils, Ruler, LogOut, LogIn, CreditCard } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab, isLoggedIn, onLogout, onOpenLogin }) => {
    const handleTabClick = (tabName) => {
        if (!isLoggedIn && tabName !== 'home') {
            onOpenLogin();
        } else {
            setActiveTab(tabName);
        }
    };

    return (
        <nav className="jilet-navbar">
            <div className="logo-kism">
                <span style={{ color: '#d90429' }}>N1</span>FIT
            </div>

            <div className="nav-links">
                <button className={`nav-item ${activeTab === 'workout' ? 'active' : ''}`} onClick={() => handleTabClick('workout')}>
                    <Dumbbell size={24} />
                    <span>Antrenman</span>
                </button>
                <button className={`nav-item ${activeTab === 'diet' ? 'active' : ''}`} onClick={() => handleTabClick('diet')}>
                    <Utensils size={24} />
                    <span>Beslenme</span>
                </button>

                <div className="center-wrapper">
                    <button className={`nav-item center-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
                        <Home size={30} />
                    </button>
                </div>

                <button className={`nav-item ${activeTab === 'measure' ? 'active' : ''}`} onClick={() => handleTabClick('measure')}>
                    <Ruler size={24} />
                    <span>Ölçülerim</span>
                </button>

                <button className={`nav-item ${activeTab === 'membership' ? 'active' : ''}`} onClick={() => handleTabClick('membership')}>
                    <CreditCard size={24} />
                    <span>Üyelik</span>
                </button>

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
