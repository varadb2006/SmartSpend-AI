import { useRef, useCallback } from 'react';
import Navbar from '../components/Navbar';
import LandingHero from '../components/Landing/LandingHero';
import LandingOrbit from '../components/Landing/LandingOrbit';
import FloatingCard from '../components/Landing/FloatingCard';
import LandingChartCard from '../components/Landing/LandingChartCard';
import LandingTicker from '../components/Landing/LandingTicker';
import LandingFeatures from '../components/Landing/LandingFeatures';
import LandingHowItWorks from '../components/Landing/LandingHowItWorks';
import LandingTestimonials from '../components/Landing/LandingTestimonials';
import LandingFAQ from '../components/Landing/LandingFAQ';
import LandingFooter from '../components/Landing/LandingFooter';
import './Landing.css';
import './LandingNewSections.css';

const METRICS = [
  {
    label: 'Monthly Savings', target: 12400, prefix: '₹', suffix: '',
    badge: '+18% vs last', color: '#10b981',
    spark: '0,20 12,16 24,18 36,10 48,14 60,6 72,4 80,2',
    pos: { top: '12%', right: '8%' },
  },
  {
    label: 'Anomalies Found', target: 3, prefix: '', suffix: '',
    badge: 'Live detection', color: '#f59e0b',
    spark: '0,12 12,14 24,10 36,18 48,8 60,20 72,6 80,16',
    pos: { top: '18%', left: '6%' },
  },
  {
    label: 'AI Accuracy', target: 95, prefix: '', suffix: '%',
    badge: 'ML model avg', color: '#1b74fd',
    spark: '0,20 12,16 24,14 36,12 48,10 60,8 72,5 80,2',
    pos: { bottom: '18%', right: '12%' },
  },
];

export default function Landing() {
  const orbRef = useRef(null);

  const onMove = useCallback((e) => {
    if (!orbRef.current) return;
    const rightPanel = orbRef.current.closest('.lnd-right');
    const rect = rightPanel.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    
    orbRef.current.style.transform =
      `translate(-50%,-50%) rotateX(${-dy * 12}deg) rotateY(${dx * 12}deg)`;

    rightPanel.style.setProperty('--mouse-x', dx);
    rightPanel.style.setProperty('--mouse-y', dy);
  }, []);

  const onLeave = useCallback(() => {
    if (!orbRef.current) return;
    orbRef.current.style.transform = 'translate(-50%,-50%) rotateX(0) rotateY(0)';
    
    const rightPanel = orbRef.current.closest('.lnd-right');
    rightPanel.style.setProperty('--mouse-x', 0);
    rightPanel.style.setProperty('--mouse-y', 0);
  }, []);

  return (
    <div className="landing-page-container">
      <Navbar />

      <div className="landing-hero-section" onMouseMove={onMove} onMouseLeave={onLeave}>
        <aside className="lnd-left">
          <div className="lnd-corner-grid" />
          <LandingHero />
        </aside>

        <main className="lnd-right">
          <div className="lnd-dot-grid" />
          <div className="lnd-blob lnd-blob-1" />
          <div className="lnd-blob lnd-blob-2" />
          <div className="lnd-blob lnd-blob-3" />
          <div className="lnd-scan-line" />

          <LandingOrbit ref={orbRef} />

          {METRICS.map((m, i) => <FloatingCard key={i} m={m} idx={i} />)}
          <LandingChartCard />
          <LandingTicker />
        </main>
      </div>

      <LandingFeatures />
      <LandingHowItWorks />
      <LandingTestimonials />
      <LandingFAQ />
      <LandingFooter />
    </div>
  );
}
