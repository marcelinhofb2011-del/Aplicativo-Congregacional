import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import { ScheduleProvider } from './contexts/ScheduleContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
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
import Resumo from './pages/Resumo';
import Publishers from './pages/Publishers';
import Announcements from './pages/Announcements';
import SpeechRecord from './pages/SpeechRecord';
import Pioneer from './pages/Pioneer';




const RoleProtectedRoute: React.FC<{ roles: UserRole[] }> = ({ roles }) => {
  const { user } = useAuth();
  
  if (!user || (roles.length > 0 && !roles.includes(user.role))) {
    return <Navigate to="/not-found" replace />;
  }

  return <Outlet />;
};


const AppContent: React.FC = () => {
    const { user, loading: authLoading } = useAuth();

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-light dark:bg-dark">
                <div className="text-xl font-semibold">Carregando...</div>
            </div>
        );
    }

    return (
        <Routes>
            {!user ? (
                <>
                    <Route path="/login" element={<Login />} />
                    <Route path="/cadastro" element={<Register />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </>
            ) : (
                <>
                    <Route path="/" element={<Layout />} >
                        <Route index element={<Dashboard />} />
                        
                        <Route element={<RoleProtectedRoute roles={[UserRole.PUBLISHER, UserRole.SERVANT]} />}>
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="pioneiro" element={<Pioneer />} />
                            <Route path="relatorio" element={<Report />} />
                            <Route path="assistencia" element={<Attendance />} />
                            <Route path="menu" element={<Menu />} />
                            <Route path="resumo" element={<Resumo />} />
                            <Route path="vida-e-ministerio" element={<LifeMinistry />} />
                            <Route path="designacoes" element={<Assignments />} />
                            <Route path="limpeza" element={<Cleaning />} />
                            <Route path="secretario" element={<Secretario />} />
                            <Route path="secretario/relatorios" element={<ReportList />} />
                            <Route path="secretario/assistencia" element={<AttendanceList />} />
                                                        <Route path="secretario/registro-discurso" element={<SpeechRecord />} />
                            
                            
                            <Route path="dirigentes" element={<Conductors />} />
                            <Route path="discurso-publico" element={<PublicTalk />} />
                            <Route path="territorios" element={<Territories />} />
                            <Route path="passagens" element={<Passages />} />
                            <Route path="anuncios" element={<Announcements />} />
                            <Route path="configuracoes" element={<Settings />} />
                        </Route>
                        
                        <Route element={<RoleProtectedRoute roles={[UserRole.SERVANT]} />}>
                            <Route path="publicadores" element={<Publishers />} />
                        </Route>
                    </Route>

                    <Route path="/not-found" element={<NotFound />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </>
            )}
        </Routes>
    );
};


const App: React.FC = () => {
  return (
    <HashRouter>
        <ThemeProvider>
            <AuthProvider>
                <ScheduleProvider>
                    <AppContent/>
                </ScheduleProvider>
            </AuthProvider>
        </ThemeProvider>
    </HashRouter>
  );
};

export default App;