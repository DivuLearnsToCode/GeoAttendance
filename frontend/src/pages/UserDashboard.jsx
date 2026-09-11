import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import EventPassCard from '../components/EventPassCard';

export default function UserDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.get('/events/upcoming').then((res) => setEvents(res.data.events)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRegister = async (id) => {
    await api.post(`/events/${id}/register`);
    load();
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-xs uppercase tracking-wide2 text-brass">Upcoming</p>
      <h1 className="mt-2 font-display text-4xl text-parchment">Your invitations</h1>
      <p className="mt-3 max-w-xl text-sm text-stone">
        Reserve your place, then check in at the venue by scanning the event's QR code — we'll confirm
        your presence the moment your location matches the room.
      </p>

      <div className="mt-10 space-y-4">
        {loading && <p className="text-sm text-stone">Loading events…</p>}
        {!loading && events.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center text-sm text-stone">
            No upcoming events yet. Check back soon.
          </div>
        )}
        {events.map((event) => (
          <EventPassCard
            key={event.id}
            event={event}
            action={
              event.has_attended ? (
                <span className="text-sm text-emerald">✓ Checked in</span>
              ) : event.is_registered ? (
                <button
                  onClick={() => navigate('/scan')}
                  className="rounded-full border border-brass px-4 py-2 text-sm text-brass hover:bg-brass/10"
                >
                  Check in
                </button>
              ) : (
                <button
                  onClick={() => handleRegister(event.id)}
                  className="rounded-full bg-brass px-4 py-2 text-sm text-ink hover:opacity-90"
                >
                  Reserve
                </button>
              )
            }
          />
        ))}
      </div>
    </div>
  );
}
