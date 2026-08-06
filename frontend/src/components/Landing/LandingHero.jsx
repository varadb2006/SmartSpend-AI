import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Network, ShieldCheck, TrendingUp, ArrowRight } from 'lucide-react';
import TypingText from './TypingText';

export default function LandingHero() {
  const words = [
    'forecasted.',
    'protected.',
    'categorized.',
    'optimized.',
  ];

  return (
    <div className="lnd-left-body">
      <motion.h1 
        className="lnd-headline"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        Your money,<br />
        <TypingText words={words} />
      </motion.h1>

      <motion.p 
        className="lnd-sub"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      >
        Three production-grade ML models working behind every transaction — categorizing spend, detecting anomalies, and forecasting your next month.
      </motion.p>

      <motion.div 
        className="lnd-cta-row"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      >
        <Link to="/register" className="lnd-btn-cta">
          Start for free
          <ArrowRight size={18} strokeWidth={2} />
        </Link>
        <Link to="/login" className="lnd-btn-outline">
          Sign in
        </Link>
      </motion.div>

      <motion.div 
        className="lnd-models-list"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
      >
        <div className="lnd-model-tag">
          <div className="lnd-mt-icon"><Network size={18} /></div>
          <div><strong>XGBoost</strong><span>Categorize</span></div>
        </div>
        <div className="lnd-model-tag">
          <div className="lnd-mt-icon"><ShieldCheck size={18} /></div>
          <div><strong>DBSCAN</strong><span>Anomalies</span></div>
        </div>
        <div className="lnd-model-tag">
          <div className="lnd-mt-icon"><TrendingUp size={18} /></div>
          <div><strong>SVR</strong><span>Forecast</span></div>
        </div>
      </motion.div>

      <motion.div 
        className="lnd-stats-strip"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
      >
        <div>
          <div className="lnd-stat-v">95%</div>
          <div className="lnd-stat-lbl">ACCURACY</div>
        </div>
        <div>
          <div className="lnd-stat-v">3<small>s</small></div>
          <div className="lnd-stat-lbl">UPLOAD</div>
        </div>
        <div>
          <div className="lnd-stat-v">₹0</div>
          <div className="lnd-stat-lbl">COST</div>
        </div>
      </motion.div>
    </div>
  );
}
