import { useEffect, useState } from 'react';
import { transactionsAPI } from '../services/api';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { CreditCard, ArrowUp, ArrowDown, TriangleAlert, CircleCheck, X } from 'lucide-react';
import './Transactions.css';


const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

function AddTransactionModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    description: '', amount: '', transaction_type: 'debit', category: 'Uncategorized',
  });
  const [step, setStep] = useState(1);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    
    setLoading(true);
    try {
      const res = await transactionsAPI.predictCategory({
        description: form.description,
        amount: parseFloat(form.amount)
      });
      setPrediction(res.data);
      if (res.data.confidence >= 0.60) {
        setForm(f => ({ ...f, category: res.data.predicted_category }));
        setStep(2);
      } else {
        setStep(3);
      }
    } catch (err) {
      toast.error('Prediction failed, enter manually');
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e, isConfirmed = true) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const isCorrected = prediction && prediction.predicted_category !== form.category;
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        predicted_category: prediction?.predicted_category,
        prediction_confidence: prediction?.confidence,
        category_confirmed: isConfirmed,
        confirmed_by_user: true
      };
      await transactionsAPI.create(payload);
      if (isCorrected) {
        toast.success('Transaction saved. AI Learned From Your Correction!');
      } else {
        toast.success('Transaction added successfully!');
      }
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add transaction');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Transaction</h3>
          <button className="modal-close" onClick={onClose}><X size={24} /></button>
        </div>
        
        {step === 1 && (
          <form onSubmit={handlePredict} className="form-flex-col">
            <div className="input-group">
              <label>Date</label>
              <input className="input" type="date" value={form.transaction_date} onChange={update('transaction_date')} required />
            </div>
            <div className="input-group">
              <label>Description</label>
              <input className="input" type="text" placeholder="e.g. Movie Ticket" value={form.description} onChange={update('description')} required />
            </div>
            <div className="form-grid-2">
              <div className="input-group">
                <label>Amount (₹)</label>
                <input className="input" type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={update('amount')} required min={0.01} />
              </div>
              <div className="input-group">
                <label>Type</label>
                <select className="input" value={form.transaction_type} onChange={update('transaction_type')}>
                  <option value="debit">Debit (Expense)</option>
                  <option value="credit">Credit (Income)</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-dark" disabled={loading}>
                {loading ? 'Predicting Category...' : 'Continue'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="form-flex-col text-center">
            <h4 className="mb-8" style={{ color: 'var(--primary)' }}>AI Prediction</h4>
            <div className="mb-20" style={{ background: 'var(--bg-dark-panel)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-secondary mb-4">Description</p>
              <p className="font-semibold text-lg mb-12">{form.description}</p>
              
              <p className="text-secondary mb-4">Predicted Category</p>
              <p className="font-semibold text-xl mb-12">{prediction.predicted_category}</p>
              
              <p className="text-secondary mb-4">Confidence</p>
              <p className="font-semibold text-lg" style={{ color: prediction.confidence >= 0.8 ? 'var(--primary)' : 'var(--amber)' }}>
                {(prediction.confidence * 100).toFixed(0)}%
              </p>
            </div>
            <p className="mb-20 font-medium">Is this correct?</p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setStep(3)}>Choose Another Category</button>
              <button className="btn btn-primary" onClick={(e) => handleSave(e, true)} disabled={loading}>
                {loading ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={(e) => handleSave(e, true)} className="form-flex-col">
            <div className="input-group">
              <label>Select Category</label>
              <input className="input" type="text" placeholder="e.g. Entertainment" value={form.category} onChange={update('category')} required autoFocus />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button type="submit" className="btn btn-dark" disabled={loading}>
                {loading ? 'Saving...' : 'Save Transaction'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function EditCategoryModal({ transaction, onClose, onUpdated }) {
  const [category, setCategory] = useState(transaction.category);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await transactionsAPI.updateCategory(transaction.id, category);
      toast.success('Category updated!');
      onUpdated();
      onClose();
    } catch {
      toast.error('Failed to update');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Category</h3>
          <button className="modal-close" onClick={onClose}><X size={24} /></button>
        </div>
        <p className="modal-desc">{transaction.description}</p>
        <div className="input-group mb-20">
          <label>Category</label>
          <input className="input" type="text" value={category} onChange={e => setCategory(e.target.value)} autoFocus />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-dark" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAnomaliesOnly, setShowAnomaliesOnly] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await transactionsAPI.getAll(0, 500);
      setTransactions(res.data);
    } catch { toast.error('Failed to fetch transactions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const filtered = transactions.filter(t => {
    const matchSearch = t.description?.toLowerCase().includes(search.toLowerCase()) ||
                        t.category?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || t.transaction_type?.toLowerCase() === filterType;
    const matchAnomaly = showAnomaliesOnly ? t.is_anomaly === true : true;
    return matchSearch && matchType && matchAnomaly;
  });

  return (
    <Layout>
      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} onAdded={fetchTransactions} />}
      {editing && <EditCategoryModal transaction={editing} onClose={() => setEditing(null)} onUpdated={fetchTransactions} />}

      <div className="page-header header-flex">
        <div>
          <p className="section-label">Finance</p>
          <h1>Transactions</h1>
          <p>View and manage all your financial transactions</p>
        </div>
        <button className="btn btn-dark" onClick={() => setShowAdd(true)}>
          + Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="action-bar">
        <input
          className="input search-input"
          placeholder="Search by description or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="debit">Debit</option>
          <option value="credit">Credit</option>
        </select>
        <button 
          className={`btn ${showAnomaliesOnly ? 'btn-amber' : 'btn-dark'}`} 
          onClick={() => setShowAnomaliesOnly(!showAnomaliesOnly)}
        >
          <TriangleAlert size={16} />
          {showAnomaliesOnly ? 'Showing Anomalies' : 'Show Anomalies'}
        </button>
      </div>

      {/* Table */}
      <div className="card p-0">
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><CreditCard size={32} /></div>
            <h3>No transactions found</h3>
            <p>Add a transaction or upload a CSV file</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className={t.is_anomaly ? 'anomaly-row' : ''}>
                    <td className="tabular-text text-secondary">{t.transaction_date}</td>
                    <td>
                      <div className="truncate-text font-semibold" title={t.description}>
                        {t.description}
                      </div>
                    </td>
                    <td><span className="category-tag">{t.category}</span></td>
                    <td>
                      <span className={`badge badge-${t.transaction_type?.toLowerCase()}`}>
                        {t.transaction_type?.toLowerCase() === 'credit' ? <ArrowUp size={14} className="mr-4" style={{ display: 'inline', verticalAlign: 'middle' }} /> : <ArrowDown size={14} className="mr-4" style={{ display: 'inline', verticalAlign: 'middle' }} />} {t.transaction_type}
                      </span>
                    </td>
                    <td className={`transaction-amount ${t.transaction_type?.toLowerCase() === 'credit' ? 'credit' : ''}`}>
                      {t.transaction_type?.toLowerCase() === 'credit' ? '+' : '−'}{fmt(t.amount)}
                    </td>
                    <td>
                      {t.is_anomaly
                        ? <span className="badge badge-debit" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} title={t.anomaly_score ? `Anomaly Score: ${t.anomaly_score.toFixed(2)}. This expense is an outlier compared to your normal spending.` : 'Unusual spending detected'}><TriangleAlert size={14} /> Anomaly</span>
                        : <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CircleCheck size={14} /> Normal</span>}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditing(t)}
                        title="Edit category"
                      >Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="table-footer-text">
        Showing {filtered.length} of {transactions.length} transactions
      </p>
    </Layout>
  );
}
