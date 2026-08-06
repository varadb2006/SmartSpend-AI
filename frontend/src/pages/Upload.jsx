import { useState, useRef } from 'react';
import { transactionsAPI } from '../services/api';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { FileText, Folder, CheckCircle, Bot, Check } from 'lucide-react';
import './Upload.css';


export default function Upload() {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith('.csv') && !f.name.endsWith('.xlsx')) {
      toast.error('Only .csv and .xlsx files are supported');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await transactionsAPI.upload(file);
      setResult(res.data);
      setFile(null);
      toast.success(`${res.data.total_processed} transactions uploaded!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally { setUploading(false); }
  };

  return (
    <Layout>
      <div className="page-header">
        <p className="section-label">Data Import</p>
        <h1>Upload Transactions</h1>
        <p>Import your bank statement — CSV or Excel file</p>
      </div>

      <div className="upload-grid">
        <div>
          {/* Drop Zone */}
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
                  <p>{(file.size / 1024).toFixed(1)} KB — ready to upload</p>
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
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload & Process →'}
                </button>
              </div>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="card success-card">
              <div className="success-card-content">
                <div className="success-icon"><CheckCircle size={28} color="var(--green)" /></div>
                <div>
                  <h3 className="success-title">Upload Successful!</h3>
                  <p className="success-desc">
                    <strong>{result.total_processed}</strong> transactions were imported and AI-categorized.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="form-flex-col">
          <div className="card">
            <h3 className="mb-20">Required Columns</h3>
            {['Date', 'Description', 'Amount', 'Transaction_Type'].map(col => (
              <div key={col} className="required-col-item">
                <span className="required-col-icon"><Check size={14} /></span>
                <code className="code-text">{col}</code>
              </div>
            ))}
            <div className="optional-col-text">
              Optional: <code>Category</code>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-20">Format Tips</h3>
            <ul className="format-tips-list">
              {[
                'Date format: YYYY-MM-DD',
                'Amount: numeric values only',
                'Type: debit or credit',
                'Max file size: 10 MB',
                'UTF-8 encoding recommended',
              ].map((tip, i) => (
                <li key={i} className="format-tip-item">
                  <span className="format-tip-bullet">·</span>{tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="card info-panel-card">
            <div className="info-panel-icon"><Bot size={28} /></div>
            <h3 className="info-panel-title">AI Auto-Categorization</h3>
            <p className="info-panel-desc">
              Our XGBoost model will automatically predict categories based on description and amount.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
