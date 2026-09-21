import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="site-header">
      <div className="container">
        <Link to="/" className="brand">
          <span className="brand-mark">✦</span>
          Clean Sweep by Heather
        </Link>
        <nav>
          <a href="/#services">Services</a>
          <a href="/#how-it-works">How it works</a>
          <a href="/#reviews">Reviews</a>
          <Link to="/estimate" className="btn btn-primary" style={{ padding: '10px 22px' }}>
            Get an instant estimate
          </Link>
        </nav>
      </div>
    </header>
  );
}
