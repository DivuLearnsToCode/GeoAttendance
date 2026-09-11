import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'attendee' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      navigate(user.role === 'organizer' ? '/organizer' : '/events');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6">
      <p className="text-xs uppercase tracking-wide2 text-brass">Get started</p>
      <h1 className="mt-2 font-display text-4xl text-parchment">Create your account</h1>

      <form onSubmit={handleSubmit} className="mt-10 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'attendee', label: 'Attendee' },
            { value: 'organizer', label: 'Organizer' },
          ].map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => setForm((f) => ({ ...f, role: opt.value }))}
              className={`rounded-lg border px-4 py-3 text-sm transition-colors ${
                form.role === opt.value
                  ? 'border-brass bg-brass/10 text-brass'
                  : 'border-white/15 text-stone hover:border-white/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide2 text-stone">Full name</label>
          <input
            required
            value={form.name}
            onChange={update('name')}
            className="mt-2 w-full rounded-lg border border-white/15 bg-ink-soft px-4 py-3 text-parchment outline-none focus:border-brass"
            placeholder="Ananya Rao"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide2 text-stone">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={update('email')}
            className="mt-2 w-full rounded-lg border border-white/15 bg-ink-soft px-4 py-3 text-parchment outline-none focus:border-brass"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide2 text-stone">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={update('password')}
            className="mt-2 w-full rounded-lg border border-white/15 bg-ink-soft px-4 py-3 text-parchment outline-none focus:border-brass"
            placeholder="At least 6 characters"
          />
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-brass py-3 font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-stone">
        Already have an account?{' '}
        <Link to="/login" className="text-brass hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
