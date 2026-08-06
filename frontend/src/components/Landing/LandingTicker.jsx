import { motion } from 'framer-motion';

export default function LandingTicker() {
  const items = [
    'Total Spending ₹42,380',
    'Income ₹68,000',
    'Anomalies Detected: 3',
    'Forecast: ₹38,200',
    'Categorization Accuracy 95%',
    'Models: XGBoost · DBSCAN · SVR',
    'Upload Time 3s avg',
    'Total Spending ₹42,380',
    'Income ₹68,000',
    'Anomalies Detected: 3',
    'Forecast: ₹38,200',
    'Categorization Accuracy 95%',
  ];

  return (
    <div className="lnd-ticker">
      <div className="lnd-ticker-label">LIVE</div>
      <div className="lnd-ticker-overflow">
        <motion.div 
          className="lnd-ticker-track"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 25, repeat: Infinity }}
        >
          {items.map((item, i) => (
            <span key={i} className="lnd-ticker-item">
              <span className="lnd-ticker-dot" />
              {item}
            </span>
          ))}
          {/* Duplicate for seamless infinite scroll */}
          {items.map((item, i) => (
            <span key={`dup-${i}`} className="lnd-ticker-item">
              <span className="lnd-ticker-dot" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
