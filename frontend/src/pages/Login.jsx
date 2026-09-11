import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'organizer' ? '/organizer' : '/events');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6">
      <p className="text-xs uppercase tracking-wide2 text-brass">Welcome back</p>
      <h1 className="mt-2 font-display text-4xl text-parchment">Sign in to Presence</h1>
      <p className="mt-3 text-sm text-stone">Geo-verified attendance, made effortless.</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-5">
        <div>
          <label className="text-xs uppercase tracking-wide2 text-stone">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-lg border border-white/15 bg-ink-soft px-4 py-3 text-parchment outline-none focus:border-brass"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide2 text-stone">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-lg border border-white/15 bg-ink-soft px-4 py-3 text-parchment outline-none focus:border-brass"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-brass py-3 font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-stone">
        New here?{' '}
        <Link to="/register" className="text-brass hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
