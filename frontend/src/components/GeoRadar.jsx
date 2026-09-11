import React from 'react';

// A small "signal verifying" visual used while geolocation is being checked.
export default function GeoRadar({ status = 'checking' }) {
  const colors = {
    checking: 'border-brass/60 text-brass',
    success: 'border-emerald text-emerald',
    error: 'border-red-400/70 text-red-300',
  };

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      {status === 'checking' && (
        <>
          <span className={`signal-ring absolute h-full w-full rounded-full border ${colors[status]}`} />
          <span
            className={`signal-ring absolute h-full w-full rounded-full border ${colors[status]}`}
            style={{ animationDelay: '0.7s' }}
          />
        </>
      )}
      <div className={`flex h-16 w-16 items-center justify-center rounded-full border ${colors[status]} bg-ink-soft`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 21s7-6.1 7-12a7 7 0 10-14 0c0 5.9 7 12 7 12z" strokeLinejoin="round" />
          <circle cx="12" cy="9" r="2.4" />
        </svg>
      </div>
    </div>
  );
}
