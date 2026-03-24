import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Onboarding } from './pages/Onboarding';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Quiz } from './pages/Quiz';
import { Dashboard } from './pages/Dashboard';
import { FoodSearch } from './pages/FoodSearch';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { AddMeal } from './pages/AddMeal';
import { WorkoutPlanner } from './pages/WorkoutPlanner';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { FoodScanner } from './pages/Scanner';
import { ScanResult } from './pages/ScanResult';
import { Notifications } from './pages/Notifications';
import { Account } from './pages/Account';
import { WorkoutSession } from './pages/WorkoutSession';
import { NotificationPrompt } from './components/NotificationPrompt';
import { ThemeProvider } from './context/ThemeContext';
import { Preferences } from './pages/Preferences';
import { AIChat } from './pages/AIChat';
import LandingPage from './pages/LandingPage';
import { AcceptInvite } from './pages/AcceptInvite';
import ActivateAccount from './pages/ActivateAccount';
import { Plans } from './pages/Plans';
import Checkout from './pages/Checkout';
import { Achievements } from './pages/Achievements';
import { Invitations } from './pages/Invitations';
import { Upgrade } from './pages/Upgrade';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

// Admin Imports
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPlans from './pages/admin/AdminPlans';
import AdminFoods from './pages/admin/AdminFoods';
import AdminLogs from './pages/admin/AdminLogs';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminMRR from './pages/admin/AdminMRR';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminDishes from './pages/admin/AdminDishes';
import { AdminSupport } from './pages/admin/AdminSupport';
import { AdminThemeProvider } from './context/AdminThemeContext';
import AdminWorkouts from './pages/admin/AdminWorkouts';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isAuthenticated, isLoading, authLoading, totalUsersCount } = useAuth();
  
  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-[var(--bg-app)] transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-[#56AB2F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Paywall Check: Bloquear se o plano não estiver ativo
  // Admin sempre tem acesso
  const allowedWhenBlocked = ['/upgrade', '/plans', '/checkout', '/profile', '/account', '/notifications', '/convites'];
  const currentPath = window.location.pathname;
  const isPlanInactive = user?.plan_status !== 'active' && user?.role !== 'admin';

  if (isPlanInactive && !allowedWhenBlocked.some(path => currentPath.startsWith(path))) {
    return <Navigate to="/plans" replace />;
  }

  // Onboarding Check: Force users to quiz if not completed
  const { checkOnboardingStatus } = useAuth();
  const isOnboardingCompleted = checkOnboardingStatus();
  
  if (!isOnboardingCompleted && currentPath !== '/quiz' && currentPath !== '/onboarding' && user?.role !== 'admin') {
    return <Navigate to="/quiz" replace />;
  }

  return children;
};

const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading, authLoading } = useAuth();
  
  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-[var(--bg-app)] transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-[#56AB2F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    const { checkOnboardingStatus, user } = useAuth();
    if (!checkOnboardingStatus() && user?.role !== 'admin') {
        return <Navigate to="/quiz" replace />;
    }
    if (user?.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return children;
};

const AdminProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isAuthenticated, isLoading, authLoading } = useAuth();
  
  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-[var(--bg-app)] transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-[#56AB2F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const RootRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-[var(--bg-app)]">
        <div className="w-12 h-12 border-4 border-[#56AB2F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se já estiver logado, sempre vai para o dashboard
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  // Se for PWA (standalone) mas não estiver logado, vai para o login (nunca mostra a página de vendas)
  if (isStandalone) {
    return <Navigate to="/login" replace />;
  }

  // Caso contrário (navegador + deslogado), mostra a landing page
  return <LandingPage />;
};

import { neonAuth } from './services/auth';

function App() {
  return (
    <AuthProvider>
    <ThemeProvider>
      <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/activate" element={<PublicRoute><ActivateAccount /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/accept-invite" element={<PublicRoute><AcceptInvite /></PublicRoute>} />
        
        {/* Protected Routes */}
        {/* Main Entry Points */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/home" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
        <Route path="/add-meal" element={<ProtectedRoute><FoodSearch /></ProtectedRoute>} />
        <Route path="/log-meal" element={<ProtectedRoute><AddMeal /></ProtectedRoute>} />
        <Route path="/workout" element={<ProtectedRoute><WorkoutPlanner /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/scanner" element={<ProtectedRoute><FoodScanner /></ProtectedRoute>} />
        <Route path="/scan-result" element={<ProtectedRoute><ScanResult /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/workout/session/:day" element={<ProtectedRoute><WorkoutSession /></ProtectedRoute>} />
        <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
        <Route path="/ai-chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
        <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
        <Route path="/convites" element={<ProtectedRoute><Invitations /></ProtectedRoute>} />
        <Route path="/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminProtectedRoute><AdminThemeProvider><AdminLayout /></AdminThemeProvider></AdminProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetail />} />
          <Route path="workouts" element={<AdminWorkouts />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="foods" element={<AdminFoods />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="mrr" element={<AdminMRR />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="dishes" element={<AdminDishes />} />
          <Route path="support" element={<AdminSupport />} />
        </Route>

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <NotificationPrompt />
      <PWAInstallPrompt />
      <Toaster position="top-center" />
      </BrowserRouter>
    </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
