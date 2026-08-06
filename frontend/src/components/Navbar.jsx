import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);


  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', path: '#features' },
    { name: 'How it Works', path: '#how-it-works' },
    { name: 'Testimonials', path: '#testimonials' },
    { name: 'FAQ', path: '#faq' },
  ];

  return (
    <motion.header 
      className={`navbar-global ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-mark">
            <IndianRupee size={20} strokeWidth={2.5} color="#ffffff" />
          </div>
          <span className="navbar-logo-name">Smart<em>Spend</em></span>
          <span className="navbar-logo-version">AI</span>
        </Link>

        <nav className="navbar-center-links">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.path}
              className="navbar-center-link"
            >
              {link.name}
            </a>
          ))}
        </nav>

        <div className="navbar-actions">
          <Link to="/login" className="navbar-link">Sign in</Link>
          <Link to="/register" className="btn btn-primary">
            Get started
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
