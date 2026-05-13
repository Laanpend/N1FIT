// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';
import MemberDetail from './pages/MemberDetail';
import ProgramManager from './pages/ProgramManager';
import ExerciseLibrary from './pages/ExerciseLibrary';
import PackageLibrary from './pages/PackageLibrary';
import Home from './pages/Home';
import MemberDashboard from './pages/MemberDashboard.jsx';

function App() {

  return (
    <Router>
      <Routes>
        {/* Giriş sayfası */}
        <Route path="/login" element={<Login />} />

        {/* Admin Paneli */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />


        {/* Boş adrese girerse otomatik Login'e atsın */}
        <Route path="/" element={<Navigate to="/login" />} />

        // Routes içine ekle:

        <Route path="/exercises" element={<ExerciseLibrary />} />
        
        <Route path="/admin/member/:id" element={<MemberDetail />} />

        <Route path="/admin/member/:id/program" element={<ProgramManager />} />

        <Route path="/admin/exercises" element={<ExerciseLibrary />} />

        <Route path="/admin/packages" element={<PackageLibrary />} />

        <Route path="/" element={<Home />} />

        <Route path="/member" element={<MemberDashboard />} />

        <Route path="/admin/member/:id" element={<MemberDetail />} />
      </Routes>
    </Router>
  );
}

export default App;