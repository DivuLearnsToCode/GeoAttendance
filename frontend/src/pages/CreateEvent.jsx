import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import MapPicker from '../components/MapPicker';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    venue: '',
    event_date: '',
    event_time: '',
    latitude: '',
    longitude: '',
    geofence_radius_m: 100,
    description: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const setCoords = (lat, lng) => {
    setForm((f) => ({ ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.post('/events', {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        geofence_radius_m: Number(form.geofence_radius_m),
      });
      navigate(`/organizer/events/${res.data.event.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create the event.');
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'mt-2 w-full rounded-lg border border-white/15 bg-ink-soft px-4 py-3 text-parchment outline-none focus:border-brass';
  const labelClass = 'text-xs uppercase tracking-wide2 text-stone';

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <p className="text-xs uppercase tracking-wide2 text-brass">New event</p>
      <h1 className="mt-2 font-display text-4xl text-parchment">Set the stage</h1>
      <p className="mt-3 text-sm text-stone">
        Define the venue and the radius within which attendees can check in.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-5">
        <div>
          <label className={labelClass}>Event name</label>
          <input required value={form.name} onChange={update('name')} className={inputClass} placeholder="Founders' Evening" />
        </div>
        <div>
          <label className={labelClass}>Venue</label>
          <input required value={form.venue} onChange={update('venue')} className={inputClass} placeholder="The Glasshouse, Chennai" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date</label>
            <input required type="date" value={form.event_date} onChange={update('event_date')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Time</label>
            <input required type="time" value={form.event_time} onChange={update('event_time')} className={inputClass} />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <label className={labelClass}>Venue coordinates</label>
            <button
              type="button"
              onClick={useMyLocation}
              className="text-xs text-brass hover:underline"
            >
              {locating ? 'Locating…' : 'Use my current location'}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <input
              required
              value={form.latitude}
              onChange={update('latitude')}
              className={inputClass}
              placeholder="Latitude"
            />
            <input
              required
              value={form.longitude}
              onChange={update('longitude')}
              className={inputClass}
              placeholder="Longitude"
            />
          </div>

          <p className="mt-4 text-xs text-stone">Or click the map to drop a pin at the venue</p>
          <MapPicker latitude={parseFloat(form.latitude) || null} longitude={parseFloat(form.longitude) || null} onPick={setCoords} />

          <div className="mt-4">
            <label className={labelClass}>Geofence radius (meters)</label>
            <input
              type="number"
              min="10"
              value={form.geofence_radius_m}
              onChange={update('geofence_radius_m')}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Description (optional)</label>
          <textarea
            value={form.description}
            onChange={update('description')}
            rows={3}
            className={inputClass}
            placeholder="What attendees should know"
          />
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-brass py-3 font-medium text-ink hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create event'}
        </button>
      </form>
    </div>
  );
}