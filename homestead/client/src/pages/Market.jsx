import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, credits } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import { useAuth } from '../lib/auth.jsx';

function NewListing({ products, onDone }) {
  const [form, setForm] = useState({ productId: products[0]?.id || '', quantity: 1, note: '' });
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    try {
      await api('/api/listings', { method: 'POST', body: { ...form, quantity: Number(form.quantity) } });
      setForm({ ...form, quantity: 1, note: '' });
      setError('');
      onDone();
    } catch (err) {
      setError(err.message);
    }
  }
  const unit = products.find((p) => p.id === form.productId)?.unit;
  return (
    <form className="card form inline-form" onSubmit={submit}>
      <h3>Offer something you have</h3>
      <div className="row">
        <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} aria-label="Food">
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input type="number" min="0.5" step="0.5" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} aria-label="Quantity" />
        <span className="muted small">{unit}</span>
      </div>
      <input placeholder="Note: variety, pickup details…" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      {error && <p className="error">{error}</p>}
      <button className="btn btn-primary btn-sm">Post listing</button>
    </form>
  );
}

export default function Market() {
  const { me } = useAuth();
  const { data: listings, reload } = useApi('/api/listings');
  const { data: catalog } = useApi('/api/catalog');
  const [filter, setFilter] = useState('all');

  const productById = new Map((catalog?.products || []).map((p) => [p.id, p]));
  const shown = (listings || []).filter((l) => filter === 'all' || productById.get(l.productId)?.activity === filter);

  return (
    <main className="container section">
      <h1>Market</h1>
      <p className="lead">What neighbors have ready now. Propose a trade, and any difference in value settles in Harvest Credits.</p>

      <div className="market-layout">
        <div>
          {catalog && (
            <div className="filter-row">
              <button type="button" className={`chip${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
                All
              </button>
              {catalog.activities.map((a) => (
                <button type="button" key={a.id} className={`chip${filter === a.id ? ' active' : ''}`} onClick={() => setFilter(a.id)}>
                  {a.icon} {a.name}
                </button>
              ))}
            </div>
          )}
          {!listings ? (
            <p className="muted">Loading…</p>
          ) : shown.length === 0 ? (
            <p className="notice">Nothing listed here yet.</p>
          ) : (
            <div className="listing-grid">
              {shown.map((l) => {
                const p = productById.get(l.productId);
                const mine = me && l.memberId === me.member.id;
                return (
                  <article key={l.id} className="card listing">
                    <h4>
                      {l.quantity} × {p?.name || l.productId}
                    </h4>
                    <p className="muted small">
                      {p?.unit} · {p ? credits(p.value) : ''} each · from {l.member?.name} ({l.member?.neighborhood || 'nearby'})
                    </p>
                    {l.note && <p className="small">{l.note}</p>}
                    {mine ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={async () => {
                          await api(`/api/listings/${l.id}`, { method: 'DELETE' });
                          reload();
                        }}
                      >
                        Remove
                      </button>
                    ) : me ? (
                      <Link className="btn btn-primary btn-sm" to={`/trade/new?to=${l.memberId}&listing=${l.id}&product=${l.productId}`}>
                        Propose a trade
                      </Link>
                    ) : (
                      <Link className="btn btn-ghost btn-sm" to="/join">
                        Join to trade
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
        {me && catalog && <NewListing products={catalog.products} onDone={reload} />}
      </div>
    </main>
  );
}
