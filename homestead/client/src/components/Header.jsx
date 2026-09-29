import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { credits } from '../lib/api.js';

export default function Header() {
  const { me, signOut } = useAuth();
  return (
    <header className="site-header">
      <div className="container">
        <Link to="/" className="brand">
          <span className="brand-mark">❦</span>
          Homestead Commons
        </Link>
        <nav>
          <NavLink to="/catalog">What to grow</NavLink>
          <NavLink to="/community">Community plate</NavLink>
          <NavLink to="/market">Market</NavLink>
          {me ? (
            <>
              <NavLink to="/me" className="nav-me">
                {me.member.name.split(' ')[0]} · <strong>{credits(me.balance)}</strong>
              </NavLink>
              <button type="button" className="link-button" onClick={signOut}>
                Log out
              </button>
            </>
          ) : (
            <Link to="/join" className="btn btn-primary btn-sm">
              Join
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
