import { Link, Navigate } from 'react-router-dom';
import { api, credits } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import { useAuth } from '../lib/auth.jsx';

const ACTIONS = {
  proposed: { recipient: ['accept', 'decline'], proposer: ['cancel'] },
  accepted: { recipient: ['complete'], proposer: ['complete', 'cancel'] },
};

const ACTION_LABEL = { accept: 'Accept', decline: 'Decline', cancel: 'Cancel', complete: 'Mark exchanged' };

function describe(items) {
  return items.length ? items.map((i) => `${i.quantity} ${i.unit} ${i.name}`).join(', ') : 'credits only';
}

function TradeCard({ trade, meId, onChange }) {
  const iProposed = trade.fromId === meId;
  const other = iProposed ? trade.to : trade.from;
  const mineGive = iProposed ? trade.quote.give : trade.quote.get;
  const mineGet = iProposed ? trade.quote.get : trade.quote.give;
  const myDelta = iProposed ? trade.quote.creditDelta : -trade.quote.creditDelta;
  const actions = ACTIONS[trade.status]?.[iProposed ? 'proposer' : 'recipient'] || [];

  async function act(action) {
    try {
      await api(`/api/trades/${trade.id}/${action}`, { method: 'POST' });
      onChange();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <article className="card trade">
      <div className="trade-head">
        <strong>{other?.name}</strong>
        <span className={`status status-${trade.status}`}>{trade.status}</span>
      </div>
      <p className="small">
        You give: {describe(mineGive.lines)}
        <br />
        You get: {describe(mineGet.lines)}
      </p>
      <p className="small muted">
        {myDelta === 0 ? 'Even trade.' : myDelta > 0 ? `You earn ${credits(myDelta)}.` : `You spend ${credits(-myDelta)}.`}
        {trade.message && ` “${trade.message}”`}
      </p>
      {actions.length > 0 && (
        <div className="row">
          {actions.map((a) => (
            <button key={a} type="button" className={`btn btn-sm ${a === 'accept' || a === 'complete' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => act(a)}>
              {ACTION_LABEL[a]}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

export default function Me() {
  const { me, loading, refresh } = useAuth();
  const { data: trades, reload } = useApi(me ? '/api/trades' : null);
  const { data: catalog } = useApi('/api/catalog');

  if (loading) return <main className="container section muted">Loading…</main>;
  if (!me) return <Navigate to="/join" replace />;

  const productName = (id) => catalog?.products.find((p) => p.id === id)?.name || id;
  const onChange = () => {
    reload();
    refresh();
  };
  const active = (trades?.trades || []).filter((t) => t.status === 'proposed' || t.status === 'accepted');
  const past = (trades?.trades || []).filter((t) => !(t.status === 'proposed' || t.status === 'accepted'));

  return (
    <main className="container section">
      <div className="page-head">
        <div>
          <h1>Hi, {me.member.name.split(' ')[0]}</h1>
          <p className="muted">
            {me.member.neighborhood || 'Neighborhood not set'} · household of {me.member.householdSize}
          </p>
        </div>
        <div className={`balance card ${me.balance < 0 ? 'neg' : ''}`}>
          <span className="muted small">Harvest Credit balance</span>
          <strong>{credits(me.balance)}</strong>
          <span className="muted small">can go as low as {me.creditLimit}</span>
        </div>
      </div>

      <div className="me-grid">
        <section>
          <h2>Trades</h2>
          {active.length === 0 && (
            <p className="notice">
              No open trades. <Link to="/market">Browse the market</Link> or <Link to="/trade/new">propose one</Link>.
            </p>
          )}
          {active.map((t) => (
            <TradeCard key={t.id} trade={t} meId={me.member.id} onChange={onChange} />
          ))}
          {past.length > 0 && (
            <details className="past">
              <summary>History ({past.length})</summary>
              {past.map((t) => (
                <TradeCard key={t.id} trade={t} meId={me.member.id} onChange={onChange} />
              ))}
            </details>
          )}
        </section>

        <section>
          <h2>Your pledges</h2>
          {me.pledges.length === 0 ? (
            <p className="notice">
              You haven't pledged anything yet. <Link to="/catalog">Pick what to produce.</Link>
            </p>
          ) : (
            <ul className="plain-list">
              {me.pledges.map((p) => (
                <li key={p.id} className="card row-between">
                  <span>
                    {productName(p.productId)} — {p.quantityPerWeek} / week
                  </span>
                  <button
                    type="button"
                    className="link-button"
                    onClick={async () => {
                      await api(`/api/pledges/${p.id}`, { method: 'DELETE' });
                      refresh();
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <h2>Your listings</h2>
          {me.listings.filter((l) => l.quantity > 0).length === 0 ? (
            <p className="notice">
              Nothing listed. <Link to="/market">Offer something on the market.</Link>
            </p>
          ) : (
            <ul className="plain-list">
              {me.listings
                .filter((l) => l.quantity > 0)
                .map((l) => (
                  <li key={l.id} className="card">
                    {l.quantity} × {productName(l.productId)}
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
