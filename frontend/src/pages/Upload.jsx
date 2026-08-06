import { useState, useRef } from 'react';
import { transactionsAPI } from '../services/api';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { FileText, Folder, CheckCircle, Bot, Check, TriangleAlert } from 'lucide-react';
import './Upload.css';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Upload() {
  const [step, setStep] = useState('upload'); // 'upload', 'review', 'saving', 'success'
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [summary, setSummary] = useState(null);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith('.csv') && !f.name.endsWith('.xlsx')) {
      toast.error('Only .csv and .xlsx files are supported');
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handlePreview = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await transactionsAPI.uploadPreview(file);
      setPreviewData(res.data);
      setStep('review');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Preview failed');
    } finally { 
      setUploading(false); 
    }
  };

  const handleCategoryChange = (id, newCategory) => {
    setPreviewData(prev => prev.map(t => 
      t.id === id ? { ...t, category: newCategory, is_corrected: true } : t
    ));
  };

  const handleConfirm = async () => {
    setStep('saving');
    try {
      const res = await transactionsAPI.uploadConfirm(previewData);
      setSummary(res.data);
      setStep('success');
      toast.success('Import complete!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Import failed');
      setStep('review');
    }
  };

  const renderConfidenceBadge = (conf) => {
    if (conf === null || conf === undefined) return <span className="text-secondary">—</span>;
    let colorClass = 'badge-red';
    if (conf > 0.9) colorClass = 'badge-green';
    else if (conf >= 0.7) colorClass = 'badge-amber';
    return <span className={`badge ${colorClass}`}>{(conf * 100).toFixed(1)}%</span>;
  };

  return (
    <Layout>
      <div className="page-header">
        <p className="section-label">Data Import</p>
        <h1>Upload Transactions</h1>
        <p>Intelligent AI-powered CSV Import Pipeline</p>
      </div>

      {step === 'upload' && (
        <div className="upload-grid">
          <div>
            <div className="card mb-20">
              <h3 className="mb-20">Select File</h3>
              <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <div className="upload-icon">{file ? <FileText size={32} /> : <Folder size={32} />}</div>
                {file ? (
                  <>
                    <h3>{file.name}</h3>
                    <p>{(file.size / 1024).toFixed(1)} KB — ready for preview</p>
                  </>
                ) : (
                  <>
                    <h3>Drop your file here</h3>
                    <p>or click to browse — CSV or XLSX supported</p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>

              {file && (
                <div className="upload-actions">
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setFile(null)}>
                    Clear
                  </button>
                  <button
                    className="btn btn-dark"
                    style={{ flex: 1 }}
                    onClick={handlePreview}
                    disabled={uploading}
                  >
                    {uploading ? 'Parsing & Predicting...' : 'Review Upload →'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-flex-col">
            <div className="card">
              <h3 className="mb-20">Required Columns</h3>
              {['Date', 'Description', 'Amount'].map(col => (
                <div key={col} className="required-col-item">
                  <span className="required-col-icon"><Check size={14} /></span>
                  <code className="code-text">{col}</code>
                </div>
              ))}
              <div className="optional-col-text">
                Fuzzy mapping detects alternate names like <code>Txn Date</code> or <code>Narration</code>.
              </div>
            </div>

            <div className="card info-panel-card">
              <div className="info-panel-icon"><Bot size={28} /></div>
              <h3 className="info-panel-title">AI Auto-Categorization</h3>
              <p className="info-panel-desc">
                If the category column is missing, our ML model will automatically predict categories for every row.
              </p>
            </div>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="card p-0">
          <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
            <div>
              <h3>Review AI Predictions</h3>
              <p className="text-secondary text-sm">Please verify the categories before importing.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-ghost" onClick={() => { setStep('upload'); setFile(null); }}>Cancel</button>
              <button className="btn btn-dark" onClick={handleConfirm}>Confirm Import</button>
            </div>
          </div>
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '900px' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map(t => (
                  <tr key={t.id}>
                    <td className="tabular-text text-secondary">{t.date}</td>
                    <td><div className="truncate-text font-semibold" style={{ maxWidth: '180px' }} title={t.description}>{t.description}</div></td>
                    <td><span className={`badge badge-${t.type?.toLowerCase()}`}>{t.type}</span></td>
                    <td className={`transaction-amount ${t.type?.toLowerCase() === 'credit' ? 'credit' : ''}`}>
                      {t.type?.toLowerCase() === 'credit' ? '+' : '−'}{fmt(t.amount)}
                    </td>
                    <td>
                      {t.status === 'AI Predicted' 
                        ? <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><Bot size={12} style={{marginRight: 4}}/> AI Predicted</span>
                        : <span className="badge badge-neutral">Provided</span>}
                    </td>
                    <td>{renderConfidenceBadge(t.confidence)}</td>
                    <td>
                      <input 
                        type="text" 
                        className="input" 
                        style={{ height: '32px', padding: '0 8px', fontSize: '13px' }}
                        value={t.category} 
                        onChange={(e) => handleCategoryChange(t.id, e.target.value)} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === 'saving' && (
        <div className="card center-content" style={{ minHeight: '400px' }}>
          <div className="spinner mb-20" />
          <h3>Saving Transactions...</h3>
          <p className="text-secondary">Please wait while we update your database.</p>
        </div>
      )}

      {step === 'success' && summary && (
        <div className="card success-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="success-card-content" style={{ flexDirection: 'column', textAlign: 'center', alignItems: 'center' }}>
            <div className="success-icon mb-16"><CheckCircle size={48} color="var(--green)" /></div>
            <h2 className="success-title mb-8">CSV Analysis Complete</h2>
            <p className="success-desc mb-24">Successfully imported {summary.imported} transactions.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%', textAlign: 'left', background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px' }}>
              <div className="text-secondary">Rows Found: <span className="font-semibold text-primary">{summary.rows_found}</span></div>
              <div className="text-secondary">AI Categorized: <span className="font-semibold text-primary">{summary.ai_categorized}</span></div>
              <div className="text-secondary">User Corrected: <span className="font-semibold text-primary">{summary.user_corrected}</span></div>
              <div className="text-secondary">Avg Confidence: <span className="font-semibold text-primary">{(summary.average_confidence * 100).toFixed(1)}%</span></div>
              
              {summary.model_updated && (
                <div style={{ gridColumn: 'span 2', marginTop: '12px', padding: '12px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--green)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bot size={18} />
                  <strong>Model Updated Successfully:</strong> Your corrections were learned in the background.
                </div>
              )}
            </div>
            
            <button className="btn btn-dark mt-24" onClick={() => { setStep('upload'); setSummary(null); setPreviewData([]); }}>Upload Another File</button>
          </div>
        </div>
      )}
    </Layout>
  );
}
