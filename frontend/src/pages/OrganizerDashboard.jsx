import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events/mine').then((res) => setEvents(res.data.events)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide2 text-brass">Organizer</p>
          <h1 className="mt-2 font-display text-4xl text-parchment">Your events</h1>
        </div>
        <Link
          to="/organizer/new"
          className="rounded-full bg-brass px-5 py-2.5 text-sm font-medium text-ink hover:opacity-90"
        >
          + New event
        </Link>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {loading && <p className="text-sm text-stone">Loading events…</p>}
        {!loading && events.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center text-sm text-stone">
            You haven't created any events yet.
          </div>
        )}
        {events.map((event) => (
          <Link
            key={event.id}
            to={`/organizer/events/${event.id}`}
            className="rounded-2xl border border-white/10 bg-ink-soft p-6 transition-colors hover:border-brass/50"
          >
            <h3 className="font-display text-xl text-parchment">{event.name}</h3>
            <p className="mt-1 text-sm text-stone">{event.venue}</p>
            <p className="mt-1 text-xs text-stone">
              {event.event_date} · {event.event_time}
            </p>
            <div className="mt-4 flex gap-6 text-sm">
              <div>
                <span className="font-display text-lg text-brass">{event.registration_count}</span>
                <span className="ml-1 text-xs text-stone">registered</span>
              </div>
              <div>
                <span className="font-display text-lg text-emerald">{event.attendance_count}</span>
                <span className="ml-1 text-xs text-stone">present</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
