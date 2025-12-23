
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext'; // Import ThemeProvider
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Report from './pages/Report';
import Attendance from './pages/Attendance';
import LifeMinistry from './pages/LifeMinistry';
import Assignments from './pages/Assignments';
import Cleaning from './pages/Cleaning';
import Secretario from './pages/Secretario';
import PublicTalk from './pages/PublicTalk';
import Territories from './pages/Territories';
import Passages from './pages/Passages';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Menu from './pages/Menu';
import { UserRole } from './types';
import Conductors from './pages/Conductors';
import Shepherding from './pages/Shepherding';
import ReportList from './pages/ReportList';
import AttendanceList from './pages/AttendanceList';
import Resumo from './pages/Resumo'; // Import the new Resumo page
import Publishers from './pages/Publishers';


const ProtectedRoute: React.FC<{ roles: UserRole[] }> = ({ roles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/not-found" replace />;
  }

  return <Outlet />;
};


const AppContent: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-light dark:bg-dark">
                <div className="text-xl font-semibold">Carregando...</div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />} >
                <Route index element={<Dashboard />} />
                
                <Route element={<ProtectedRoute roles={[UserRole.PUBLISHER, UserRole.SERVANT]} />}>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="relatorio" element={<Report />} />
                    <Route path="assistencia" element={<Attendance />} />
                </Route>
                
                <Route element={<ProtectedRoute roles={[UserRole.SERVANT]} />}>
                    <Route path="menu" element={<Menu />} />
                    <Route path="resumo" element={<Resumo />} />
                    <Route path="vida-e-ministerio" element={<LifeMinistry />} />
                    <Route path="designacoes" element={<Assignments />} />
                    <Route path="limpeza" element={<Cleaning />} />
                    <Route path="secretario" element={<Secretario />} />
                    <Route path="secretario/relatorios" element={<ReportList />} />
                    <Route path="secretario/assistencia" element={<AttendanceList />} />
                    <Route path="publicadores" element={<Publishers />} />
                    <Route path="dirigentes" element={<Conductors />} />
                    <Route path="pastoreio" element={<Shepherding />} />
                    <Route path="discurso-publico" element={<PublicTalk />} />
                    <Route path="territorios" element={<Territories />} />
                    <Route path="passagens" element={<Passages />} />
                    <Route path="configuracoes" element={<Settings />} />
                </Route>
            </Route>

            <Route path="/not-found" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/not-found" replace />} />
        </Routes>
    );
};


const App: React.FC = () => {
  return (
    <ThemeProvider>
        <AuthProvider>
            <HashRouter>
                <AppContent/>
            </HashRouter>
        </AuthProvider>
    </ThemeProvider>
  );
};

export default App;