'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { createWorker } from 'tesseract.js';

interface InstitutionIDCaptureProps {
  role: 'student' | 'employee';
  onSubmit: (data: { id: string; name: string; allergies: string }) => void;
  onBack: () => void;
}

type Mode = 'choose' | 'camera' | 'manual';

interface MemberInfo {
  institution_id: string;
  member_name: string;
  role: string;
  allergies: string;
}

export default function InstitutionIDCapture({ role, onSubmit, onBack }: InstitutionIDCaptureProps) {
  const [mode, setMode] = useState<Mode>('choose');
  const [institutionId, setInstitutionId] = useState('');
  const [name, setName] = useState('');
  const [allergies, setAllergies] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [memberFound, setMemberFound] = useState<MemberInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);

  const webcamRef = useRef<Webcam>(null);

  const roleLabel = role === 'student' ? 'Student' : 'Employee';

  /* Detect Raspberry Pi camera */
  useEffect(() => {
    async function detectCamera() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');

        if (videoDevices.length > 0) {
          setDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Camera detection failed:', err);
      }
    }

    detectCamera();
  }, []);

  const extractID = (text: string): string | null => {
    const match = text.match(/\b\d{9}\b/);
    return match ? match[0] : null;
  };

  const captureAndScan = useCallback(async () => {
    if (!webcamRef.current) return;

    const screenshot = webcamRef.current.getScreenshot();

    if (!screenshot) {
      setError('Failed to capture image. Please try again.');
      return;
    }

    setScanning(true);
    setError('');

    try {
      const worker = await createWorker('eng');

      const {
        data: { text },
      } = await worker.recognize(screenshot);

      await worker.terminate();

      const extracted = extractID(text);

      if (extracted) {
        setInstitutionId(extracted);
        setMode('manual');
        await lookupMember(extracted);
      } else {
        setError(
          'Could not find a 9-digit Institution ID. Please try again or enter manually.'
        );
      }
    } catch {
      setError('OCR processing failed. Please enter the Institution ID manually.');
    } finally {
      setScanning(false);
    }
  }, []);

  const lookupMember = async (idValue: string) => {
    if (idValue.length !== 9) return;

    setLookingUp(true);
    setMemberFound(null);
    setNotFound(false);

    try {
      const res = await fetch(`/api/member/lookup?id=${encodeURIComponent(idValue)}`);
      const data = await res.json();

      if (data.found && data.member) {
        setMemberFound(data.member);
        setName(data.member.member_name);
        setAllergies(data.member.allergies || '');
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLookingUp(false);
    }
  };

  const handleIDChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);

    setInstitutionId(digits);
    setMemberFound(null);
    setNotFound(false);

    if (digits.length === 9) lookupMember(digits);
  };

  const handleSubmit = () => {
    if (!institutionId || institutionId.length !== 9) {
      setError('Please enter a valid 9-digit Institution ID.');
      return;
    }

    if (!name.trim()) {
      setError('Please enter the member name.');
      return;
    }

    onSubmit({
      id: institutionId,
      name: name.trim(),
      allergies: allergies.trim(),
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div
        className="px-6 py-5"
        style={{ background: 'linear-gradient(135deg, #1a1a4e, #2d2d6b)' }}
      >
        <button
          onClick={mode === 'choose' ? onBack : () => setMode('choose')}
          className="mb-2 flex items-center gap-1 text-sm text-blue-300/70 hover:text-white"
        >
          Back
        </button>

        <h1 className="text-2xl font-bold text-white">{roleLabel} Identification</h1>

        <p className="mt-1 text-sm text-blue-200/70">
          {mode === 'choose' && 'Choose how to enter the Institution ID'}
          {mode === 'camera' && 'Point camera at the ID card'}
          {mode === 'manual' && 'Enter or verify the Institution ID'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-md">

          {mode === 'choose' && (
            <div className="space-y-4">
              <button
                onClick={() => setMode('camera')}
                className="w-full rounded-2xl bg-white p-5 shadow-sm"
              >
                Scan ID Card
              </button>

              <button
                onClick={() => setMode('manual')}
                className="w-full rounded-2xl bg-white p-5 shadow-sm"
              >
                Enter Manually
              </button>
            </div>
          )}

          {mode === 'camera' && (
            <div className="space-y-4">

              <div className="overflow-hidden rounded-2xl bg-black">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/png"
                  videoConstraints={{
                    deviceId: deviceId,
                    width: 1280,
                    height: 720,
                  }}
                  className="w-full"
                />
              </div>

              <button
                onClick={captureAndScan}
                disabled={scanning}
                className="w-full rounded-xl py-4 text-white"
                style={{ background: '#1a1a4e' }}
              >
                {scanning ? 'Scanning...' : 'Capture & Scan'}
              </button>

              <button
                onClick={() => setMode('manual')}
                className="w-full py-2 text-sm"
              >
                Enter Institution ID manually instead
              </button>

            </div>
          )}

          {mode === 'manual' && (
            <div className="space-y-4">

              <input
                type="text"
                value={institutionId}
                onChange={(e) => handleIDChange(e.target.value)}
                placeholder="Enter 9-digit Institution ID"
                className="w-full rounded-xl border-2 px-4 py-3 text-center"
              />

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Member Name"
                className="w-full rounded-xl border-2 px-4 py-3"
              />

              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="Known Allergies"
                className="w-full rounded-xl border-2 px-4 py-3"
              />

            </div>
          )}

          {error && (
            <div className="mt-4 text-red-600 text-sm">{error}</div>
          )}

        </div>
      </div>

      {mode === 'manual' && (
        <div className="border-t bg-white px-6 py-4">
          <button
            onClick={handleSubmit}
            disabled={institutionId.length !== 9 || !name.trim()}
            className="w-full rounded-xl py-4 text-white"
            style={{ background: '#1a1a4e' }}
          >
            Continue to Vital Signs
          </button>
        </div>
      )}
    </div>
  );
}
