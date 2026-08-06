import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Image, Wallet } from 'lucide-react';
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
          <p className="section-label" style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>SmartSpend AI</p>
          <h2 className="auth-left-tagline">
            Smart money, <em>smarter</em> decisions.
          </h2>
          <p>Join thousands of users who track, analyze, and understand their spending with the power of AI.</p>

          {/* Placeholder Image */}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
              className="btn btn-primary w-full center-content btn-login"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>

          <div className="auth-divider">already have an account?</div>
          <div className="auth-switch">
            <Link to="/login">Sign in instead</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
