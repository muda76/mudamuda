import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api, credits } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import { useAuth } from '../lib/auth.jsx';

function ItemsEditor({ title, items, onChange, products }) {
  const update = (i, patch) => onChange(items.map((item, j) => (j === i ? { ...item, ...patch } : item)));
  return (
    <div className="items-editor">
      <h4>{title}</h4>
      {items.length === 0 && <p className="muted small">Nothing — the difference will be settled in credits.</p>}
      {items.map((item, i) => (
        <div className="row" key={i}>
          <select value={item.productId} onChange={(e) => update(i, { productId: e.target.value })} aria-label="Food">
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.unit})
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={item.quantity}
            onChange={(e) => update(i, { quantity: e.target.value })}
            aria-label="Quantity"
          />
          <button type="button" className="link-button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove item">
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange([...items, { productId: products[0].id, quantity: 1 }])}>
        + Add item
      </button>
    </div>
  );
}

const RATING_TEXT = {
  balanced: 'Balanced — within 10% either way.',
  close: 'Close — a little credit will change hands.',
  uneven: 'Uneven — the difference will be settled in credits.',
};

export default function ProposeTrade() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { me, loading } = useAuth();
  const { data: catalog } = useApi('/api/catalog');
  const { data: members } = useApi('/api/members');
  const [toId, setToId] = useState(params.get('to') || '');
  const [give, setGive] = useState([]);
  const [get, setGet] = useState(params.get('product') ? [{ productId: params.get('product'), quantity: 1 }] : []);
  const [message, setMessage] = useState('');
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');

  // Default the "give" side to something the member already produces.
  useEffect(() => {
    if (me && give.length === 0 && me.pledges[0]) setGive([{ productId: me.pledges[0].productId, quantity: 1 }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  useEffect(() => {
    const valid = (items) => items.filter((i) => Number(i.quantity) > 0);
    if (valid(give).length + valid(get).length === 0) {
      setQuote(null);
      return;
    }
    const timer = setTimeout(() => {
      api('/api/trades/quote', { method: 'POST', body: { give: valid(give), get: valid(get) } })
        .then((q) => {
          setQuote(q);
          setError('');
        })
        .catch((err) => setError(err.message));
    }, 250);
    return () => clearTimeout(timer);
  }, [give, get]);

  if (!loading && !me) return <Navigate to="/join" replace />;
  if (!catalog || !members || !me) return <main className="container section muted">Loading…</main>;

  const neighbors = members.filter((m) => m.id !== me.member.id);
  const valueOf = (id) => catalog.products.find((p) => p.id === id)?.value || 0;

  // Adjust the first "give" item's quantity so both sides come out even.
  function evenOut() {
    if (!quote || give.length === 0) return;
    const [first, ...rest] = give;
    const restValue = rest.reduce((s, i) => s + valueOf(i.productId) * Number(i.quantity), 0);
    const needed = (quote.get.credits - restValue) / valueOf(first.productId);
    const qty = Math.max(0.5, Math.round(needed * 2) / 2);
    setGive([{ ...first, quantity: qty }, ...rest]);
  }

  async function submit(e) {
    e.preventDefault();
    try {
      await api('/api/trades', {
        method: 'POST',
        body: { toId, give, get, message, listingId: params.get('listing') || undefined },
      });
      navigate('/me');
    } catch (err) {
      setError(err.message);
    }
  }

  const neighborName = neighbors.find((n) => n.id === toId)?.name || 'them';

  return (
    <main className="container section narrow-wide">
      <h1>Propose a trade</h1>
      <form className="card form" onSubmit={submit}>
        <label>
          Trade with
          <select required value={toId} onChange={(e) => setToId(e.target.value)}>
            <option value="">Choose a neighbor…</option>
            {neighbors.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} — {n.neighborhood || 'nearby'}
              </option>
            ))}
          </select>
        </label>
        <div className="trade-sides">
          <ItemsEditor title="You give" items={give} onChange={setGive} products={catalog.products} />
          <ItemsEditor title={`You get from ${neighborName}`} items={get} onChange={setGet} products={catalog.products} />
        </div>

        {quote && (
          <div className={`quote quote-${quote.rating}`}>
            <div className="quote-sides">
              <div>
                <span className="muted small">You give</span>
                <strong>{credits(quote.give.credits)}</strong>
                <span className="muted small">
                  {quote.give.laborMinutes} min labor · {quote.give.nutrientDays} nutrient-days
                </span>
              </div>
              <div className="quote-scale" aria-hidden="true">
                ⚖️
              </div>
              <div>
                <span className="muted small">You get</span>
                <strong>{credits(quote.get.credits)}</strong>
                <span className="muted small">
                  {quote.get.laborMinutes} min labor · {quote.get.nutrientDays} nutrient-days
                </span>
              </div>
            </div>
            <p>
              <strong>{RATING_TEXT[quote.rating]}</strong>{' '}
              {quote.creditDelta > 0 && `You'll earn ${credits(quote.creditDelta)}.`}
              {quote.creditDelta < 0 && `You'll spend ${credits(-quote.creditDelta)} (balance now ${credits(me.balance)}).`}
            </p>
            {quote.rating !== 'balanced' && give.length > 0 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={evenOut}>
                Even it out
              </button>
            )}
          </div>
        )}

        <label>
          <span>
            Message <span className="muted">(optional)</span>
          </span>
          <textarea rows="2" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Pickup time, porch drop-off…" />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={!toId || !quote}>
          Send proposal
        </button>
      </form>
    </main>
  );
}
