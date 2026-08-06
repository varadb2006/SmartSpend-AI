import { useEffect, useState, useMemo } from 'react';
import { transactionsAPI } from '../services/api';
import Layout from '../components/Layout';
import { Bot, CreditCard, Wallet, TriangleAlert, FileText, PieChart as PieChartIcon, Inbox } from 'lucide-react';
import './Dashboard.css';

import {
  AreaChart, Area, PieChart, Pie, Cell, Tooltip,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#C8F135','#1A1A1A','#22C55E','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#EC4899','#F97316'];

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

function StatCard({ icon, label, value, color, change, variant }) {
  const cls = variant === 'lime' ? ' stat-card-lime' : variant === 'dark' ? ' stat-card-dark' : '';
  return (
    <div className={`stat-card${cls}`}>
      <div className="stat-glow" style={{ background: color }} />
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {change && <div className="stat-change">{change}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="chart-tooltip-value" style={{ color: p.color }}>{fmt(p.value)}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      transactionsAPI.getAll(0, 500).catch(() => ({ data: [] })),
      transactionsAPI.getForecast().catch(() => ({ data: null })),
    ]).then(([txRes, fcRes]) => {
      setTransactions(txRes.data);
      setForecast(fcRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const debits = transactions.filter(t => t.transaction_type?.toLowerCase() === 'debit');
    const credits = transactions.filter(t => t.transaction_type?.toLowerCase() === 'credit');
    const totalSpend = debits.reduce((s, t) => s + t.amount, 0);
    const totalIncome = credits.reduce((s, t) => s + t.amount, 0);
    const anomalies = transactions.filter(t => t.is_anomaly).length;
    return { totalSpend, totalIncome, anomalies, count: transactions.length };
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const d = new Date(t.transaction_date);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { month: key, spent: 0, income: 0 };
      if (t.transaction_type?.toLowerCase() === 'debit') map[key].spent += t.amount;
      else map[key].income += t.amount;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-8);
  }, [transactions]);

  const categoryData = useMemo(() => {
    const map = {};
    transactions.filter(t => t.transaction_type?.toLowerCase() === 'debit').forEach(t => {
      const cat = t.category || 'Uncategorized';
      map[cat] = (map[cat] || 0) + t.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [transactions]);

  const recent = transactions.slice(0, 6);

  if (loading) return (
    <Layout>
      <div className="loading-wrap" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header header-flex">
        <div>
          <p className="section-label">Overview</p>
          <h1>Dashboard</h1>
          <p>Your financial overview at a glance</p>
        </div>
        {forecast && forecast.forecasted_amount > 0 && (
          <div className="forecast-banner-mini">
            <div>
              <div className="forecast-mini-label">
                AI Forecast — Next Month
              </div>
              <div className="forecast-mini-amount">
                {fmt(forecast.forecasted_amount)}
              </div>
            </div>
            <span className="forecast-mini-icon"><Bot size={18} /></span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon={<CreditCard size={24} />} label="Total Spending" value={fmt(stats.totalSpend)} color="#EF4444" change={`${stats.count} transactions`} variant="lime" />
        <StatCard icon={<Wallet size={24} />} label="Total Income"   value={fmt(stats.totalIncome)}  color="#22C55E" change="Credits received" />
        <StatCard icon={<TriangleAlert size={24} />} label="Anomalies Found" value={stats.anomalies}        color="#F59E0B" change="Unusual transactions" />
        <StatCard icon={<FileText size={24} />} label="Total Transactions" value={stats.count}         color="#3B82F6" change="All time" variant="dark" />
      </div>

      {/* Charts */}
      <div className="chart-grid">
        {/* Full-width area chart */}
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-header">
            <span className="chart-title">Monthly Spending vs Income</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyData} margin={{ left: 10, right: 10 }}>
              <defs>
                <linearGradient id="gradSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.18}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#C8F135" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#C8F135" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'rgba(10, 10, 10, 0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(245,245,245,0.5)', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Area type="monotone" dataKey="spent"  name="Spent"  stroke="#EF4444" fill="url(#gradSpent)"  strokeWidth={2} />
              <Area type="monotone" dataKey="income" name="Income" stroke="#C8F135" fill="url(#gradIncome)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Spending by Category</span>
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={38}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: 'rgba(8,8,14,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f5f5f5' }} itemStyle={{ color: '#f5f5f5' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><div className="empty-icon"><PieChartIcon size={32} /></div><p>No category data yet</p></div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Recent Transactions</span>
          </div>
          <div>
            {recent.length === 0 && (
              <div className="empty-state"><div className="empty-icon"><Inbox size={32} /></div><p>No transactions yet</p></div>
            )}
            {recent.map(t => (
              <div key={t.id} className="transaction-list-item">
                <div>
                  <div className="transaction-list-desc">{t.description}</div>
                  <div className="transaction-list-meta">
                    {t.transaction_date} • {t.category || 'Uncategorized'}
                  </div>
                </div>
                <div className="transaction-list-right">
                  <div className={`transaction-list-amount ${t.transaction_type?.toLowerCase() === 'credit' ? 'credit' : ''}`}>
                    {t.transaction_type?.toLowerCase() === 'credit' ? '+' : ''}{fmt(t.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
