import { Link } from 'react-router-dom';
import { IndianRupee } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="lnd-footer">
      <div className="lnd-container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="navbar-logo">
              <div className="navbar-logo-mark">
                <IndianRupee size={20} strokeWidth={2.5} color="#ffffff" />
              </div>
              <span className="navbar-logo-name">Smart<em>Spend</em></span>
              <span className="navbar-logo-version">AI</span>
            </Link>
            <p className="footer-desc">
              Production-grade financial intelligence powered by advanced machine learning models.
            </p>
            <div className="footer-socials">
              <a href="#" aria-label="Twitter">Twitter</a>
              <a href="#" aria-label="Github">GitHub</a>
              <a href="#" aria-label="LinkedIn">LinkedIn</a>
            </div>
          </div>
          
          <div className="footer-links-grid">
            <div className="footer-column">
              <h4>Product</h4>
              <Link to="#features">Features</Link>
              <Link to="#how-it-works">How it Works</Link>
              <Link to="/pricing">Pricing</Link>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <Link to="#faq">FAQ</Link>
              <Link to="/blog">Blog</Link>
              <Link to="/docs">Documentation</Link>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} SmartSpend AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
