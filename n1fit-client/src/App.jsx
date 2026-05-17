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
const AdminRoute = ({ children }) => {
    const token = localStorage.getItem('n1fit_token');
    
    // Kimlik yoksa direkt kapı dışarı!
    if (!token) return <Navigate to="/admin/login" />;
    
    try {
        // Token'ın ciğerini söküp role bakıyoruz
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role;
        
        // Müşteriyse veya hıyarın tekiyse siktiri basıp vitrine yolla!
        if (userRole !== 'Admin') {
            return <Navigate to="/" />; 
        }
        
        // Aslan parçası adminmiş, buyur mekana gir!
        return children;
    } catch (error) {
        // Token patlaksa veya sahteyse yine şutla
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