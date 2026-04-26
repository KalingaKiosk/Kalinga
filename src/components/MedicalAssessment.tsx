'use client';

import { useState } from 'react';

interface MedicalAssessmentProps {
  triageId: string;
  role: string;
  // Kiosk-captured data (read-only, shown in S and O tabs)
  member: {
    name: string;
    sex: string;
    age: number | null;
    allergies: string;
  };
  visit: {
    date: string;
    time: string;
  };
  symptoms: string;       // comma-separated symptom labels
  vitals: {
    temperature: number | null;
    spo2: number | null;
    heart_rate: number | null;
    bp_systolic: number | null;
    bp_diastolic: number | null;
    respiratory_rate: number | null;
    weight: number | null;
  };
  flags: string;          // semicolon-separated flag tokens
  // Editable doctor data (existing)
  currentData: {
    final_diagnosis?: string | null;
    treatment_actions?: string | null;
    disposition?: string | null;
    doctor_notes?: string | null;
    updated_by?: string | null;
  };
  token: string;
  onSaved: () => void;
}

const DISPOSITIONS_STUDENT = [
  { value: 'returned_to_class', label: 'Returned to Class' },
  { value: 'sent_home', label: 'Sent Home' },
  { value: 'referred_to_hospital', label: 'Referred to Hospital' },
];

const DISPOSITIONS_EMPLOYEE = [
  { value: 'returned_to_work', label: 'Returned to Work' },
  { value: 'sent_home', label: 'Sent Home' },
  { value: 'referred_to_hospital', label: 'Referred to Hospital' },
];

function VitalCell({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | string | null;
  unit: string;
}) {
  const display = value === null || value === undefined ? '—' : `${value} ${unit}`;
  return (
    <div className="rounded-lg bg-white border border-gray-200 px-2 py-1.5">
      <span className="block text-[10px] text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{display}</span>
    </div>
  );
}

export default function MedicalAssessment({
  triageId, role, member, visit, symptoms, vitals, flags, currentData, token, onSaved,
}: MedicalAssessmentProps) {
  type SoapTab = 'S' | 'O' | 'A' | 'P';
  const initialTab: SoapTab = (currentData.final_diagnosis ?? '').trim() === '' ? 'A' : 'P';
  const [activeTab, setActiveTab] = useState<SoapTab>(initialTab);

  const [diagnosis, setDiagnosis] = useState(currentData.final_diagnosis || '');
  const [treatment, setTreatment] = useState(currentData.treatment_actions || '');
  const [disposition, setDisposition] = useState(currentData.disposition || '');
  const [notes, setNotes] = useState(currentData.doctor_notes || '');
  const [updatedBy, setUpdatedBy] = useState(currentData.updated_by || 'Doctor');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const dispositions = role === 'employee' ? DISPOSITIONS_EMPLOYEE : DISPOSITIONS_STUDENT;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/triage/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          triageId,
          final_diagnosis: diagnosis,
          treatment_actions: treatment,
          disposition: disposition || null,
          doctor_notes: notes,
          updated_by: updatedBy,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        onSaved();
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-indigo-900">Medical Assessment (SOAP)</h3>
      </div>

      <div className="mb-3 flex rounded-lg border border-gray-200 overflow-hidden">
        {(['S', 'O', 'A', 'P'] as SoapTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              activeTab === t
                ? 'bg-indigo-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t === 'S' && 'Subjective'}
            {t === 'O' && 'Objective'}
            {t === 'A' && 'Assessment'}
            {t === 'P' && 'Plan'}
          </button>
        ))}
      </div>

      {activeTab === 'S' && (
        <div className="space-y-3">
          <p className="text-[10px] uppercase font-semibold text-indigo-700">
            Reported by patient (read-only — captured at kiosk)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="block text-gray-500">Name</span>
              <span className="font-medium text-gray-900">{member.name}</span>
            </div>
            <div>
              <span className="block text-gray-500">Role</span>
              <span className="font-medium text-gray-900 capitalize">{role}</span>
            </div>
            <div>
              <span className="block text-gray-500">Sex</span>
              <span className="font-medium text-gray-900">{member.sex || '—'}</span>
            </div>
            <div>
              <span className="block text-gray-500">Age</span>
              <span className="font-medium text-gray-900">{member.age ?? '—'}</span>
            </div>
            <div className="col-span-2">
              <span className="block text-gray-500">Visit</span>
              <span className="font-medium text-gray-900">{visit.date} {visit.time}</span>
            </div>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-semibold text-gray-500">Reported Symptoms</span>
            <p className="mt-1 text-sm text-gray-800">{symptoms || 'None reported'}</p>
          </div>
          {member.allergies && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              <strong>Allergies:</strong> {member.allergies}
            </div>
          )}
        </div>
      )}

      {activeTab === 'O' && (
        <div className="space-y-3">
          <p className="text-[10px] uppercase font-semibold text-indigo-700">
            Vital signs (read-only — captured at kiosk)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <VitalCell label="Temperature" value={vitals.temperature} unit="°C" />
            <VitalCell label="SpO₂" value={vitals.spo2} unit="%" />
            <VitalCell label="Heart Rate" value={vitals.heart_rate} unit="bpm" />
            <VitalCell label="Resp Rate" value={vitals.respiratory_rate} unit="/min" />
            <VitalCell
              label="Blood Pressure"
              value={
                vitals.bp_systolic && vitals.bp_diastolic
                  ? `${vitals.bp_systolic}/${vitals.bp_diastolic}`
                  : null
              }
              unit="mmHg"
            />
            <VitalCell label="Weight" value={vitals.weight} unit="kg" />
          </div>
          {flags && (
            <div className="space-y-1">
              <span className="block text-[10px] uppercase font-semibold text-orange-700">
                Flagged values
              </span>
              <div className="flex flex-wrap gap-1">
                {flags.split('; ').filter(Boolean).map((flag, i) => (
                  <span
                    key={i}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                      flag.includes('CRITICAL') ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                  >
                    {flag.replace('[CRITICAL] ', '').replace('[WARNING] ', '')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'A' && (
        <div className="space-y-3">
          <p className="text-[10px] uppercase font-semibold text-indigo-700">
            Doctor / nurse assessment
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600">Final Diagnosis</label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500"
              placeholder="Enter final diagnosis..."
            />
          </div>
        </div>
      )}

      {activeTab === 'P' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-semibold text-indigo-700">
              Treatment plan & disposition
            </p>
            <select
              value={updatedBy}
              onChange={(e) => setUpdatedBy(e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700"
            >
              <option value="Doctor">Doctor</option>
              <option value="Nurse">Nurse</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600">Treatment / Actions Taken</label>
            <textarea
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500"
              placeholder="Enter treatment details..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600">Disposition</label>
            <select
              value={disposition}
              onChange={(e) => setDisposition(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500"
            >
              <option value="">-- Select Disposition --</option>
              {dispositions.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600">Doctor&apos;s / Nurse&apos;s Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500"
              placeholder="Additional notes..."
            />
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {success && <p className="mt-2 text-xs text-green-600">Saved successfully!</p>}

      {(activeTab === 'A' || activeTab === 'P') && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-3 w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: '#1a1a4e' }}
        >
          {saving ? 'Saving...' : 'Save Assessment'}
        </button>
      )}
    </div>
  );
}
