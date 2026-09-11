import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import Stat from '../components/Stat';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [stats, setStats] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [search, setSearch] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadEvent = useCallback(() => {
    api.get('/events/mine').then((res) => {
      setEvent(res.data.events.find((e) => String(e.id) === id) || null);
    });
  }, [id]);

  const loadStats = useCallback(() => {
    api.get(`/events/${id}/stats`).then((res) => setStats(res.data));
  }, [id]);

  const loadAttendees = useCallback(() => {
    api.get(`/events/${id}/attendees`, { params: { search } }).then((res) => setAttendees(res.data.attendees));
  }, [id, search]);

  useEffect(() => { loadEvent(); }, [loadEvent]);
  useEffect(() => { loadStats(); loadAttendees(); }, [loadStats, loadAttendees]);

  // Real-time-ish polling for the brownie "live attendance" requirement
  useEffect(() => {
    const interval = setInterval(() => { loadStats(); loadAttendees(); }, 8000);
    return () => clearInterval(interval);
  }, [loadStats, loadAttendees]);

  const revealQr = async () => {
    if (!qrDataUrl) {
      const res = await api.get(`/events/${id}/qrcode`);
      setQrDataUrl(res.data.qrDataUrl);
    }
    setShowQr(true);
  };

  const exportCsv = () => {
    api
      .get(`/events/${id}/export`, { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${event?.name || 'event'}_attendance.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
  };

  const deleteEvent = async () => {
    if (!window.confirm('Delete this event permanently? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/events/${id}`);
      navigate('/organizer');
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete the event.');
      setDeleting(false);
    }
  };

  if (!event) return <div className="px-6 py-12 text-center text-sm text-stone">Loading event…</div>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-xs uppercase tracking-wide2 text-brass">{event.event_date} · {event.event_time}</p>
      <h1 className="mt-2 font-display text-4xl text-parchment">{event.name}</h1>
      <p className="mt-2 text-sm text-stone">{event.venue} · geofence {event.geofence_radius_m}m</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <button onClick={revealQr} className="rounded-full bg-brass px-5 py-2.5 text-sm font-medium text-ink hover:opacity-90">
          Show event QR
        </button>
        <button onClick={exportCsv} className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-parchment hover:border-brass hover:text-brass">
          Export attendance CSV
        </button>
        <button
          onClick={deleteEvent}
          disabled={deleting}
          className="rounded-full border border-red-400/40 px-5 py-2.5 text-sm text-red-300 hover:bg-red-400/10 disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : 'Delete event'}
        </button>
      </div>

      {showQr && (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-white/10 bg-ink-soft p-8">
          <img src={qrDataUrl} alt="Event QR code" className="h-56 w-56 rounded-xl" />
          <p className="mt-4 text-sm text-stone">Display this at the venue for attendees to scan.</p>
        </div>
      )}

      {stats && (
        <div className="mt-10 grid grid-cols-3 gap-4">
          <Stat label="Registered" value={stats.totalRegistrations} />
          <Stat label="Checked in" value={stats.totalAttendees} accent />
          <Stat label="Attendance rate" value={`${stats.attendancePercentage}%`} />
        </div>
      )}

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-parchment">Attendees</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="rounded-lg border border-white/15 bg-ink-soft px-3 py-2 text-sm text-parchment outline-none focus:border-brass"
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-soft text-xs uppercase tracking-wide2 text-stone">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Checked in at</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map((a) => (
                <tr key={a.id} className="border-t border-white/5">
                  <td className="px-4 py-3 text-parchment">{a.name}</td>
                  <td className="px-4 py-3 text-stone">{a.email}</td>
                  <td className="px-4 py-3">
                    <span className={a.status === 'present' ? 'text-emerald' : 'text-stone'}>
                      {a.status === 'present' ? 'Present' : 'Registered'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone">{a.attended_at || '—'}</td>
                </tr>
              ))}
              {attendees.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-stone">No attendees match yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}