import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Image, Wallet } from 'lucide-react';
import './Auth.css';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login(email, password);
      login({ email }, res.data.access_token);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <p className="section-label" style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>SmartSpend AI</p>
          <h2 className="auth-left-tagline">
            Take control of your <em>finances</em> with AI intelligence.
          </h2>
          <p>Upload your bank statements, detect anomalies, forecast spending, and get smart categorization — all in one place.</p>

          {/* Hero Image Placeholder */}
          <div className="auth-hero-image">
            <div className="auth-hero-image-icon"><Image size={36} /></div>
            <span>Your image goes here</span>
          </div>

          {/* Feature chips */}
          <div className="auth-feature-chips">
            {['AI Categorization', 'Anomaly Detection', 'Spending Forecast'].map(f => (
              <span key={f} className="auth-feature-chip">{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="logo-row">
              <div className="logo-mark-sm"><Wallet size={16} /></div>
              <span className="brand-name">SmartSpend</span>
            </div>
            <h1>Sign in</h1>
            <p>Welcome back — your dashboard awaits</p>
          </div>

          {error && <div className="auth-error mb-16">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full center-content btn-login"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="auth-divider">or</div>
          <div className="auth-switch">
            No account?{' '}
            <Link to="/register">Create one free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
