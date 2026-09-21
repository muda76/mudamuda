import { useState } from 'react';
import { apiUrl } from '../lib/api.js';

export default function Admin() {
  const [token, setToken] = useState(sessionStorage.getItem('adminToken') || '');
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadLeads = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiUrl(`/api/leads?token=${encodeURIComponent(token)}`));
      if (res.status === 401) throw new Error('Incorrect admin token.');
      if (!res.ok) throw new Error('Could not load estimate requests.');
      const data = await res.json();
      sessionStorage.setItem('adminToken', token);
      setLeads(data);
    } catch (err) {
      setError(err.message);
      setLeads(null);
    } finally {
      setLoading(false);
    }
  };

  if (!leads) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <h2>Admin login</h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
            Enter the admin token to view submitted estimate requests.
          </p>
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={loadLeads}>
            <div className="field" style={{ marginBottom: 16 }}>
              <label>Admin token</label>
              <input type="password" value={token} onChange={(e) => setToken(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading || !token}>
              {loading ? 'Checking…' : 'View requests'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Estimate requests ({leads.length})</h1>
          <button className="btn btn-secondary" onClick={loadLeads} disabled={loading}>
            Refresh
          </button>
        </div>

        {leads.length === 0 && <p style={{ color: 'var(--color-muted)' }}>No requests yet.</p>}

        {leads.map((lead) => (
          <div className="lead-card" key={lead.id}>
            <div className="lead-head">
              <div>
                <strong>{lead.contact.name}</strong>
                <div className="lead-meta">
                  {lead.contact.email} · {lead.contact.phone}
                  {lead.contact.address ? ` · ${lead.contact.address}` : ''}
                </div>
                <div className="lead-meta">{new Date(lead.createdAt).toLocaleString()}</div>
              </div>
              <div className="lead-price">
                ${lead.estimate.low} – ${lead.estimate.high}
              </div>
            </div>

            <div className="tag-row">
              <span className="tag">{lead.answers.serviceType}</span>
              <span className="tag">{lead.answers.sqft} sq ft</span>
              <span className="tag">
                {lead.answers.bedrooms} bd / {lead.answers.bathrooms} ba
              </span>
              <span className="tag">{lead.answers.condition}</span>
              <span className="tag">{lead.answers.frequency}</span>
              {lead.answers.hasPets && <span className="tag">Pets</span>}
            </div>

            {lead.contact.notes && <p style={{ fontSize: '0.9rem' }}>{lead.contact.notes}</p>}

            {lead.photos.length > 0 && (
              <div className="lead-photos">
                {lead.photos.map((p) => (
                  <a href={apiUrl(p.url)} target="_blank" rel="noreferrer" key={p.filename}>
                    <img src={apiUrl(p.url)} alt={p.originalName} />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
