import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import ScanAttendance from './pages/ScanAttendance';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/CreateEvent';
import EventDetail from './pages/EventDetail';

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="px-6 py-20 text-center text-sm text-stone">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <div className="px-6 py-20 text-center text-sm text-stone">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'organizer' ? '/organizer' : '/events'} replace />;
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/events" element={<Protected role="attendee"><UserDashboard /></Protected>} />
        <Route path="/scan" element={<Protected role="attendee"><ScanAttendance /></Protected>} />

        <Route path="/organizer" element={<Protected role="organizer"><OrganizerDashboard /></Protected>} />
        <Route path="/organizer/new" element={<Protected role="organizer"><CreateEvent /></Protected>} />
        <Route path="/organizer/events/:id" element={<Protected role="organizer"><EventDetail /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
