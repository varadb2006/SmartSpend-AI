import React, { forwardRef } from 'react';
import { Network, ShieldCheck, TrendingUp, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';

const NODES = [
  { Icon: Network, name: 'XGBoost', role: 'Categorize' },
  { Icon: ShieldCheck, name: 'DBSCAN', role: 'Anomalies' },
  { Icon: TrendingUp, name: 'SVR', role: 'Forecast' },
];

const LandingOrbit = forwardRef((props, ref) => {
  return (
    <motion.div 
      className="lnd-orbital" 
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="lnd-radar-sweep" />
      <div className="lnd-orb-ring lnd-orb-ring--1">
        <div className="lnd-orb-dot" style={{ background: 'var(--accent-lime)' }} />
      </div>
      <div className="lnd-orb-ring lnd-orb-ring--2">
        <div className="lnd-orb-dot" style={{ background: '#10b981' }} />
      </div>
      <div className="lnd-orb-ring lnd-orb-ring--3">
        <div className="lnd-orb-dot" style={{ background: '#f59e0b' }} />
      </div>

      {NODES.map(({ Icon, name, role }, i) => (
        <div key={name} className={`lnd-orb-node lnd-orb-node--${i + 1}`}>
          <div className="lnd-node-glow" />
          <div className="lnd-node-icon"><Icon size={16} /></div>
          <span className="lnd-node-name">{name}</span>
          <span className="lnd-node-role">{role}</span>
        </div>
      ))}

      <div className="lnd-orb-core">
        <div className="lnd-core-icon"><IndianRupee size={26} color="#ffffff" /></div>
      </div>
    </motion.div>
  );
});

export default LandingOrbit;
