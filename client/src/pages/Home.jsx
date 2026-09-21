import { Link } from 'react-router-dom';

const SERVICES = [
  {
    icon: '🏠',
    title: 'Standard Cleaning',
    desc: 'Dusting, vacuuming, mopping, kitchens & bathrooms — kept up on a regular schedule.',
  },
  {
    icon: '✨',
    title: 'Deep Cleaning',
    desc: 'Baseboards, grout, inside appliances, and everywhere a quick clean skips.',
  },
  {
    icon: '📦',
    title: 'Move In / Move Out',
    desc: 'A spotless handoff for landlords, tenants, and buyers — bring the security deposit home.',
  },
  {
    icon: '🧱',
    title: 'Post-Construction',
    desc: 'Dust, debris, and residue cleared after a renovation or build so the space is move-in ready.',
  },
];

const STEPS = [
  { title: 'Tell us about the space', desc: 'Rooms, square footage, and the kind of clean you need.' },
  { title: 'Upload a few photos', desc: 'Snap the areas that need attention so we can size the job accurately.' },
  { title: 'Get your instant estimate', desc: 'See a transparent price range on the spot — no waiting for a callback.' },
  { title: 'Book your cleaning', desc: 'We confirm details and get it on the calendar.' },
];

const REVIEWS = [
  {
    quote: 'The photo upload made the quote spot-on. No surprise charges when the crew showed up.',
    who: 'Priya R., condo owner',
  },
  {
    quote: 'Move-out clean got our full deposit back. Booked in five minutes from the estimate page.',
    who: 'Daniel M., renter',
  },
  {
    quote: 'Post-construction dust was everywhere. They quoted it accurately from a few pictures.',
    who: 'Alicia T., contractor',
  },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <h1>Spotless spaces, priced honestly — before you ever pick up the phone.</h1>
            <p className="lead">
              Upload a few photos of the areas you want cleaned, answer a couple of quick questions, and get a
              transparent instant estimate. No sales calls required to see a price.
            </p>
            <div className="hero-actions">
              <Link to="/estimate" className="btn btn-primary">Get my instant estimate →</Link>
              <a href="#services" className="btn btn-ghost" style={{ color: 'white', borderColor: 'white' }}>
                See our services
              </a>
            </div>
            <div className="hero-badges">
              <span className="hero-badge">✔ Licensed &amp; insured</span>
              <span className="hero-badge">✔ Satisfaction guaranteed</span>
              <span className="hero-badge">✔ No obligation quote</span>
            </div>
          </div>
          <div className="hero-card">
            <h3>What you'll need</h3>
            <ul>
              <li>2 minutes</li>
              <li>Basic details about the space (rooms, size)</li>
              <li>A few photos (optional, but gets you a tighter price)</li>
            </ul>
            <Link to="/estimate" className="btn btn-primary" style={{ width: '100%' }}>
              Start my estimate
            </Link>
          </div>
        </div>
      </section>

      <section id="services">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">Services</div>
            <h2>Cleaning for every kind of space</h2>
            <p style={{ color: 'var(--color-muted)' }}>
              Pick a service on the estimate form and we'll price it based on your home's details.
            </p>
          </div>
          <div className="grid grid-4">
            {SERVICES.map((s) => (
              <div className="card" key={s.title}>
                <div className="icon-badge">{s.icon}</div>
                <h3>{s.title}</h3>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.92rem' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" style={{ background: 'var(--color-bg-soft)' }}>
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">How it works</div>
            <h2>From photos to a price in minutes</h2>
          </div>
          <div className="steps-row">
            {STEPS.map((step, i) => (
              <div className="step-item" key={step.title}>
                <div className="step-number">{i + 1}</div>
                <h3 style={{ fontSize: '1.05rem' }}>{step.title}</h3>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="reviews">
        <div className="container">
          <div className="section-heading">
            <div className="eyebrow">Reviews</div>
            <h2>Trusted by homeowners &amp; renters</h2>
          </div>
          <div className="grid grid-3">
            {REVIEWS.map((r) => (
              <div className="testimonial" key={r.who}>
                <div className="stars">★★★★★</div>
                <p style={{ fontSize: '0.95rem' }}>&ldquo;{r.quote}&rdquo;</p>
                <div className="who">{r.who}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <h2>Ready to see your price?</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 480, margin: '0 auto 24px' }}>
            It takes about two minutes and there's no obligation to book.
          </p>
          <Link to="/estimate" className="btn btn-primary" style={{ background: 'white', color: 'var(--color-primary-dark)' }}>
            Get my instant estimate
          </Link>
        </div>
      </section>
    </>
  );
}
