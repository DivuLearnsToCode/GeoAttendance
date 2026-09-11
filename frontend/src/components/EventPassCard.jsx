import React from 'react';

// A "boarding pass" styled card for an event — the visual centerpiece of the attendee view.
export default function EventPassCard({ event, action }) {
  const date = new Date(`${event.event_date}T${event.event_time || '00:00'}`);
  const day = date.toLocaleDateString(undefined, { day: '2-digit' });
  const month = date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();

  return (
    <div className="group flex overflow-hidden rounded-2xl border border-white/10 bg-ink-soft shadow-pass">
      <div className="flex w-24 flex-none flex-col items-center justify-center border-r border-dashed border-white/15 bg-emerald/40 px-2 py-6 text-center">
        <span className="font-display text-3xl text-brass">{day}</span>
        <span className="mt-1 text-xs tracking-wide2 text-parchment/80">{month}</span>
      </div>

      <div className="flex flex-1 items-center justify-between gap-4 px-6 py-5">
        <div>
          <h3 className="font-display text-xl text-parchment">{event.name}</h3>
          <p className="mt-1 text-sm text-stone">{event.venue}</p>
          <p className="mt-1 text-xs text-stone">
            {event.event_time} · Hosted by {event.organizer_name}
          </p>
          {event.is_registered ? (
            <span className="mt-3 inline-block rounded-full border border-brass/40 px-3 py-1 text-xs text-brass">
              {event.has_attended ? 'Attendance confirmed' : 'Registered'}
            </span>
          ) : null}
        </div>
        <div className="flex-none">{action}</div>
      </div>
    </div>
  );
}
