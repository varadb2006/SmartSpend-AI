import { motion } from 'framer-motion';

const STEPS = [
  {
    num: '01',
    title: 'Connect Your Accounts',
    desc: 'Securely link your bank accounts using our plaid-powered integration in seconds.'
  },
  {
    num: '02',
    title: 'AI Analysis',
    desc: 'Our models instantly process your transaction history, categorizing and identifying patterns.'
  },
  {
    num: '03',
    title: 'Actionable Insights',
    desc: 'Get a clear dashboard with precise forecasts, anomaly alerts, and savings opportunities.'
  }
];

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="lnd-section hiw-section">
      <div className="lnd-container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">How it <span>works</span></h2>
          <p className="section-sub">Three simple steps to financial clarity.</p>
        </motion.div>

        <div className="hiw-grid">
          {STEPS.map((step, i) => (
            <motion.div 
              key={i}
              className="hiw-step"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <div className="hiw-num">{step.num}</div>
              <h3 className="hiw-title">{step.title}</h3>
              <p className="hiw-desc">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
