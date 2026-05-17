import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import MemberDetail from './pages/MemberDetail';
import ProgramManager from './pages/ProgramManager';
import ExerciseLibrary from './pages/ExerciseLibrary';
import PackageLibrary from './pages/PackageLibrary';
import MemberDashboard from './pages/MemberDashboard'; // Uzantıya .jsx yazmana gerek yok dayı
import './index.css';

// =======================================================
// 🛡️ ADMİN BODYGUARD MOTORU (Geçiş Kontrolü)
// =======================================================
// Bu motor sadece token'ı olan ve rolü 'Admin' olan aslanları içeri alır.
// =======================================================
// 🛡️ ADMİN BODYGUARD MOTORU (Geçiş Kontrolü)
// =======================================================
const AdminRoute = ({ children }) => {
    const token = localStorage.getItem('n1fit_token');
    
    if (!token) return <Navigate to="/admin/login" />;

    // TÜRKÇE KARAKTER PATLAMASINI ÖNLEYEN JİLET MOTOR!
    const parseJwt = (t) => {
        try {
            const base64Url = t.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    };
    
    try {
        const payload = parseJwt(token);
        if (!payload) return <Navigate to="/admin/login" />;

        const userRole = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role;
        
        if (userRole !== 'Admin') return <Navigate to="/" />; 
        
        return children;
    } catch (error) {
        return <Navigate to="/admin/login" />;
    }
};

function App() {
  return (
    <Router>
      <Routes>
        {/* =======================================================
            🟢 MÜŞTERİ VİTRİNİ VE GİRİŞ (HERKESE AÇIK KAPILAR)
        ======================================================= */}
        <Route path="/" element={<MemberDashboard />} />
        
        {/* Adminin gizli giriş kapısı */}
        <Route path="/admin/login" element={<Login />} />


        {/* =======================================================
            🔴 ADMİN GİZLİ MEKANI (SADECE BODYGUARD'DAN GEÇENLER)
        ======================================================= */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/member/:id" element={<AdminRoute><MemberDetail /></AdminRoute>} />
        <Route path="/admin/member/:id/program" element={<AdminRoute><ProgramManager /></AdminRoute>} />
        <Route path="/admin/exercises" element={<AdminRoute><ExerciseLibrary /></AdminRoute>} />
        <Route path="/admin/packages" element={<AdminRoute><PackageLibrary /></AdminRoute>} />


        {/* =======================================================
            🗑️ 404 - YANLIŞ ADRESE GİRENİ VİTRİNE FIRLAT
        ======================================================= */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;