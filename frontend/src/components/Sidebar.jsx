import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ArrowRightLeft, Upload, PieChart, Wallet, LogOut, BrainCircuit } from 'lucide-react';
import './Sidebar.css';


const mainNav = [
  { icon: LayoutDashboard, label: 'Dashboard',    to: '/dashboard' },
  { icon: ArrowRightLeft, label: 'Transactions', to: '/transactions' },
  { icon: Upload, label: 'Upload',        to: '/upload' },
];

const aiNav = [
  { icon: PieChart, label: 'Analytics',    to: '/analytics' },
  { icon: BrainCircuit, label: 'AI Advisor',   to: '/advisor' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark"><Wallet size={20} /></div>
        <div className="logo-text">Smart<span>Spend</span></div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu</div>
        {mainNav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon"><item.icon size={20} /></span>
            {item.label}
          </NavLink>
        ))}

        <div className="nav-divider" />
        <div className="nav-section-label">AI Features</div>
        {aiNav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon"><item.icon size={20} /></span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{user?.full_name || user?.email}</div>
          <div className="user-role">Member</div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout"><LogOut size={20} /></button>
      </div>
    </aside>
  );
}
