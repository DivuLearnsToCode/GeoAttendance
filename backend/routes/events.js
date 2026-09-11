const express = require('express');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/events/upcoming — attendee side: all future events
router.get('/upcoming', requireAuth, (req, res) => {
  const events = db
    .prepare(
      `SELECT e.id, e.name, e.venue, e.event_date, e.event_time, e.description, e.geofence_radius_m,
              u.name AS organizer_name,
              EXISTS(SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = ?) AS is_registered,
              EXISTS(SELECT 1 FROM attendance a WHERE a.event_id = e.id AND a.user_id = ?) AS has_attended
       FROM events e JOIN users u ON u.id = e.organizer_id
       WHERE date(e.event_date) >= date('now')
       ORDER BY e.event_date ASC, e.event_time ASC`
    )
    .all(req.user.id, req.user.id);
  res.json({ events });
});

// POST /api/events/:id/register — attendee expresses intent to attend
router.post('/:id/register', requireAuth, (req, res) => {
  const event = db.prepare('SELECT id FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });

  try {
    db.prepare('INSERT INTO registrations (event_id, user_id) VALUES (?, ?)').run(event.id, req.user.id);
  } catch (err) {
    return res.status(409).json({ error: 'You are already registered for this event.' });
  }
  res.status(201).json({ message: 'Registered for event.' });
});

// GET /api/events/mine — organizer side: events they created
router.get('/mine', requireAuth, requireRole('organizer'), (req, res) => {
  const events = db
    .prepare(
      `SELECT e.*,
              (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registration_count,
              (SELECT COUNT(*) FROM attendance a WHERE a.event_id = e.id) AS attendance_count
       FROM events e WHERE e.organizer_id = ? ORDER BY e.event_date DESC`
    )
    .all(req.user.id);
  res.json({ events });
});

// POST /api/events — organizer creates an event
router.post('/', requireAuth, requireRole('organizer'), (req, res) => {
  const { name, venue, event_date, event_time, latitude, longitude, geofence_radius_m, description } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: 'Event name is required.' });
  if (!venue || !venue.trim()) return res.status(400).json({ error: 'Venue is required.' });
  if (!event_date) return res.status(400).json({ error: 'Event date is required.' });
  if (!event_time) return res.status(400).json({ error: 'Event time is required.' });
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'Venue latitude and longitude are required.' });
  }
  const radius = Number(geofence_radius_m) > 0 ? Number(geofence_radius_m) : 100;

  const qr_token = uuidv4();
  const info = db
    .prepare(
      `INSERT INTO events (organizer_id, name, venue, event_date, event_time, latitude, longitude, geofence_radius_m, qr_token, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.user.id, name.trim(), venue.trim(), event_date, event_time, latitude, longitude, radius, qr_token, description || null);

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ event });
});

// PUT /api/events/:id — organizer edits their own event
router.put('/:id', requireAuth, requireRole('organizer'), (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  if (event.organizer_id !== req.user.id) return res.status(403).json({ error: 'You can only edit your own events.' });

  const { name, venue, event_date, event_time, latitude, longitude, geofence_radius_m, description } = req.body;

  db.prepare(
    `UPDATE events SET name = ?, venue = ?, event_date = ?, event_time = ?, latitude = ?, longitude = ?, geofence_radius_m = ?, description = ?
     WHERE id = ?`
  ).run(
    name?.trim() || event.name,
    venue?.trim() || event.venue,
    event_date || event.event_date,
    event_time || event.event_time,
    typeof latitude === 'number' ? latitude : event.latitude,
    typeof longitude === 'number' ? longitude : event.longitude,
    Number(geofence_radius_m) > 0 ? Number(geofence_radius_m) : event.geofence_radius_m,
    description !== undefined ? description : event.description,
    event.id
  );

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(event.id);
  res.json({ event: updated });
});

// DELETE /api/events/:id — organizer deletes their own event
router.delete('/:id', requireAuth, requireRole('organizer'), (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  if (event.organizer_id !== req.user.id) return res.status(403).json({ error: 'You can only delete your own events.' });

  db.prepare('DELETE FROM events WHERE id = ?').run(event.id);
  res.json({ message: 'Event deleted.' });
});

// GET /api/events/:id/qrcode — returns a PNG data URL of the event's QR code
router.get('/:id/qrcode', requireAuth, requireRole('organizer'), async (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  if (event.organizer_id !== req.user.id) return res.status(403).json({ error: 'You can only view QR codes for your own events.' });

  const payload = JSON.stringify({ eventId: event.id, token: event.qr_token });
  const dataUrl = await QRCode.toDataURL(payload, { margin: 2, width: 400, color: { dark: '#0E1116', light: '#F7F4EE' } });
  res.json({ qrDataUrl: dataUrl });
});

// GET /api/events/:id/attendees — organizer views attendee list with search/filter
router.get('/:id/attendees', requireAuth, requireRole('organizer'), (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  if (event.organizer_id !== req.user.id) return res.status(403).json({ error: 'You can only view attendees for your own events.' });

  const { search = '' } = req.query;
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.email,
              r.registered_at,
              a.marked_at AS attended_at, a.distance_m,
              CASE WHEN a.id IS NOT NULL THEN 'present' ELSE 'registered' END AS status
       FROM registrations r
       JOIN users u ON u.id = r.user_id
       LEFT JOIN attendance a ON a.event_id = r.event_id AND a.user_id = r.user_id
       WHERE r.event_id = ? AND (u.name LIKE ? OR u.email LIKE ?)
       ORDER BY r.registered_at DESC`
    )
    .all(event.id, `%${search}%`, `%${search}%`);

  res.json({ attendees: rows });
});

