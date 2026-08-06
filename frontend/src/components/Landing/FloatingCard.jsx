import { useCounter } from '../../hooks/useCounter';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FloatingCard({ m, idx }) {
  const raw = useCounter(m.target, 1800 + idx * 280);
  const display = `${m.prefix}${raw.toLocaleString('en-IN')}${m.suffix}`;
  
  return (
    <motion.div 
      className={`lnd-metric-wrap lnd-metric-wrap--${idx}`} 
      style={m.pos}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.6 + idx * 0.1 }}
    >
      <div className="lnd-metric">
        <div className="lnd-metric-shimmer" />
        <div className="lnd-metric-top-bar" style={{ background: m.color }} />
        <div className="lnd-metric-body">
          <div className="lnd-metric-label">{m.label}</div>
          <div className="lnd-metric-value" style={{ color: m.color }}>{display}</div>
          <div className="lnd-metric-footer">
            <Zap size={12} color={m.color} />
            <span style={{ color: m.color }}>{m.badge}</span>
          </div>
          <svg viewBox="0 0 80 24" className="lnd-sparkline" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`sp${idx}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={m.color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={m.color} stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <polyline
              points={m.spark}
              fill="none"
              stroke={`url(#sp${idx})`}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lnd-sparkline-line"
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
