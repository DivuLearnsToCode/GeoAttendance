import React from 'react';

export default function Stat({ label, value, accent = false }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-soft/60 px-6 py-5">
      <div className={`font-display text-3xl ${accent ? 'text-brass' : 'text-parchment'}`}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide2 text-stone">{label}</div>
    </div>
  );
}
