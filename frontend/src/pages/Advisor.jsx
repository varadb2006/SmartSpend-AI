import { useEffect, useState } from 'react';
import { analyticsAPI } from '../services/api';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { BrainCircuit, Target, TrendingDown, RefreshCcw, Activity } from 'lucide-react';
import './Advisor.css';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export default function Advisor() {
  const [analysis, setAnalysis] = useState(null);
  const [treeImage, setTreeImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.getSpendingAnalysis();
      setAnalysis(res.data);
      
      const imgRes = await analyticsAPI.getDecisionTreeImage();
      const imgUrl = URL.createObjectURL(imgRes.data);
      setTreeImage(imgUrl);
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
      toast.success('Analysis complete! Decision Tree generated.');
      await fetchAnalysis();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to analyze spending');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExport = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analysis, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", "spending_analysis.json");
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  if (loading) return (
    <Layout>
      <div className="loading-wrap" style={{ minHeight: '60vh' }}><div className="spinner" /></div>
    </Layout>
  );

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="section-label">AI Spending Advisor</p>
          <h1>Decision Tree Analysis</h1>
          <p>Advanced machine learning to classify your spending habits using Gini Index</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={handleExport} disabled={!analysis}>Export JSON</button>
            <button className="btn btn-primary" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? <><RefreshCcw size={16} className="spin-icon" /> Analyzing...</> : <><BrainCircuit size={16} /> Analyze Spending</>}
            </button>
        </div>
      </div>

      {!analysis && !loading && (
        <div className="empty-state card" style={{ marginTop: '2rem' }}>
          <div className="empty-icon"><BrainCircuit size={48} /></div>
          <h3>No Analysis Found</h3>
          <p>Click "Analyze Spending" to train the Decision Tree model on your transactions.</p>
        </div>
      )}

      {analysis && (
        <>
          <div className="advisor-grid mb-24">
            <div className="card stat-card">
              <div className="stat-icon bg-blue"><Target size={24} /></div>
              <div className="stat-content">
                <h4>Top Spending Category</h4>
                <p className="stat-value">{analysis.insights?.top_category || 'N/A'}</p>
                <p className="stat-desc">Your highest area of expenditure</p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon bg-green"><TrendingDown size={24} /></div>
              <div className="stat-content">
                <h4>Potential Savings</h4>
                <p className="stat-value text-green">{fmt(analysis.potential_savings)}</p>
                <p className="stat-desc">Estimated monthly savings</p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon bg-orange"><Activity size={24} /></div>
              <div className="stat-content">
                <h4>Highest Single Expense</h4>
                <p className="stat-value text-amber">{fmt(analysis.insights?.highest_single)}</p>
                <p className="stat-desc">Maximum amount in one transaction</p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon bg-purple"><BrainCircuit size={24} /></div>
              <div className="stat-content">
                <h4>Model Insights</h4>
                <p className="stat-value" style={{ fontSize: '1.25rem' }}>Depth: {analysis.tree_depth}</p>
                <p className="stat-desc">Gini Score (Purity): {analysis.gini_score?.toFixed(3)}</p>
              </div>
            </div>
          </div>

          <div className="two-col-layout mb-24">
            <div className="card" style={{ flex: 1 }}>
              <h3 className="mb-16">Intelligent Recommendations</h3>
              {analysis.recommendations && analysis.recommendations.length > 0 ? (
                <div className="recommendations-list">
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} className="recommendation-item">
                      <div className="rec-header">
                        <h4>{rec.title}</h4>
                        <span className="badge badge-success">Save {fmt(rec.potential_savings)}</span>
                      </div>
                      <p>{rec.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No recommendations available right now.</p>
              )}
            </div>

            <div className="card" style={{ flex: 1 }}>
                <h3 className="mb-16">Detailed Insights</h3>
                <ul className="insights-list">
                    <li><strong>Second Highest Category:</strong> {analysis.insights?.second_highest}</li>
                    <li><strong>Third Highest Category:</strong> {analysis.insights?.third_highest}</li>
                    <li><strong>Max Growth Category:</strong> {analysis.insights?.max_growth_category}</li>
                    <li><strong>Min Growth Category:</strong> {analysis.insights?.min_growth_category}</li>
                    <li><strong>Most Frequent Expense:</strong> {analysis.insights?.most_frequent}</li>
                    <li><strong>Monthly Waste Estimate:</strong> <span className="text-amber">{fmt(analysis.insights?.monthly_waste)}</span></li>
                </ul>
            </div>
          </div>

          <div className="card p-0 mb-24">
            <div className="table-header">
              <h3>Decision Tree Visualization (Gini Index)</h3>
              <span className="badge badge-primary">Generated at {new Date(analysis.generated_at).toLocaleString()}</span>
            </div>
            <div className="tree-container p-16 center-content" style={{ overflowX: 'auto', background: '#1e1e1e' }}>
              {treeImage ? (
                <img src={treeImage} alt="Decision Tree" style={{ maxWidth: '100%', borderRadius: '8px' }} />
              ) : (
                <p>Visualization not available.</p>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
