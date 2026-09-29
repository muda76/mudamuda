import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import { useAuth } from '../lib/auth.jsx';

export default function Home() {
  const { me } = useAuth();
  const { data } = useApi('/api/community');
  const weakest = data?.recommendations?.[0];

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Neighbors feeding neighbors</p>
            <h1>One bakes bread. One keeps hens. One grows greens. Together, everyone eats well.</h1>
            <p className="lead">
              Homestead Commons helps a suburban neighborhood decide who grows, bakes, and raises what — so the whole
              community covers its nutritional needs — and then trade fairly for everything you don't make yourself.
            </p>
            <div className="hero-actions">
              <Link to={me ? '/catalog' : '/join'} className="btn btn-primary">
                {me ? 'Pick what to produce' : 'Join your neighbors'}
              </Link>
              <Link to="/community" className="btn btn-ghost">
                See the community plate
              </Link>
            </div>
          </div>
          <aside className="card hero-card">
            <h3>This month, right now</h3>
            {data ? (
              <ul className="stat-list">
                <li>
                  <strong>{data.households}</strong> households, <strong>{data.people}</strong> people
                </li>
                <li>
                  <strong>{data.production.filter((p) => p.inSeason).length}</strong> foods in production
                </li>
                <li>
                  <strong>{data.openListings}</strong> items up for trade
                </li>
                {weakest && (
                  <li>
                    Biggest gap: <strong>{weakest.label}</strong> at {Math.round(weakest.coverage * 100)}% of goal
                  </li>
                )}
              </ul>
            ) : (
              <p className="muted">Loading…</p>
            )}
          </aside>
        </div>
      </section>

      <section className="container section">
        <h2>How it works</h2>
        <div className="steps">
          <div className="card">
            <span className="step-num">1</span>
            <h3>Pick your craft</h3>
            <p>
              Choose what fits your yard and your time: sourdough, a small flock, raised beds, berries, a hive, mushrooms in
              the basement. Each option shows its nutrients, labor, season, and typical local rules.
            </p>
          </div>
          <div className="card">
            <span className="step-num">2</span>
            <h3>See the whole plate</h3>
            <p>
              Your weekly pledge joins everyone else's. The community dashboard shows which nutrients the neighborhood covers
              and which it's short on, and suggests the most labor-efficient ways to close each gap.
            </p>
          </div>
          <div className="card">
            <span className="step-num">3</span>
            <h3>Trade fairly</h3>
            <p>
              Every item is valued in Harvest Credits: one credit is one hour of a neighbor's work plus materials. Uneven
              trades settle the difference in credits, so the baker can take eggs now and repay the neighborhood later.
            </p>
          </div>
        </div>
      </section>

      <section className="container section fairness">
        <h2>What makes a trade fair?</h2>
        <div className="fair-grid">
          <div>
            <h4>⏱ Effort</h4>
            <p>An hour of kneading is worth an hour of weeding. Labor time is the core of every item's value.</p>
          </div>
          <div>
            <h4>🧾 Materials</h4>
            <p>Feed, flour, seed, and jars are added at $20 per credit so input costs are covered.</p>
          </div>
          <div>
            <h4>🥗 Nutrition</h4>
            <p>
              Foods that fill the community's current gaps earn up to 25% more, which rewards growing what the neighborhood
              needs most.
            </p>
          </div>
          <div>
            <h4>⚖️ Mutual credit</h4>
            <p>
              Balances across the community always sum to zero. Anyone can dip to −10 credits, so a trade never waits for a
              perfect match.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
