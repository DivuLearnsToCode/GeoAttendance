const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { isWithinGeofence } = require('../utils/geofence');

const router = express.Router();

// POST /api/attendance/mark
// body: { qrToken, latitude, longitude }
router.post('/mark', requireAuth, (req, res) => {
  const { qrToken, latitude, longitude } = req.body;

  if (!qrToken) return res.status(400).json({ error: 'Missing QR code data. Scan the event QR again.' });
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'Location was not captured. Allow location access and try again.' });
  }

  const event = db.prepare('SELECT * FROM events WHERE qr_token = ?').get(qrToken);
  if (!event) return res.status(404).json({ error: 'This QR code does not match any event.' });

  const already = db
    .prepare('SELECT id FROM attendance WHERE event_id = ? AND user_id = ?')
    .get(event.id, req.user.id);
  if (already) return res.status(409).json({ error: 'Attendance has already been marked for this event.' });

  const { withinFence, distance } = isWithinGeofence(
    latitude,
    longitude,
    event.latitude,
    event.longitude,
    event.geofence_radius_m
  );

  if (!withinFence) {
    return res.status(403).json({
      error: `You're ${Math.round(distance)}m from the venue — attendance can only be marked within ${event.geofence_radius_m}m.`,
      distance: Math.round(distance),
    });
  }

  // Auto-register if the attendee scanned directly without pre-registering
  db.prepare('INSERT OR IGNORE INTO registrations (event_id, user_id) VALUES (?, ?)').run(event.id, req.user.id);

  db.prepare(
    'INSERT INTO attendance (event_id, user_id, latitude, longitude, distance_m) VALUES (?, ?, ?, ?, ?)'
  ).run(event.id, req.user.id, latitude, longitude, distance);

  res.status(201).json({
    message: `Attendance confirmed for ${event.name}.`,
    distance: Math.round(distance),
  });
});

// GET /api/attendance/mine — attendee's own attendance history
router.get('/mine', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT e.name, e.venue, e.event_date, a.marked_at, a.distance_m
       FROM attendance a JOIN events e ON e.id = a.event_id
       WHERE a.user_id = ? ORDER BY a.marked_at DESC`
    )
    .all(req.user.id);
  res.json({ attendance: rows });
});

module.exports = router;
