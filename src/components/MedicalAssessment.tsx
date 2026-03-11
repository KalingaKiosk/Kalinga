'use client';

import { useState } from 'react';

interface MedicalAssessmentProps {
  triageId: string;
  role: string;
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

export default function MedicalAssessment({ triageId, role, currentData, token, onSaved }: MedicalAssessmentProps) {
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
        <h3 className="text-sm font-bold text-indigo-900">Medical Assessment</h3>
        <select
          value={updatedBy}
          onChange={(e) => setUpdatedBy(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700"
        >
          <option value="Doctor">Doctor</option>
          <option value="Nurse">Nurse</option>
        </select>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600">Final Diagnosis</label>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500"
            placeholder="Enter final diagnosis..."
          />
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

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {success && <p className="mt-2 text-xs text-green-600">Saved successfully!</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-3 w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        style={{ background: '#1a1a4e' }}
      >
        {saving ? 'Saving...' : 'Save Assessment'}
      </button>
    </div>
  );
}
