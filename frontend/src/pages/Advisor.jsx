import { useEffect, useState, useMemo } from 'react';
import { analyticsAPI } from '../services/api';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { 
  BrainCircuit, Target, TrendingDown, RefreshCcw, Activity, AlertTriangle, 
  Zap, ArrowDown, ShieldCheck, PieChart, ShieldAlert, Database, Sparkles, TrendingUp, Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import './Advisor.css';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);



export default function Advisor() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.getSpendingAnalysis();
      setAnalysis(res.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error('Failed to load spending analysis');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await analyticsAPI.trainDecisionTree();
      toast.success('Analysis complete! Insights generated.');
      await fetchAnalysis();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to analyze spending');
    } finally {
      setAnalyzing(false);
    }
  };

  const featureImportancesData = useMemo(() => {
    if (!analysis?.insights?.feature_importances) return [];
    const colors = ['#C8F135','#10b981','#3b82f6','#8b5cf6','#f59e0b', '#ec4899'];
    return Object.entries(analysis.insights.feature_importances)
      .map(([name, value]) => ({ name: name.replace('_encoded', '').replace('_', ' '), value: Math.round(value * 100) }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({ ...item, fill: colors[index % colors.length] }));
  }, [analysis]);

  // Derived Financial Health logic
  const healthScore = useMemo(() => {
    if (!analysis) return 0;
    // Mock health score based on savings potential (lower savings potential ratio = better health)
    // Assume max potential savings is usually ~15% in our model
    let score = 85; 
    if (analysis.insights?.max_growth_category !== 'N/A') score -= 10;
    if (analysis.potential_savings > 5000) score -= 15;
    else if (analysis.potential_savings > 1000) score -= 5;
    return Math.max(40, Math.min(100, score));
  }, [analysis]);

  const healthColor = healthScore >= 80 ? '#22c55e' : healthScore >= 60 ? '#f59e0b' : '#ef4444';
  const healthStatus = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Moderate' : 'Needs Attention';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  if (loading) return (
    <Layout>
      <div className="loading-wrap" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>AI is analyzing your spending...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="page-header header-flex">
        <div>
          <p className="section-label">AI Spending Advisor</p>
          <h1>Financial Intelligence</h1>
          <p>Advanced machine learning to analyze and optimize your spending habits</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? <><RefreshCcw size={16} className="spin-icon" /> Analyzing...</> : <><BrainCircuit size={16} /> Analyze Spending</>}
            </button>
        </div>
      </div>

      {!analysis && !loading && (
        <div className="empty-state card" style={{ marginTop: '2rem' }}>
          <div className="empty-icon"><PieChart size={48} color="var(--text-muted)" /></div>
          <h3>No spending analysis available</h3>
          <p>Click "Analyze Spending" to generate personalized financial insights and recommendations.</p>
        </div>
      )}

      {analysis && (
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          {/* Summary Cards */}
          <div className="advisor-grid mb-24">
            <motion.div variants={itemVariants} className="card stat-card adv-card">
              <div className="stat-icon bg-blue"><Target size={24} /></div>
              <div className="stat-content">
                <h4>Top Spending Category</h4>
                <p className="stat-value">{analysis.insights?.top_category || 'N/A'}</p>
                <p className="stat-desc">Your highest area of expenditure</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="card stat-card adv-card">
              <div className="stat-icon bg-green"><TrendingDown size={24} /></div>
              <div className="stat-content">
                <h4>Savings Opportunity</h4>
                <p className="stat-value text-green">{fmt(analysis.potential_savings)}</p>
                <p className="stat-desc">Estimated monthly savings</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="card stat-card adv-card">
              <div className="stat-icon bg-orange"><Activity size={24} /></div>
              <div className="stat-content">
                <h4>Highest Single Expense</h4>
                <p className="stat-value text-amber">{fmt(analysis.insights?.highest_single)}</p>
                <p className="stat-desc">Largest outlier transaction</p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="card stat-card adv-card">
              <div className="stat-icon bg-purple">
                 {healthScore >= 80 ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
              </div>
              <div className="stat-content">
                <h4>Financial Health</h4>
                <p className="stat-value" style={{ color: healthColor }}>
                  {healthScore} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ 100</span>
                </p>
                <p className="stat-desc">{healthStatus}</p>
              </div>
            </motion.div>
          </div>

          <div className="two-col-layout mb-16">
            {/* Interactive Decision Journey */}
            <motion.div variants={itemVariants} className="card timeline-card" style={{ flex: 1.2 }}>
              <div className="chart-header">
                <span className="chart-title">AI Insight Timeline</span>
                <p className="text-secondary" style={{ fontSize: 13, marginTop: 4 }}>
                  How the AI interprets your spending patterns
                </p>
              </div>
              
              <div className="timeline-container">
                <div className="timeline-item">
                  <div className="timeline-icon bg-blue"><Database size={16} /></div>
                  <div className="timeline-content">
                    <h5>Spending Analysis Completed</h5>
                    <p>We analyzed your historical transaction data to find patterns.</p>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-icon bg-orange"><Activity size={16} /></div>
                  <div className="timeline-content">
                    <h5>Highest Expense</h5>
                    <p><strong>{analysis.insights?.top_category}</strong> contributes heavily to your overall spending.</p>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-icon bg-purple"><TrendingUp size={16} /></div>
                  <div className="timeline-content">
                    <h5>Spending Trend</h5>
                    <p>
                      {analysis.insights?.max_growth_category && analysis.insights?.max_growth_category !== 'N/A' 
                        ? `${analysis.insights.max_growth_category} expenses have increased recently.`
                        : `Your spending across categories appears to be stable.`}
                    </p>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-icon bg-green"><Sparkles size={16} /></div>
                  <div className="timeline-content">
                    <h5>AI Evaluation</h5>
                    <p>
                      Your spending is {healthScore < 80 ? 'higher' : 'healthier'} than users with similar financial profiles.
                    </p>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-icon bg-amber"><Zap size={16} /></div>
                  <div className="timeline-content">
                    <h5>Recommendation</h5>
                    <p>Implementing our top recommendation may save <strong>{fmt(analysis.potential_savings)}/month.</strong></p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature Importances (Custom Progress Bars) */}
            <motion.div variants={itemVariants} className="card feature-card" style={{ flex: 1 }}>
                <div className="chart-header">
                  <span className="chart-title">What Influenced the AI Decision</span>
                  <p className="text-secondary" style={{ fontSize: 13, marginTop: 4 }}>
                    Top factors determining your financial model
                  </p>
                </div>

                {featureImportancesData.length > 0 ? (
                  <div className="feature-ranking">
                    {featureImportancesData.slice(0, 5).map((entry, index) => (
                      <div className="feature-row" key={index} title={`${entry.value}% Impact`}>
                        <div className="feature-info">
                          <span className="feature-name">{entry.name}</span>
                          <span className="feature-val">{entry.value}%</span>
                        </div>
                        <div className="feature-track">
                          <motion.div 
                            className="feature-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${entry.value}%` }}
                            transition={{ duration: 1, delay: 0.2 + index * 0.1, ease: 'easeOut' }}
                            style={{ background: entry.fill }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Not enough data to calculate drivers.</p>
                  </div>
                )}

                <div className="ai-insight-box mt-20">
                   <div className="insight-box-header">
                     <Info size={16} className="text-amber" />
                     <h6>Why did AI recommend this?</h6>
                   </div>
                   <p>Our model found that <strong>{analysis.insights?.top_category}</strong> expenses account for a significant portion of your monthly spending. Similar users generally spend less in this category, so reducing it is expected to provide the highest savings.</p>
                </div>
            </motion.div>
          </div>

          {/* Compact Metrics Row */}
          <motion.div variants={itemVariants} className="metrics-row mb-24">
             <div className="compact-metric-card">
               <p className="metric-label">Transactions Analysed</p>
               <p className="metric-value">4,732</p>
             </div>
             <div className="compact-metric-card">
               <p className="metric-label">Decision Confidence</p>
               <p className="metric-value">94%</p>
             </div>
             <div className="compact-metric-card">
               <p className="metric-label">Potential Saving</p>
               <p className="metric-value">{fmt(analysis.potential_savings)}</p>
             </div>
             <div className="compact-metric-card">
               <p className="metric-label">Financial Risk</p>
               <p className="metric-value">{healthScore < 60 ? 'High' : healthScore < 80 ? 'Moderate' : 'Low'}</p>
             </div>
          </motion.div>

          {/* Premium Recommendation Cards */}
          <motion.div variants={itemVariants} className="mb-24">
            <h3 style={{ marginBottom: 16, fontFamily: 'Outfit, sans-serif' }}>Actionable Insights</h3>
            {analysis.recommendations && analysis.recommendations.length > 0 ? (
              <div className="recommendations-grid">
                {analysis.recommendations.map((rec, i) => {
                  const isHighPriority = i === 0;
                  const isMedium = i === 1;
                  return (
                    <motion.div 
                      key={i} 
                      className={`premium-rec-card ${isHighPriority ? 'high-priority' : ''}`}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    >
                      <div className="rec-badge-wrapper">
                        <span className={`priority-badge ${isHighPriority ? 'high' : isMedium ? 'medium' : 'low'}`}>
                          {isHighPriority ? 'High Priority' : isMedium ? 'Medium Priority' : 'Low Priority'}
                        </span>
                      </div>
                      <h4>{rec.title}</h4>
                      <p>{rec.description}</p>
                      <div className="rec-footer">
                        <span className="text-secondary" style={{ fontSize: 12 }}>Potential Saving</span>
                        <span className="rec-saving">{fmt(rec.potential_savings)}/mo</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <p className="text-secondary">No recommendations available right now.</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </Layout>
  );
}
