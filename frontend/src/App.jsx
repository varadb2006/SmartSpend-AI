import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Upload from './pages/Upload';
import Analytics from './pages/Analytics';
import Advisor from './pages/Advisor';
import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(8,8,14,0.95)',
              color: '#f5f5f5',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '13px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)'
            },
            success: { iconTheme: { primary: '#C8F135', secondary: '#080808' } },
            error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/"             element={<Landing />} />
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/upload"       element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/analytics"    element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/advisor"      element={<ProtectedRoute><Advisor /></ProtectedRoute>} />
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
