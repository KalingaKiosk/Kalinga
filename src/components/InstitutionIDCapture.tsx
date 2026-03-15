'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { createWorker } from 'tesseract.js';

const PICAMERA_URL = 'http://localhost:5555';

interface InstitutionIDCaptureProps {
  role: 'student' | 'employee';
  onSubmit: (data: {
    id: string;
    name: string;
    sex: string;
    age: string;
    allergies: string;
    grade_level: string;
    section: string;
    department: string;
    address: string;
    contact_number: string;
    guardian_name: string;
    guardian_contact: string;
  }) => void;
  onBack: () => void;
}

type Mode = 'choose' | 'camera' | 'manual';

interface MemberInfo {
  institution_id: string;
  member_name: string;
  sex: string;
  age: number | null;
  role: string;
  grade_level: string;
  section: string;
  department: string;
  address: string;
  contact_number: string;
  guardian_name: string;
  guardian_contact: string;
  allergies: string;
}

export default function InstitutionIDCapture({ role, onSubmit, onBack }: InstitutionIDCaptureProps) {
  const [mode, setMode] = useState<Mode>('choose');
  const [institutionId, setInstitutionId] = useState('');
  const [name, setName] = useState('');
  const [sex, setSex] = useState('');
  const [age, setAge] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [section, setSection] = useState('');
  const [department, setDepartment] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianContact, setGuardianContact] = useState('');
  const [allergies, setAllergies] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [memberFound, setMemberFound] = useState<MemberInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [piCameraAvailable, setPiCameraAvailable] = useState(false);
  const [piCameraChecked, setPiCameraChecked] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const roleLabel = role === 'student' ? 'Student' : 'Employee';

  // Check if PiCamera server is available on mount
  useEffect(() => {
    const checkPiCamera = async () => {
      try {
        const res = await fetch(`${PICAMERA_URL}/health`, { signal: AbortSignal.timeout(2000) });
        const data = await res.json();
        setPiCameraAvailable(data.status === 'ok' && data.camera_ready);
      } catch {
        setPiCameraAvailable(false);
      } finally {
        setPiCameraChecked(true);
      }
    };
    checkPiCamera();
  }, []);

  // Extract ID from OCR text — supports LRN format (XX-XXXX-XXX) and plain 9 digits
  const extractID = (text: string): string | null => {
    // Try LRN format first: XX-XXXX-XXX
    const lrnMatch = text.match(/\d{2}-\d{4}-\d{3}/);
    if (lrnMatch) {
      return lrnMatch[0].replace(/-/g, '');
    }
    // Fall back to plain 9 digits
    const plainMatch = text.match(/\b\d{9}\b/);
    return plainMatch ? plainMatch[0] : null;
  };

  // Scan using PiCamera server
  const scanWithPiCamera = useCallback(async () => {
    setScanning(true);
    setError('');

    try {
      const res = await fetch(`${PICAMERA_URL}/scan`);
      const data = await res.json();

      if (data.found && data.lrn_digits) {
        setInstitutionId(data.lrn_digits);
        setMode('manual');
        await lookupMember(data.lrn_digits);
      } else {
        setError('Could not detect LRN number. Please try again or enter manually.');
      }
    } catch {
      setError('PiCamera server not responding. Please enter the ID manually.');
    } finally {
      setScanning(false);
    }
  }, []);

  // Scan using browser webcam + tesseract.js
  const scanWithWebcam = useCallback(async () => {
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
        setError('Could not find LRN / Institution ID. Please try again or enter manually.');
      }
    } catch {
      setError('OCR processing failed. Please enter the ID manually.');
    } finally {
      setScanning(false);
    }
  }, []);

  const populateFromMember = (member: MemberInfo) => {
    setName(member.member_name);
    setSex(member.sex || '');
    setAge(member.age ? String(member.age) : '');
    setGradeLevel(member.grade_level || '');
    setSection(member.section || '');
    setDepartment(member.department || '');
    setAddress(member.address || '');
    setContactNumber(member.contact_number || '');
    setGuardianName(member.guardian_name || '');
    setGuardianContact(member.guardian_contact || '');
    setAllergies(member.allergies || '');
  };

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
        populateFromMember(data.member);
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
    if (!sex) {
      setError('Please select Sex (Male/Female).');
      return;
    }
    onSubmit({
      id: institutionId,
      name: name.trim(),
      sex,
      age: age.trim(),
      allergies: allergies.trim(),
      grade_level: gradeLevel.trim(),
      section: section.trim(),
      department: department.trim(),
      address: address.trim(),
      contact_number: contactNumber.trim(),
      guardian_name: guardianName.trim(),
      guardian_contact: guardianContact.trim(),
    });
  };

  const inputClass = "mt-1 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition-colors focus:border-indigo-500";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #1a1a4e, #2d2d6b)' }}>
        <button
          onClick={mode === 'choose' ? onBack : () => { setMode('choose'); }}
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
          {mode === 'manual' && 'Enter or verify patient information'}
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
                  <div className="text-sm text-gray-500">
                    {piCameraChecked && piCameraAvailable
                      ? 'Use PiCamera to scan the LRN from ID card'
                      : 'Use camera to scan the Institution ID from ID card'}
                  </div>
                  {piCameraChecked && piCameraAvailable && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                      PiCamera Connected
                    </div>
                  )}
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
                  <div className="text-sm text-gray-500">Type the 9-digit Institution ID / LRN number</div>
                </div>
              </button>
            </div>
          )}

          {/* Camera Mode */}
          {mode === 'camera' && (
            <div className="space-y-4">
              {piCameraAvailable ? (
                /* PiCamera Mode — live MJPEG stream from Python server */
                <>
                  <div className="overflow-hidden rounded-2xl bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${PICAMERA_URL}/stream`}
                      alt="PiCamera live stream"
                      className="w-full"
                    />
                  </div>
                  <div className="rounded-xl p-3 text-center text-sm" style={{ background: '#eef0ff', color: '#6c63ff' }}>
                    <div className="flex items-center justify-center gap-2">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
                      PiCamera Live — Position the ID card so the LRN is clearly visible
                    </div>
                  </div>
                  <button
                    onClick={scanWithPiCamera}
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
                        Scanning LRN...
                      </span>
                    ) : 'Capture & Scan LRN'}
                  </button>
                </>
              ) : (
                /* Browser Webcam Fallback */
                <>
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
                    onClick={scanWithWebcam}
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
                </>
              )}
              <button onClick={() => setMode('manual')} className="w-full py-2 text-sm" style={{ color: '#6c63ff' }}>
                Enter Institution ID manually instead
              </button>
            </div>
          )}

          {/* Manual Entry */}
          {mode === 'manual' && (
            <div className="space-y-4">
              {/* Institution ID */}
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <label className="block text-sm font-medium text-gray-700">LRN / Institution ID</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={institutionId}
                  onChange={(e) => handleIDChange(e.target.value)}
                  placeholder="Enter 9-digit LRN or Institution ID"
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
                      Member Found — Info Auto-filled
                    </div>
                  </div>
                )}

                {notFound && (
                  <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                    <div className="text-sm font-semibold text-yellow-700">Member Not Found</div>
                    <p className="mt-1 text-xs text-yellow-600">Please fill in the details below to register.</p>
                  </div>
                )}
              </div>

              {/* Patient Information — Clinic Admission Slip */}
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Patient Information</h3>

                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className={inputClass}
                />

                {/* Sex */}
                <label className="mt-4 block text-sm font-medium text-gray-700">Sex</label>
                <div className="mt-1 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSex('Male')}
                    className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${
                      sex === 'Male' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-indigo-200'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setSex('Female')}
                    className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${
                      sex === 'Female' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-indigo-200'
                    }`}
                  >
                    Female
                  </button>
                </div>

                {/* Age */}
                <label className="mt-4 block text-sm font-medium text-gray-700">Age</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="Enter age"
                  className={inputClass}
                />

                {/* Conditional: Student fields */}
                {role === 'student' && (
                  <>
                    <label className="mt-4 block text-sm font-medium text-gray-700">Grade Level</label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">-- Select Grade Level --</option>
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                      <option value="1st Year College">1st Year College</option>
                      <option value="2nd Year College">2nd Year College</option>
                      <option value="3rd Year College">3rd Year College</option>
                      <option value="4th Year College">4th Year College</option>
                    </select>

                    <label className="mt-4 block text-sm font-medium text-gray-700">Section</label>
                    <input
                      type="text"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      placeholder="Enter section"
                      className={inputClass}
                    />
                  </>
                )}

                {/* Conditional: Employee fields */}
                {role === 'employee' && (
                  <>
                    <label className="mt-4 block text-sm font-medium text-gray-700">Department / Position</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Enter department or position"
                      className={inputClass}
                    />
                  </>
                )}

                <label className="mt-4 block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter address"
                  className={inputClass}
                />

                <label className="mt-4 block text-sm font-medium text-gray-700">Contact Number</label>
                <input
                  type="text"
                  inputMode="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g., 09171234567"
                  className={inputClass}
                />
              </div>

              {/* Guardian Info (Students only) */}
              {role === 'student' && (
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Parent / Guardian</h3>

                  <label className="block text-sm font-medium text-gray-700">Guardian Name</label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Enter parent/guardian name"
                    className={inputClass}
                  />

                  <label className="mt-4 block text-sm font-medium text-gray-700">Guardian Contact Number</label>
                  <input
                    type="text"
                    inputMode="tel"
                    value={guardianContact}
                    onChange={(e) => setGuardianContact(e.target.value)}
                    placeholder="e.g., 09171234567"
                    className={inputClass}
                  />
                </div>
              )}

              {/* Allergies */}
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <label className="block text-sm font-medium text-gray-700">Known Allergies</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g., Peanuts, Penicillin (or leave blank)"
                  className={inputClass}
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
              disabled={institutionId.length !== 9 || !name.trim() || !sex}
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