// GET /api/events/:id/stats — organizer real-time dashboard numbers
router.get('/:id/stats', requireAuth, requireRole('organizer'), (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  if (event.organizer_id !== req.user.id) return res.status(403).json({ error: 'You can only view stats for your own events.' });

  const totalRegistrations = db.prepare('SELECT COUNT(*) c FROM registrations WHERE event_id = ?').get(event.id).c;
  const totalAttendees = db.prepare('SELECT COUNT(*) c FROM attendance WHERE event_id = ?').get(event.id).c;
  const recent = db
    .prepare(
      `SELECT u.name, u.email, a.marked_at, a.distance_m
       FROM attendance a JOIN users u ON u.id = a.user_id
       WHERE a.event_id = ? ORDER BY a.marked_at DESC LIMIT 8`
    )
    .all(event.id);

  const attendancePct = totalRegistrations > 0 ? Math.round((totalAttendees / totalRegistrations) * 100) : 0;

  res.json({
    totalRegistrations,
    totalAttendees,
    attendancePercentage: attendancePct,
    recent,
  });
});

// GET /api/events/:id/export — CSV of Name, Registration ID, Email, Attendance Status, Timestamp
router.get('/:id/export', requireAuth, requireRole('organizer'), (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  if (event.organizer_id !== req.user.id) return res.status(403).json({ error: 'You can only export your own events.' });

  const rows = db
    .prepare(
      `SELECT u.name, r.id AS registration_id, u.email,
              CASE WHEN a.id IS NOT NULL THEN 'Present' ELSE 'Registered' END AS status,
              COALESCE(a.marked_at, '') AS timestamp
       FROM registrations r
       JOIN users u ON u.id = r.user_id
       LEFT JOIN attendance a ON a.event_id = r.event_id AND a.user_id = r.user_id
       WHERE r.event_id = ?
       ORDER BY r.registered_at ASC`
    )
    .all(event.id);

  const header = 'Name,Registration ID,Email,Attendance Status,Timestamp';
  const escape = (val) => `"${String(val).replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [r.name, r.registration_id, r.email, r.status, r.timestamp].map(escape).join(',')
  );
  const csv = [header, ...lines].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${event.name.replace(/[^a-z0-9]/gi, '_')}_attendance.csv"`);
  res.send(csv);
});

module.exports = router;
