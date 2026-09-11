# Presence — QR-Based Geo-Tagged Attendance Management System

A full-stack app for organizers to run events and verify attendance by combining
QR code check-in with live geolocation, so a scan only counts if the attendee is
actually at the venue.

Built for the NSCC × SRM IST recruitment task (2nd Year, Task 2).

## Stack

| Layer      | Choice                                                        |
|------------|----------------------------------------------------------------|
| Frontend   | React 18 + Vite + Tailwind CSS + `html5-qrcode`                |
| Backend    | Node.js + Express                                              |
| Database   | SQLite (via `better-sqlite3`) — file-based, no external service|
| Auth       | JWT (JSON Web Tokens), passwords hashed with bcrypt             |
| QR codes   | Generated server-side with the `qrcode` package                 |

No Supabase or Firebase is used anywhere — the backend, database access, auth, and
business logic are all implemented from scratch in Express.

## How it works

- **Organizers** create an event with a venue, a date/time, and a **geofence
  radius** (in meters) around the venue's coordinates. Each event gets a unique
  QR code.
- **Attendees** browse upcoming events, reserve a spot, and on the day, scan the
  event's QR code with their phone camera.
- The moment a QR code is scanned, the browser also captures the attendee's GPS
  location. The backend calculates the distance between that location and the
  event's venue using the **Haversine formula**, and only confirms attendance if
  the attendee is within the configured radius.
- Duplicate check-ins, expired/invalid QR codes, and unauthorized access to
  someone else's event are all rejected with clear error messages.

## Project structure

```
qr-attendance-system/
├── backend/
│   ├── server.js          # Express app entrypoint
│   ├── db.js               # SQLite schema + connection
│   ├── middleware/auth.js  # JWT verification + role guard
│   ├── utils/geofence.js   # Haversine distance + geofence check
│   └── routes/
│       ├── auth.js         # register / login / me
│       ├── events.js       # event CRUD, QR generation, attendees, stats, CSV export
│       └── attendance.js   # mark attendance, attendance history
└── frontend/
    └── src/
        ├── context/AuthContext.jsx   # login/register/logout, current user
        ├── components/               # Navbar, EventPassCard, GeoRadar, Stat
        └── pages/
            ├── Login.jsx / Register.jsx
            ├── UserDashboard.jsx     # attendee: upcoming events
            ├── ScanAttendance.jsx    # attendee: camera scan + geo check-in
            ├── OrganizerDashboard.jsx
            ├── CreateEvent.jsx
            └── EventDetail.jsx       # QR display, live stats, attendee table, CSV export
```

## Running the project

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # edit JWT_SECRET before deploying anywhere real
npm start                 # or: npm run dev  (auto-restarts on changes)
```

The API runs on `http://localhost:5000` and creates `data.sqlite` automatically
on first boot — no manual database setup needed.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL should point at the backend above
npm run dev
```

Open `http://localhost:5173`. QR scanning needs camera access, and most browsers
only allow that over `https://` or `localhost` — so test on `localhost`, or a
tunnel like ngrok if you need to test from a phone.

## APIs implemented

**Auth**
- `POST /api/auth/register` — create an account as `attendee` or `organizer`
- `POST /api/auth/login`
- `GET /api/auth/me`

**Events**
- `GET /api/events/upcoming` — attendee: all future events + registration/attendance status
- `POST /api/events/:id/register` — attendee reserves a spot
- `GET /api/events/mine` — organizer: their own events with live counts
- `POST /api/events` — organizer creates an event
- `PUT /api/events/:id` / `DELETE /api/events/:id`
- `GET /api/events/:id/qrcode` — PNG data URL of the event's QR code
- `GET /api/events/:id/attendees?search=` — attendee list with search/filter
- `GET /api/events/:id/stats` — total registrations, checked-in count, attendance %, recent check-ins
- `GET /api/events/:id/export` — CSV download (Name, Registration ID, Email, Status, Timestamp)

**Attendance**
- `POST /api/attendance/mark` — `{ qrToken, latitude, longitude }`, verifies the
  geofence before confirming
- `GET /api/attendance/mine` — attendee's own check-in history

## Features implemented

- Signup/login with hashed passwords and JWT sessions, two roles (attendee, organizer)
- Event creation with venue coordinates and a configurable geofence radius
- Per-event QR code generation and camera-based scanning
- Server-side geolocation verification (Haversine distance) before attendance is accepted
- Duplicate-attendance and duplicate-registration prevention
- Full validation and error handling (invalid QR, out-of-range location, unauthorized edits, etc.)
- CSV export of attendance records
- **Brownie subtask:** an organizer dashboard with total registrations/attendees/attendance
  percentage, a live-updating recent check-ins feed (polled every 8s), search and filter
  over attendees, and downloadable reports

## Additional features added

- "Use my current location" button when creating an event, so organizers don't
  have to look up coordinates manually
- A visual "signal verifying" indicator (animated radar rings) while a scan's
  location is being checked, so the geofence check doesn't feel like a black box
- Auto-registration: if an attendee scans a QR code without pre-reserving, they're
  registered and marked present in the same step

## Design direction

The interface leans into the idea of a **membership pass / boarding pass** rather
than a generic admin dashboard — a deep ink background, a brass accent, a serif
display face (Fraunces) for headings paired with Inter for body text, and event
cards styled like ticket stubs with a dashed perforation. The QR check-in screen
uses a radar-style animation to visualize the geolocation check happening in real
time, since that verification step is the actual core of the product.

## Concepts learned while completing this task

- Implementing geofencing from first principles with the Haversine great-circle
  distance formula, rather than reaching for a maps SDK
- Handling browser camera and geolocation permissions gracefully, including
  denial and unsupported-browser states
- Structuring a JWT-based auth flow with role-based route protection on both
  the API (middleware) and the frontend (protected routes)
- Designing SQLite schema constraints (`UNIQUE(event_id, user_id)`) to enforce
  "one check-in per person per event" at the database level instead of only in
  application code

## Notes on AI assistance

This project was built with AI assistance. Every function — the JWT middleware,
the Haversine geofence check, the SQLite schema, the QR scan/geolocation flow in
`ScanAttendance.jsx`, and the CSV export — is understood and can be explained
function-by-function, per the task's requirement.
