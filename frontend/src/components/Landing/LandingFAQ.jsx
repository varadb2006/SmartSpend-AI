import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'How secure is my financial data?',
    a: 'We use 256-bit AES encryption and never store your banking credentials. Our read-only integration means we cannot move your money, only analyze it.'
  },
  {
    q: 'Do I need to categorize transactions manually?',
    a: 'No. Our XGBoost model automatically categorizes 98% of transactions instantly. You only need to intervene if it asks for clarification on a highly unusual charge.'
  },
  {
    q: 'How does the forecasting work?',
    a: 'We use Support Vector Regression (SVR) trained on your historical spending habits to predict recurring bills, variable expenses, and expected income up to 6 months in advance.'
  },
  {
    q: 'Is SmartSpend AI free?',
    a: 'We offer a generous free tier for basic categorization and tracking. Pro features like advanced ML anomaly detection and multi-account forecasting require a premium subscription.'
  }
];

export default function LandingFAQ() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <section id="faq" className="lnd-section faq-section">
      <div className="lnd-container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">Common <span>Questions</span></h2>
          <p className="section-sub">Everything you need to know about the product and billing.</p>
        </motion.div>

        <div className="faq-grid">
          {FAQS.map((faq, i) => (
            <motion.div 
              key={i} 
              className="faq-item"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <button 
                className="faq-q" 
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <span>{faq.q}</span>
                <ChevronDown 
                  className={`faq-icon ${openIdx === i ? 'open' : ''}`} 
                  size={20} 
                />
              </button>
              <AnimatePresence>
                {openIdx === i && (
                  <motion.div 
                    className="faq-a-wrap"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="faq-a">{faq.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
