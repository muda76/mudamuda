import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatAmount, MONTHS } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import CoverageBar from '../components/CoverageBar.jsx';

export default function Community() {
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const { data, error } = useApi(`/api/community?month=${month}`);
  const { data: members } = useApi('/api/members');

  return (
    <main className="container section">
      <div className="page-head">
        <div>
          <h1>The community plate</h1>
          <p className="lead">
            How much of the neighborhood's weekly nutrition our pledges cover, measured against the goal of sourcing{' '}
            {data ? Math.round(data.goal * 100) : '…'}% of it locally.
          </p>
        </div>
        <label className="month-picker">
          Month
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="error">{error}</p>}
      {!data ? (
        <p className="muted">Loading…</p>
      ) : data.households === 0 ? (
        <p className="notice">
          No households yet. <Link to="/join">Be the first to join.</Link>
        </p>
      ) : (
        <div className="community-grid">
          <section className="card">
            <h3>
              Weekly coverage · {data.households} households, {data.people} people
            </h3>
            {data.nutrients.map((n) => (
              <CoverageBar
                key={n.key}
                label={n.label}
                value={n.coverage}
                detail={`${formatAmount(n.supply, n.unit)} of ${formatAmount(n.need, n.unit)} goal`}
              />
            ))}
          </section>

          <section>
            <div className="card">
              <h3>Where we're short</h3>
              {data.recommendations.length === 0 ? (
                <p>Every tracked nutrient meets the goal this month. 🎉</p>
              ) : (
                <ul className="gap-list">
                  {data.recommendations.map((r) => (
                    <li key={r.nutrient}>
                      <strong>{r.label}</strong> <span className="muted">({Math.round(r.coverage * 100)}%)</span>
                      {r.products.length > 0 ? (
                        <div className="small">
                          Most per hour of work: {r.products.map((p) => p.name).join(', ')}
                        </div>
                      ) : (
                        <div className="small muted">
                          {r.nutrient === 'vitaminB12'
                            ? 'Only animal foods like eggs supply B12, and none are in production this month.'
                            : 'Nothing in the catalog supplies this in season.'}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/catalog" className="btn btn-primary btn-sm">
                Pledge to fill a gap
              </Link>
            </div>

            <div className="card">
              <h3>In production</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Food</th>
                    <th>Producers</th>
                    <th>Per week</th>
                  </tr>
                </thead>
                <tbody>
                  {data.production.map((p) => (
                    <tr key={p.productId} className={p.inSeason ? '' : 'off-season'}>
                      <td>
                        {p.name}
                        {!p.inSeason && <span className="muted small"> (off season)</span>}
                      </td>
                      <td>{p.producers}</td>
                      <td>
                        {p.quantityPerWeek} {p.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {members && members.length > 0 && (
        <section className="section-tight">
          <h2>Neighbors</h2>
          <div className="member-grid">
            {members.map((m) => (
              <article key={m.id} className="card member">
                <h4>{m.name}</h4>
                <p className="muted small">
                  {m.neighborhood || 'Neighborhood not set'} · household of {m.householdSize} · balance{' '}
                  {m.balance.toFixed(2)} HC
                </p>
                {m.bio && <p className="small">{m.bio}</p>}
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
