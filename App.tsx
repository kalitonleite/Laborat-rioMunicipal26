
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MedicalLoginPage from './pages/MedicalLoginPage';
import ReceptionLoginPage from './pages/ReceptionLoginPage';
import MedicalRegisterPage from './pages/MedicalRegisterPage';
import ReceptionRegisterPage from './pages/ReceptionRegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminRegisterPage from './pages/AdminRegisterPage';
import PatientDashboard from './pages/PatientDashboard';
import MedicalDashboard from './pages/MedicalDashboard';
import ReceptionDashboard from './pages/ReceptionDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';
import { User, UserRole } from './types';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './services/supabase';

interface ProtectedRouteProps {
  user: User | null;
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, allowedRoles, children }) => {
  if (!user) return <Navigate to="/" />;
  if (!allowedRoles.includes(user.role)) {
    // Redirect to their appropriate dashboard if they try to access a wrong one
    // Stop the loop: Don't redirect to dashboard if already rejected. Show forbidden.
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-slate-800">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border border-gray-100">
          <i className="fas fa-lock text-4xl text-red-500 mb-4"></i>
          <h2 className="text-xl font-black text-slate-800 mb-2">Acesso Negado / Access Denied</h2>
          <p className="text-sm text-gray-500 font-medium mb-6">
            Seu perfil <strong>{user.role}</strong> não tem permissão para acessar esta página.
          </p>
          <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all">
            Voltar ao Início
          </a>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const { user, loading, signOut, fetchProfile } = useAuth();

  const handleUpdateUser = async (updatedUser: User) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updatedUser.name,
          avatar: updatedUser.avatar,
          // role and cpf should normally not be editable by the user directly here without checks
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        alert('Erro ao atualizar perfil.');
      } else {
        await fetchProfile(user.id);
        alert('Perfil atualizado com sucesso!');
      }
    } catch (err) {
      console.error('Unexpected error updating profile:', err);
      alert('Erro inesperado ao atualizar.');
    }
  };

  useEffect(() => {
    // Se quiser manter algum efeito global, pode colocar aqui
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center"><i className="fas fa-spinner fa-spin text-4xl text-blue-900"></i></div>;


  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" /> : <LoginPage onLogin={() => { }} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" /> : <RegisterPage onLogin={() => { }} />}
        />

        {/* Medical Routes */}
        <Route
          path="/medical/login"
          element={user ? <Navigate to="/dashboard" /> : <MedicalLoginPage onLogin={() => { }} />}
        />
        <Route
          path="/medical/register"
          element={user ? <Navigate to="/dashboard" /> : <MedicalRegisterPage onLogin={() => { }} />}
        />

        {/* Reception Routes */}
        <Route
          path="/reception/login"
          element={user ? <Navigate to="/dashboard" /> : <ReceptionLoginPage onLogin={() => { }} />}
        />
        <Route
          path="/reception/register"
          element={user ? <Navigate to="/dashboard" /> : <ReceptionRegisterPage onLogin={() => { }} />}
        />

        {/* Admin Routes */}
        <Route
          path="/admin/login"
          element={user ? <Navigate to="/dashboard" /> : <AdminLoginPage onLogin={() => { }} />}
        />
        <Route
          path="/admin/register"
          element={user ? <Navigate to="/dashboard" /> : <AdminRegisterPage onLogin={() => { }} />}
        />

        {/* Dashboard Entry Point (Role Redirector) */}
        <Route
          path="/dashboard"
          element={
            user ? (
              user.role === UserRole.PATIENT ? <Navigate to="/patient" /> :
                user.role === UserRole.MEDICAL ? <Navigate to="/medical" /> :
                  user.role === UserRole.RECEPTION ? <Navigate to="/reception" /> :
                    user.role === UserRole.ADMIN ? <Navigate to="/admin" /> :
                      <div className="flex h-screen items-center justify-center flex-col gap-4">
                        <i className="fas fa-triangle-exclamation text-4xl text-amber-500"></i>
                        <p className="font-bold text-slate-600">Perfil de usuário sem permissão definida.</p>
                        <button onClick={signOut} className="text-blue-600 hover:underline">Sair</button>
                      </div>
            ) : <Navigate to="/" />
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute user={user} allowedRoles={[UserRole.PATIENT]}>
              <Layout user={user!} onLogout={signOut}>
                <PatientDashboard user={user!} onUpdateUser={handleUpdateUser} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/medical"
          element={
            <ProtectedRoute user={user} allowedRoles={[UserRole.MEDICAL]}>
              <Layout user={user!} onLogout={signOut}>
                <MedicalDashboard user={user!} onUpdateUser={handleUpdateUser} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reception"
          element={
            <ProtectedRoute user={user} allowedRoles={[UserRole.RECEPTION]}>
              <Layout user={user!} onLogout={signOut}>
                <ReceptionDashboard user={user!} onUpdateUser={handleUpdateUser} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN]}>
              <Layout user={user!} onLogout={signOut}>
                <AdminDashboard user={user!} onUpdateUser={handleUpdateUser} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};


export default App;
