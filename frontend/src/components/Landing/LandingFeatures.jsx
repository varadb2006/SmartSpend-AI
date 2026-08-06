import { motion } from 'framer-motion';
import { Database, Zap, ShieldCheck, PieChart, Activity, Lock } from 'lucide-react';

const FEATURES = [
  {
    title: 'Automated Categorization',
    description: 'Our XGBoost model accurately tags 98% of your transactions automatically.',
    icon: <Database size={24} />,
  },
  {
    title: 'Real-time Anomaly Detection',
    description: 'Instantly get notified of duplicate charges or unusual spending patterns.',
    icon: <Zap size={24} />,
  },
  {
    title: 'Predictive Forecasting',
    description: 'Look into the future. Know exactly what your balance will be next month.',
    icon: <PieChart size={24} />,
  },
  {
    title: 'Bank-Grade Security',
    description: '256-bit encryption ensures your financial data is completely secure.',
    icon: <Lock size={24} />,
  },
  {
    title: 'Health Scoring',
    description: 'Get a daily financial health score based on your spending habits.',
    icon: <Activity size={24} />,
  },
  {
    title: 'Fraud Protection',
    description: 'Advanced ML algorithms detect potential fraud before it happens.',
    icon: <ShieldCheck size={24} />,
  }
];

export default function LandingFeatures() {
  return (
    <section id="features" className="lnd-section features-section">
      <div className="lnd-container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">Everything you need, <span>powered by AI</span></h2>
          <p className="section-sub">SmartSpend AI replaces your manual spreadsheets with intelligent, proactive financial management.</p>
        </motion.div>

        <div className="features-grid">
          {FEATURES.map((feat, i) => (
            <motion.div 
              key={i} 
              className="feature-card glass-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="feature-icon">{feat.icon}</div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
