import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import api from '../api';
import GeoRadar from '../components/GeoRadar';

const SCANNER_ID = 'presence-qr-scanner';

export default function ScanAttendance() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const startedRef = useRef(false); // guards against React.StrictMode's double-invoked effect

  const [phase, setPhase] = useState('scanning'); // scanning | verifying | success | error
  const [message, setMessage] = useState('');
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    // StrictMode (dev only) runs this effect twice in a row. Without this guard, the
    // second run starts a *new* camera stream while the first is still spinning up,
    // which is exactly what caused "camera light on, no visible feed".
    if (startedRef.current) return;
    startedRef.current = true;

    const scanner = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 240 },
        (decodedText) => handleScanned(decodedText, scanner),
        () => {} // per-frame "no QR found yet" — not an error, ignore
      )
      .catch((err) => {
        console.error('Camera start failed:', err);
        setCameraError('Could not access the camera. Check your browser/site camera permission.');
      });

    return () => {
      const s = scannerRef.current;
      startedRef.current = false;
      try {
        // stop() throws synchronously (not just a rejected promise) if the scanner
        // isn't actually in the SCANNING state yet — e.g. cleanup fires before
        // start() has finished resolving. Check state first to avoid the crash.
        if (s && s.getState() === Html5QrcodeScannerState.SCANNING) {
          s.stop()
            .then(() => s.clear())
            .catch(() => {
              // Safe to ignore — camera track is released on unmount regardless.
            });
        }
      } catch (_) {
        // Defensive: some versions of html5-qrcode can still throw synchronously.
      }
    };
  }, []);

  const handleScanned = async (decodedText, scanner) => {
    try {
      await scanner.pause(true);
    } catch (_) {}

    let token;
    try {
      const parsed = JSON.parse(decodedText);
      token = parsed.token;
      if (!token) throw new Error('missing token');
    } catch {
      setPhase('error');
      setMessage('That QR code is not a valid Presence event pass.');
      return;
    }

    setPhase('verifying');
    setMessage('Confirming your location…');

    if (!navigator.geolocation) {
      setPhase('error');
      setMessage('This browser does not support location access.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await api.post('/attendance/mark', {
            qrToken: token,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setPhase('success');
          setMessage(res.data.message);
        } catch (err) {
          setPhase('error');
          setMessage(err.response?.data?.error || 'Could not confirm attendance.');
        }
      },
      (geoErr) => {
        console.error('Geolocation error:', geoErr);
        setPhase('error');
        setMessage('Location access was denied. Enable it in your browser settings to check in.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const retry = () => {
    setPhase('scanning');
    setMessage('');
    scannerRef.current?.resume();
  };

  const stopAndLeave = async () => {
    const s = scannerRef.current;
    try {
      if (s && s.getState() === Html5QrcodeScannerState.SCANNING) {
        await s.stop();
        await s.clear();
      }
    } catch (_) {
      // camera may already be stopped/paused — safe to ignore
    } finally {
      navigate(-1);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-12 text-center">
      <p className="text-xs uppercase tracking-wide2 text-brass">Check in</p>
      <h1 className="mt-2 font-display text-3xl text-parchment">Scan the event pass</h1>
      <p className="mt-3 text-sm text-stone">
        Point your camera at the QR code displayed by the organizer. We'll verify you're at the venue.
      </p>

      <button
        onClick={stopAndLeave}
        className="mt-6 self-start rounded-full border border-white/15 px-4 py-1.5 text-xs text-stone hover:border-brass hover:text-brass"
      >
        ← Back
      </button>

      <div className="relative mt-4 w-full min-h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-ink-soft">
        {cameraError && (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-red-300">{cameraError}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full border border-white/15 px-5 py-2 text-sm text-parchment hover:border-brass hover:text-brass"
            >
              Reload and try again
            </button>
          </div>
        )}

        <div id={SCANNER_ID} className={phase === 'scanning' && !cameraError ? 'block' : 'hidden'} style={{ width: '100%', minHeight: 320 }} />

        {phase !== 'scanning' && !cameraError && (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-14">
            {phase === 'verifying' && <GeoRadar status="checking" />}
            {phase === 'success' && <GeoRadar status="success" />}
            {phase === 'error' && <GeoRadar status="error" />}
            <p
              className={`text-sm ${
                phase === 'success' ? 'text-emerald' : phase === 'error' ? 'text-red-300' : 'text-stone'
              }`}
            >
              {message}
            </p>
            {phase !== 'verifying' && (
              <button
                onClick={retry}
                className="mt-2 rounded-full border border-white/15 px-5 py-2 text-sm text-parchment hover:border-brass hover:text-brass"
              >
                {phase === 'success' ? 'Scan another' : 'Try again'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}