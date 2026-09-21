export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div>
          <div className="brand" style={{ color: 'white', marginBottom: 12 }}>
            <span className="brand-mark">✦</span>
            Clean Sweep by Heather
          </div>
          <p style={{ maxWidth: '32ch', color: '#94a3b8', fontSize: '0.9rem' }}>
            Professional home &amp; office cleaning with upfront, photo-backed pricing.
          </p>
        </div>
        <div className="foot-cols">
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="/#services">Services</a></li>
              <li><a href="/#how-it-works">How it works</a></li>
              <li><a href="/#reviews">Reviews</a></li>
            </ul>
          </div>
          <div>
            <h4>Get started</h4>
            <ul>
              <li><a href="/estimate">Instant estimate</a></li>
              <li><a href="tel:18885551234">(888) 555-1234</a></li>
              <li><a href="mailto:hello@cleansweepbyheather.com">hello@cleansweepbyheather.com</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} Clean Sweep by Heather. All rights reserved.
      </div>
    </footer>
  );
}
