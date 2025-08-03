import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

// Layout Components
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';

// Page Components
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import DashboardPage from './pages/participant/DashboardPage';
import SubmissionsPage from './pages/participant/SubmissionsPage';
import UploadPage from './pages/participant/UploadPage';
import LeaderboardPage from './pages/participant/LeaderboardPage';
import ProfilePage from './pages/participant/ProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminParticipantsPage from './pages/admin/AdminParticipantsPage';
import AdminSubmissionsPage from './pages/admin/AdminSubmissionsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Green for environmental theme
      light: '#60ad5e',
      dark: '#1b5e20',
    },
    secondary: {
      main: '#1976d2', // Blue for trust and reliability
      light: '#42a5f5',
      dark: '#1565c0',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#f44336',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '8px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

// Protected Route Component for Participants
const ProtectedParticipantRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // You can replace with a proper loading component
  }

  if (!user || user.userType !== 'participant') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Protected Route Component for Admins
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // You can replace with a proper loading component
  }

  if (!user || user.userType !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

// App Routes Component
const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route 
        path="/login" 
        element={user?.userType === 'participant' ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={user?.userType === 'participant' ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
      />
      <Route 
        path="/admin/login" 
        element={user?.userType === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <AdminLoginPage />} 
      />

      {/* Participant Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedParticipantRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedParticipantRoute>
        }
      />
      <Route
        path="/submissions"
        element={
          <ProtectedParticipantRoute>
            <MainLayout>
              <SubmissionsPage />
            </MainLayout>
          </ProtectedParticipantRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedParticipantRoute>
            <MainLayout>
              <UploadPage />
            </MainLayout>
          </ProtectedParticipantRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedParticipantRoute>
            <MainLayout>
              <LeaderboardPage />
            </MainLayout>
          </ProtectedParticipantRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedParticipantRoute>
            <MainLayout>
              <ProfilePage />
            </MainLayout>
          </ProtectedParticipantRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <AdminDashboardPage />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/participants"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <AdminParticipantsPage />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/submissions"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <AdminSubmissionsPage />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <AdminReportsPage />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
