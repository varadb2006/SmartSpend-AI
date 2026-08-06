import { useEffect, useState, useMemo } from 'react';
import { transactionsAPI } from '../services/api';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { Bot, TriangleAlert, TrendingUp, BarChart3, CircleCheck } from 'lucide-react';
import './Analytics.css';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const COLORS = ['#C8F135','#1A1A1A','#22C55E','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#06B6D4'];

export default function Analytics() {
  const [transactions, setTransactions] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const [modelMeta, setModelMeta] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [txRes, fcRes, metaRes] = await Promise.all([
        transactionsAPI.getAll(0, 500).catch(() => ({ data: [] })),
        transactionsAPI.getForecast().catch(() => ({ data: null })),
        transactionsAPI.getModelMetadata().catch(() => ({ data: null })),
      ]);
      setTransactions(txRes.data);
      setForecast(fcRes.data);
      setModelMeta(metaRes.data);
    } catch { toast.error('Failed to load analytics data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleTrain = async () => {
    setTraining(true);
    try {
      const res = await transactionsAPI.trainCategorizer();
      toast.success(res.data.message || 'Model trained!');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Training failed');
    } finally { setTraining(false); }
  };

  const handleDetectAnomalies = async () => {
    setDetecting(true);
    try {
      const res = await transactionsAPI.detectAnomalies();
      toast.success(`Found ${res.data.anomalies_found} anomalies in ${res.data.total_analyzed} transactions`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Detection failed');
    } finally { setDetecting(false); }
  };

  const categorySpend = useMemo(() => {
    const map = {};
    transactions
      .filter(t => t.transaction_type?.toLowerCase() === 'debit')
      .forEach(t => {
        const c = t.category || 'Uncategorized';
        map[c] = (map[c] || 0) + t.amount;
      });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cat, amount], i) => ({ cat, amount: Math.round(amount), color: COLORS[i % COLORS.length] }));
  }, [transactions]);

  const anomalies = transactions.filter(t => t.is_anomaly);
  const totalSpend = transactions.filter(t => t.transaction_type?.toLowerCase() === 'debit').reduce((s, t) => s + t.amount, 0);

  if (loading) return (
    <Layout>
      <div className="loading-wrap" style={{ minHeight: '60vh' }}><div className="spinner" /></div>
    </Layout>
  );

  return (
    <Layout>
      <div className="page-header">
        <p className="section-label">AI Insights</p>
        <h1>Analytics</h1>
        <p>AI-powered insights into your spending patterns</p>
      </div>

      {/* AI Action Cards */}
      <div className="analytics-grid">
        {/* Continuous Learning Status */}
        <div className="card">
          <div className="ai-card-icon"><Bot size={32} /></div>
          <h3 className="ai-card-title mb-8">Continuous Learning</h3>
          <p className="ai-card-desc mb-12">
            The model automatically learns from your validated categories.
          </p>
          {modelMeta ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
               <div className="text-secondary">Accuracy: <span className="font-medium text-primary">{(modelMeta.accuracy * 100).toFixed(1)}%</span></div>
               <div className="text-secondary">F1 Score: <span className="font-medium text-primary">{(modelMeta.f1_score * 100).toFixed(1)}%</span></div>
               <div className="text-secondary">Precision: <span className="font-medium text-primary">{(modelMeta.precision * 100).toFixed(1)}%</span></div>
               <div className="text-secondary">Recall: <span className="font-medium text-primary">{(modelMeta.recall * 100).toFixed(1)}%</span></div>
               
               <div className="text-secondary">Total Preds: <span className="font-medium text-primary">{modelMeta.total_predictions || 0}</span></div>
               <div className="text-secondary">Correct: <span className="font-medium text-primary">{modelMeta.correct_predictions || 0}</span></div>
               <div className="text-secondary">Incorrect: <span className="font-medium text-primary">{modelMeta.incorrect_predictions || 0}</span></div>
               <div className="text-secondary">Version: <span className="font-medium text-primary">{modelMeta.model_version || 'N/A'}</span></div>
               <div className="text-secondary" style={{ gridColumn: 'span 2' }}>Last Update: <span className="font-medium text-primary">{modelMeta.trained_at ? new Date(modelMeta.trained_at).toLocaleString() : 'N/A'}</span></div>
            </div>
          ) : (
            <p className="text-secondary text-sm">No training data available yet.</p>
          )}
        </div>

        {/* Detect Anomalies */}
        <div className="card anomaly-card">
          <div className="ai-card-icon"><TriangleAlert size={32} /></div>
          <h3 className="mb-8">Detect Anomalies</h3>
          <p className="ai-card-desc mb-18">
            Use DBSCAN clustering to identify unusual transactions that deviate from your normal spending.
          </p>
          <button
            className="btn btn-sm btn-amber w-full center-content"
            onClick={handleDetectAnomalies}
            disabled={detecting}
          >
            {detecting ? ' Detecting...' : ' Detect Anomalies'}
          </button>
        </div>

        {/* Next Month Forecast */}
        <div className="card">
          <div className="ai-card-icon"><TrendingUp size={32} /></div>
          <h3 className="mb-8">Next Month Forecast</h3>
          <p className="ai-card-desc mb-12">
            SVR-powered prediction of your next month's spending based on historical trends.
          </p>
          {forecast?.forecasted_amount > 0 ? (
            <div className="forecast-value">{fmt(forecast.forecasted_amount)}</div>
          ) : (
            <p className="forecast-empty">{forecast?.message || 'Need 3+ months of data'}</p>
          )}
        </div>
      </div>

      {/* Category Bar Chart */}
      <div className="chart-card mb-24">
        <div className="chart-header">
          <span className="chart-title">Spending by Category</span>
          <span className="chart-total">Total: {fmt(totalSpend)}</span>
        </div>
        {categorySpend.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categorySpend} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="cat" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={160} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={v => fmt(v)}
                contentStyle={{ background: 'var(--bg-dark-panel)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f5f5f5' }}
                itemStyle={{ color: '#f5f5f5' }}
              />
              <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                {categorySpend.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state"><div className="empty-icon"><BarChart3 size={32} /></div><p>No spending data available</p></div>
        )}
      </div>

      {/* Anomalies Table */}
      {anomalies.length > 0 && (
        <div className="anomalies-mini-grid mb-24">
          <div className="card p-16">
            <h4 className="text-secondary mb-4 text-sm">Total Anomalies</h4>
            <p className="font-semibold text-2xl text-amber">{anomalies.length}</p>
          </div>
          <div className="card p-16">
            <h4 className="text-secondary mb-4 text-sm">Percentage</h4>
            <p className="font-semibold text-2xl text-amber">{((anomalies.length / transactions.length) * 100).toFixed(1)}%</p>
          </div>
          <div className="card p-16">
            <h4 className="text-secondary mb-4 text-sm">Highest Anomaly</h4>
            <p className="font-semibold text-xl text-amber">{fmt(Math.max(...anomalies.map(a => a.amount)))}</p>
          </div>
          <div className="card p-16">
            <h4 className="text-secondary mb-4 text-sm">Avg Score</h4>
            <p className="font-semibold text-xl text-amber">{(anomalies.reduce((a, b) => a + (b.anomaly_score || 0), 0) / anomalies.length).toFixed(2)}</p>
          </div>
          <div className="card p-16">
            <h4 className="text-secondary mb-4 text-sm">Latest Anomaly</h4>
            <p className="font-semibold text-lg text-amber truncate-text" title={anomalies[0]?.description}>{anomalies[0]?.description || 'N/A'}</p>
          </div>
        </div>
      )}

      <div className="card p-0">
        <div className="table-header">
          <h3>Flagged Anomalies</h3>
          <span className="badge badge-anomaly">{anomalies.length} found</span>
        </div>
        {anomalies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><CircleCheck size={32} /></div>
            <h3>No anomalies detected</h3>
            <p>Run anomaly detection to find unusual transactions</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Type</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map(t => (
                  <tr key={t.id}>
                    <td className="tabular-text text-secondary">{t.transaction_date}</td>
                    <td className="font-semibold">{t.description}</td>
                    <td><span className="category-tag">{t.category}</span></td>
                    <td className={`transaction-amount ${t.transaction_type?.toLowerCase() === 'credit' ? 'credit' : ''}`}>
                      {t.transaction_type?.toLowerCase() === 'credit' ? '+' : '−'}{fmt(t.amount)}
                    </td>
                    <td className="text-secondary capitalize text-sm">{t.transaction_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
