import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brass/60 text-brass font-display text-sm">
            P
          </span>
          <span className="font-display text-lg tracking-wide text-parchment">Presence</span>
        </Link>

        {user && (
          <nav className="flex items-center gap-6 text-sm text-stone">
            {user.role === 'organizer' ? (
              <Link to="/organizer" className="hover:text-brass transition-colors">Events</Link>
            ) : (
              <>
                <Link to="/events" className="hover:text-brass transition-colors">Upcoming</Link>
                <Link to="/scan" className="hover:text-brass transition-colors">Scan in</Link>
              </>
            )}
            <span className="hidden sm:inline text-parchment/70">{user.name}</span>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="rounded-full border border-white/15 px-4 py-1.5 text-parchment hover:border-brass hover:text-brass transition-colors"
            >
              Sign out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
