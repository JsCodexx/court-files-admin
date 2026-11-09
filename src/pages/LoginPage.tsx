import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminLogin(email.trim(), password);
      login(res.token, { name: res.user.name, email: res.user.email });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-layout">
      <section className="login-hero" aria-hidden>
        <div className="login-hero__inner">
          <p className="login-hero__eyebrow">Court Files</p>
          <h1>Operations console</h1>
          <p>
            Monitor advocates, subscriptions, and revenue from one secure
            dashboard.
          </p>
          <ul className="login-hero__list">
            <li>User access & billing</li>
            <li>Live plan pricing</li>
            <li>Monthly revenue trends</li>
          </ul>
        </div>
      </section>

      <section className="login-form-wrap">
        <form className="login-form card" onSubmit={onSubmit}>
          <h2>Sign in</h2>
          <p className="muted">Superadmin credentials only.</p>
          {error ? <p className="banner banner--error">{error}</p> : null}
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
            {loading ? 'Signing in…' : 'Continue'}
          </button>
        </form>
      </section>
    </div>
  );
}
