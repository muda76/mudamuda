import { Link, useLocation, Navigate } from 'react-router-dom';

export default function ThankYou() {
  const { state } = useLocation();

  if (!state?.estimate) {
    return <Navigate to="/estimate" replace />;
  }

  const { estimate, name } = state;

  return (
    <div className="thankyou-page">
      <div className="thankyou-card">
        <div className="thankyou-check">✓</div>
        <h1>Thanks{name ? `, ${name}` : ''}!</h1>
        <p style={{ color: 'var(--color-muted)' }}>
          We've got your request. Your estimated price range is:
        </p>
        <div className="summary-total" style={{ fontSize: '2.4rem' }}>
          ${estimate.low} – ${estimate.high}
        </div>
        <p style={{ color: 'var(--color-muted)', marginTop: 20 }}>
          A member of our team will review your details (and any photos you shared) and reach out shortly to
          confirm the price and get your cleaning on the calendar.
        </p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 12 }}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
