'use client';

import { useState, useRef, useCallback } from 'react';
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
  const webcamRef = useRef<Webcam>(null);

  const roleLabel = role === 'student' ? 'Student' : 'Employee';

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
      const { data: { text } } = await worker.recognize(screenshot);
      await worker.terminate();

      const extracted = extractID(text);
      if (extracted) {
        setInstitutionId(extracted);
        setMode('manual');
        await lookupMember(extracted);
      } else {
        setError('Could not find a 9-digit Institution ID. Please try again or enter manually.');
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
    onSubmit({ id: institutionId, name: name.trim(), allergies: allergies.trim() });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #1a1a4e, #2d2d6b)' }}>
        <button
          onClick={mode === 'choose' ? onBack : () => setMode('choose')}
          className="mb-2 flex items-center gap-1 text-sm text-blue-300/70 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
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
          {/* Mode Selection */}
          {mode === 'choose' && (
            <div className="space-y-4">
              <button
                onClick={() => setMode('camera')}
                className="flex w-full items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: '#eef0ff' }}>
                  <svg className="h-7 w-7" style={{ color: '#6c63ff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Scan ID Card</div>
                  <div className="text-sm text-gray-500">Use camera to scan the Institution ID from ID card</div>
                </div>
              </button>

              <button
                onClick={() => setMode('manual')}
                className="flex w-full items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: '#f0fdf4' }}>
                  <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Enter Manually</div>
                  <div className="text-sm text-gray-500">Type the 9-digit Institution ID number</div>
                </div>
              </button>
            </div>
          )}

          {/* Camera Mode */}
          {mode === 'camera' && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl bg-black">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/png"
                  videoConstraints={{ facingMode: 'environment', width: 1280, height: 720 }}
                  className="w-full"
                />
              </div>
              <div className="rounded-xl p-3 text-center text-sm" style={{ background: '#eef0ff', color: '#6c63ff' }}>
                Position the ID card so the number is clearly visible
              </div>
              <button
                onClick={captureAndScan}
                disabled={scanning}
                className="w-full rounded-xl py-4 text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: '#1a1a4e' }}
              >
                {scanning ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Scanning...
                  </span>
                ) : 'Capture & Scan'}
              </button>
              <button onClick={() => setMode('manual')} className="w-full py-2 text-sm" style={{ color: '#6c63ff' }}>
                Enter Institution ID manually instead
              </button>
            </div>
          )}

          {/* Manual Entry */}
          {mode === 'manual' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <label className="block text-sm font-medium text-gray-700">Institution ID</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={institutionId}
                  onChange={(e) => handleIDChange(e.target.value)}
                  placeholder="Enter 9-digit Institution ID"
                  className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-center font-mono text-xl tracking-widest text-gray-900 transition-colors focus:border-indigo-500"
                  maxLength={11}
                />
                <div className="mt-1 text-center text-xs text-gray-400">{institutionId.length}/9 digits</div>

                {lookingUp && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm" style={{ color: '#6c63ff' }}>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Looking up member...
                  </div>
                )}

                {memberFound && (
                  <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Member Found
                    </div>
                    <div className="mt-1 text-sm text-green-600">
                      <strong>{memberFound.member_name}</strong>
                      {memberFound.allergies && <div className="mt-1">Allergies: {memberFound.allergies}</div>}
                    </div>
                  </div>
                )}

                {notFound && (
                  <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                    <div className="text-sm font-semibold text-yellow-700">Member Not Found</div>
                    <p className="mt-1 text-xs text-yellow-600">Please enter member details below to register.</p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <label className="block text-sm font-medium text-gray-700">Member Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition-colors focus:border-indigo-500"
                />
                <label className="mt-4 block text-sm font-medium text-gray-700">Known Allergies</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g., Peanuts, Penicillin (or leave blank)"
                  className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition-colors focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}
        </div>
      </div>

      {mode === 'manual' && (
        <div className="border-t bg-white px-6 py-4">
          <div className="mx-auto max-w-md">
            <button
              onClick={handleSubmit}
              disabled={institutionId.length !== 9 || !name.trim()}
              className="w-full rounded-xl py-4 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: '#1a1a4e' }}
            >
              Continue to Vital Signs
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
