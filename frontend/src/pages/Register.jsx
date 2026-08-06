import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Wallet, CheckCircle2, Loader2 } from 'lucide-react';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authAPI.register({ email: form.email, password: form.password, full_name: form.full_name });
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
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
            Smart money, <em>smarter</em> decisions.
          </h2>
          <p>Join thousands of users who track, analyze, and understand their spending with the power of AI.</p>

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
            <h1>Create account</h1>
            <p>Start managing your finances smartly</p>
          </div>

          {error && <div className="auth-error mb-16">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Full Name</label>
              <input className="input" type="text" placeholder="Jane Doe" value={form.full_name} onChange={update('full_name')} required />
            </div>
            <div className="input-group">
              <label>Email address</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={update('email')} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="input-group">
                <label>Password</label>
                <input className="input" type="password" placeholder="Min. 6 chars" value={form.password} onChange={update('password')} required minLength={6} />
              </div>
              <div className="input-group">
                <label>Confirm</label>
                <input className="input" type="password" placeholder="••••••••" value={form.confirm} onChange={update('confirm')} required />
              </div>
            </div>
            <button
              type="submit"
              className="btn-login"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} style={{ marginRight: '8px' }} />
                  Creating account...
                </>
              ) : 'Create Account →'}
            </button>
          </form>

          <div className="auth-divider">already have an account?</div>
          <div className="auth-switch">
            <Link to="/login">Sign in instead</Link>
          </div>

          <div className="auth-terms">
            By creating an account, you agree to our <br />
            <a href="#" onClick={e => e.preventDefault()}>Terms of Service</a> and <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
