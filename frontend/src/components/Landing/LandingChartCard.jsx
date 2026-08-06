import { motion } from 'framer-motion';

export default function LandingChartCard() {
  return (
    <motion.div 
      className="lnd-chart-wrap"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
    >
      <div className="lnd-chart-card">
        <div className="lnd-chart-card-top">
          <div>
            <div className="lnd-chart-card-label">Spending Trend</div>
            <div className="lnd-chart-card-value">₹42,380</div>
          </div>
          <div className="lnd-chart-card-badge">+18%</div>
        </div>
        <svg viewBox="0 0 240 72" className="lnd-chart-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-lime)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="var(--accent-lime)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,60 C20,60 28,42 48,38 C68,34 80,50 100,44 C120,38 132,22 152,18 C172,14 188,28 208,20 C228,12 236,6 240,4 L240,72 L0,72 Z"
            fill="url(#chartFill)"
          />
          <path
            d="M0,60 C20,60 28,42 48,38 C68,34 80,50 100,44 C120,38 132,22 152,18 C172,14 188,28 208,20 C228,12 236,6 240,4"
            stroke="var(--accent-lime)" strokeWidth="1.8" fill="none" strokeLinecap="round"
            className="lnd-chart-line"
          />
          <circle cx="240" cy="4" r="3.5" fill="var(--accent-lime)" className="lnd-chart-dot" />
          <circle cx="240" cy="4" r="7" fill="var(--accent-lime)" opacity="0.15" className="lnd-chart-dot-pulse" />
        </svg>
        <div className="lnd-mini-bars">
          {[35, 52, 41, 68, 55, 74, 48, 80, 62, 88].map((h, i) => (
            <div key={i} className="lnd-mini-bar-wrap">
              <div className="lnd-mini-bar" style={{ height: `${h}%`, animationDelay: `${i * 0.06}s` }} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
