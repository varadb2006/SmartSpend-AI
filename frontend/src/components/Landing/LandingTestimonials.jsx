import { motion } from 'framer-motion';

const TESTIMONIALS = [
  {
    quote: "SmartSpend AI completely changed how I look at my finances. The automated categorization is flawlessly accurate.",
    name: "Sarah Jenkins",
    role: "Freelance Designer"
  },
  {
    quote: "The anomaly detection saved me $400 last month on a duplicate subscription charge. Worth every penny.",
    name: "David Chen",
    role: "Software Engineer"
  },
  {
    quote: "I used to spend hours on spreadsheets. Now, the XGBoost model does it instantly. The forecasting is incredibly precise.",
    name: "Emily Rodriguez",
    role: "Small Business Owner"
  }
];

export default function LandingTestimonials() {
  return (
    <section id="testimonials" className="lnd-section test-section">
      <div className="lnd-container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">Loved by <span>thousands</span></h2>
          <p className="section-sub">See how our users are taking back control of their money.</p>
        </motion.div>

        <div className="test-grid">
          {TESTIMONIALS.map((test, i) => (
            <motion.div 
              key={i}
              className="test-card glass-card"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <div className="test-quote">"{test.quote}"</div>
              <div className="test-author">
                <div className="test-avatar" />
                <div className="test-info">
                  <div className="test-name">{test.name}</div>
                  <div className="test-role">{test.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
