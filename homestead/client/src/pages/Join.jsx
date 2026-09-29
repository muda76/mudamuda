import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

export default function Join() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signup');
  const [form, setForm] = useState({ name: '', email: '', password: '', neighborhood: '', householdSize: 2, bio: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'signup') {
        await signIn('/api/auth/signup', { ...form, householdSize: Number(form.householdSize) });
        navigate('/catalog');
      } else {
        await signIn('/api/auth/login', { email: form.email, password: form.password });
        navigate('/me');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container section narrow">
      <div className="tabs">
        <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
          Join
        </button>
        <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
          Log in
        </button>
      </div>
      <form className="card form" onSubmit={submit}>
        {mode === 'signup' && (
          <>
            <label>
              Your name
              <input required value={form.name} onChange={set('name')} autoComplete="name" />
            </label>
            <label>
              Neighborhood or village
              <input value={form.neighborhood} onChange={set('neighborhood')} placeholder="e.g. Downers Grove" />
            </label>
            <label>
              People in your household
              <input type="number" min="1" max="20" required value={form.householdSize} onChange={set('householdSize')} />
              <span className="hint">Used to size the community's nutritional needs.</span>
            </label>
          </>
        )}
        <label>
          Email
          <input type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={set('password')}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        </label>
        {mode === 'signup' && (
          <label>
            <span>
              A little about you <span className="muted">(optional)</span>
            </span>
            <textarea rows="3" value={form.bio} onChange={set('bio')} placeholder="What you grow, bake, or want to learn." />
          </label>
        )}
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'One moment…' : mode === 'signup' ? 'Create my account' : 'Log in'}
        </button>
      </form>
    </main>
  );
}
