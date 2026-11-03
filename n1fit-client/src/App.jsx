import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import MemberDetail from './pages/MemberDetail';
import ProgramManager from './pages/ProgramManager';
import ExerciseLibrary from './pages/ExerciseLibrary';
import PackageLibrary from './pages/PackageLibrary';
import FacilityManager from './pages/FacilityManager';
import SiteStudio from './pages/SiteStudio';
import FinanceManager from './pages/FinanceManager';
import MemberDashboard from './pages/MemberDashboard';
import Home from './pages/Home';
import { isStandalonePWA } from './utils/pwaHelper';
import './index.css';

const parseJwt = (t) => {
    try {
        const base64Url = t.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            window.atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

const AdminRoute = ({ children }) => {
    const token = localStorage.getItem('n1fit_token');

    if (!token) return <Navigate to="/admin/login" />;

    try {
        const payload = parseJwt(token);
        if (!payload) {
            localStorage.removeItem('n1fit_token');
            return <Navigate to="/admin/login" />;
        }

        if (payload.exp && payload.exp * 1000 < Date.now()) {
            localStorage.removeItem('n1fit_token');
            return <Navigate to="/admin/login" />;
        }

        const userRole = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role;

        if (userRole !== 'Admin' && userRole !== '1') return <Navigate to="/" />;

        return children;
    } catch {
        return <Navigate to="/admin/login" />;
    }
};

// Standalone PWA uygulaması mı yoksa Web Sitesi mi kontrolü
const RootRoute = () => {
    const isPwa = isStandalonePWA();
    return isPwa ? <MemberDashboard /> : <Home />;
};

// Sadece yüklü PWA uygulamasından erişime izin veren koruyucu (Web tarayıcılarından doğrudan erişilemez)
const PwaOnlyRoute = ({ children }) => {
    if (!isStandalonePWA()) {
        return <Navigate to="/" replace />;
    }
    return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Ana sayfa: Cihaza yüklü PWA ise doğrudan MemberDashboard, tarayıcıda ise kurumsal Home */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/home" element={<Home />} />
        
        {/* Üye Paneli / PWA rotaları - Web tarayıcılarından erişilemez, otomatik olarak Home'a yönlendirir */}
        <Route path="/app" element={<PwaOnlyRoute><MemberDashboard /></PwaOnlyRoute>} />
        <Route path="/member" element={<PwaOnlyRoute><MemberDashboard /></PwaOnlyRoute>} />
        <Route path="/member/dashboard" element={<PwaOnlyRoute><MemberDashboard /></PwaOnlyRoute>} />

        {/* Admin rotaları */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/login" element={<Navigate to="/admin/login" />} />

        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/member/:id" element={<AdminRoute><MemberDetail /></AdminRoute>} />
        <Route path="/admin/member/:id/program" element={<AdminRoute><ProgramManager /></AdminRoute>} />
        <Route path="/admin/exercises" element={<AdminRoute><ExerciseLibrary /></AdminRoute>} />
        <Route path="/admin/packages" element={<AdminRoute><PackageLibrary /></AdminRoute>} />
        <Route path="/admin/facilities" element={<AdminRoute><SiteStudio /></AdminRoute>} />
        <Route path="/admin/studio" element={<AdminRoute><SiteStudio /></AdminRoute>} />
        <Route path="/admin/site-studio" element={<AdminRoute><SiteStudio /></AdminRoute>} />
        <Route path="/admin/finance" element={<AdminRoute><FinanceManager /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
