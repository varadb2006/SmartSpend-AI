import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Wallet, CheckCircle2, Loader2 } from 'lucide-react';
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
          <p className="section-label">SmartSpend AI</p>
          <h2 className="auth-left-tagline">
            Take control of your <em>finances</em> with AI intelligence.
          </h2>
          <p>Upload your bank statements, detect anomalies, forecast spending, and get smart categorization — all in one place.</p>

          <div className="auth-hero-illustration">
            <svg width="340" height="240" viewBox="0 0 340 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="20" y="20" width="300" height="200" rx="16" fill="#1E2330" stroke="#333A4A" strokeWidth="2"/>
              <rect x="40" y="40" width="260" height="30" rx="6" fill="#2A3142"/>
              <circle cx="60" cy="55" r="5" fill="#4B5563"/>
              <circle cx="80" cy="55" r="5" fill="#4B5563"/>
              <circle cx="100" cy="55" r="5" fill="#4B5563"/>
              <rect x="40" y="90" width="120" height="110" rx="8" fill="#2A3142"/>
              <rect x="180" y="90" width="120" height="50" rx="8" fill="#2A3142"/>
              <rect x="180" y="150" width="120" height="50" rx="8" fill="#2A3142"/>
              <path d="M55 180 L80 140 L105 160 L140 110" stroke="#C8F135" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="140" cy="110" r="4" fill="#C8F135"/>
              <rect x="195" y="105" width="90" height="6" rx="3" fill="#4B5563"/>
              <rect x="195" y="120" width="60" height="6" rx="3" fill="#4B5563"/>
              <rect x="195" y="165" width="70" height="6" rx="3" fill="#4B5563"/>
              <rect x="195" y="180" width="80" height="6" rx="3" fill="#4B5563"/>
              <circle cx="280" cy="115" r="12" fill="#1B74FD" fillOpacity="0.8"/>
            </svg>
          </div>

          {/* Feature chips */}
          <div className="auth-feature-chips">
            {['AI Categorization', 'Anomaly Detection', 'Spending Forecast'].map(f => (
              <span key={f} className="auth-feature-chip">
                <CheckCircle2 size={16} />
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="logo-row">
              <div className="logo-mark-sm"><Wallet size={18} /></div>
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
            
            <div className="auth-options">
              <label className="auth-checkbox">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="auth-forgot" onClick={e => e.preventDefault()}>Forgot password?</a>
            </div>

            <button
              type="submit"
              className="btn-login"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} style={{ marginRight: '8px' }} />
                  Signing in...
                </>
              ) : 'Sign In →'}
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
