import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, credits, MONTHS } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import { useAuth } from '../lib/auth.jsx';
import SeasonStrip from '../components/SeasonStrip.jsx';

function PledgeForm({ product, existing, onDone }) {
  const [qty, setQty] = useState(existing?.quantityPerWeek ?? 1);
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    try {
      await api('/api/pledges', { method: 'POST', body: { productId: product.id, quantityPerWeek: Number(qty) } });
      onDone();
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <form className="pledge-form" onSubmit={submit}>
      <input type="number" min="0.5" step="0.5" max="500" value={qty} onChange={(e) => setQty(e.target.value)} aria-label="Quantity per week" />
      <span className="muted small">{product.unit} / week</span>
      <button className="btn btn-primary btn-sm">{existing ? 'Update' : 'Pledge'}</button>
      {error && <span className="error small">{error}</span>}
    </form>
  );
}

function ProductCard({ product, nutrients, month, pledge, canPledge, onChange }) {
  const top = nutrients
    .map((n) => ({ ...n, pct: product.percentDailyValue[n.key] }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);
  return (
    <article className={`card product${product.inSeason ? '' : ' off-season'}`}>
      <header className="product-head">
        <div>
          <h4>{product.name}</h4>
          <span className="muted small">per {product.unit}</span>
        </div>
        <div className="value-badge" title="Harvest Credits per unit, including any community-gap bonus">
          {credits(product.value)}
          {product.bonus > 0 && <span className="bonus">+{Math.round(product.bonus * 100)}% gap bonus</span>}
        </div>
      </header>
      <p className="small muted">
        ~{product.laborMinutes} min labor · ${product.inputCost.toFixed(2)} materials ·{' '}
        {product.producers ? `${product.producers} neighbor${product.producers > 1 ? 's' : ''} producing` : 'nobody producing yet'}
      </p>
      <ul className="nutrient-chips">
        {top.map((n) => (
          <li key={n.key}>
            <strong>{Math.round(n.pct * 100)}%</strong> {n.label}
          </li>
        ))}
      </ul>
      <SeasonStrip season={product.season} month={month} />
      {canPledge && (
        <div className="product-foot">
          {pledge && <span className="pill">You pledge {pledge.quantityPerWeek}/wk</span>}
          <PledgeForm product={product} existing={pledge} onDone={onChange} />
        </div>
      )}
    </article>
  );
}

export default function Catalog() {
  const { me, refresh } = useAuth();
  const { data, error, reload } = useApi('/api/catalog');

  if (error) return <main className="container section error">{error}</main>;
  if (!data) return <main className="container section muted">Loading…</main>;

  const pledgeFor = (id) => me?.pledges.find((p) => p.productId === id);
  const onChange = () => {
    refresh();
    reload();
  };

  return (
    <main className="container section">
      <h1>What to grow, bake, and raise</h1>
      <p className="lead">
        Values are in Harvest Credits (1 HC = 1 hour of labor + materials at ${data.settings.dollarsPerCredit}/credit).
        Percentages are the share of an adult's Daily Value in one unit. Foods rich in what the neighborhood is short on for{' '}
        {MONTHS[data.month - 1]} earn a gap bonus.
      </p>
      {!me && (
        <p className="notice">
          <Link to="/join">Join</Link> to pledge what you'll produce each week.
        </p>
      )}
      {data.activities.map((activity) => {
        const products = data.products.filter((p) => p.activity === activity.id);
        return (
          <section key={activity.id} className="activity">
            <div className="activity-head">
              <h2>
                <span aria-hidden="true">{activity.icon}</span> {activity.name}
              </h2>
              <p className="muted">{activity.blurb}</p>
              <details className="rules">
                <summary>Typical rules in Chicago-area suburbs</summary>
                <p>{activity.localRules}</p>
              </details>
            </div>
            <div className="product-grid">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  nutrients={data.nutrients}
                  month={data.month}
                  pledge={pledgeFor(p.id)}
                  canPledge={Boolean(me)}
                  onChange={onChange}
                />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
