'use client';

import { useState } from 'react';

interface AllergyConfirmationProps {
  allergies: string;
  onConfirm: (updatedAllergies: string) => void;
  onBack: () => void;
}

export default function AllergyConfirmation({ allergies, onConfirm, onBack }: AllergyConfirmationProps) {
  const [value, setValue] = useState(allergies);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #1a1a4e, #2d2d6b)' }}>
        <button
          onClick={onBack}
          className="mb-2 flex items-center gap-1 text-sm text-blue-300/70 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-white">Confirm Allergies</h1>
        <p className="mt-1 text-sm text-blue-200/70">Review and confirm patient allergies before submission</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-md space-y-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Patient Allergies</h2>
                <p className="text-xs text-gray-500">Update if needed, or confirm to proceed</p>
              </div>
            </div>

            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="List any known allergies (e.g., Peanuts, Penicillin, Dust), or type 'None' if no known allergies"
              rows={4}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 transition-colors focus:border-indigo-500"
            />

            <p className="mt-2 text-xs text-gray-400">
              This information helps health personnel provide safe treatment.
            </p>
          </div>

          {value && value.toLowerCase() !== 'none' && value.trim() !== '' && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
              <div className="text-sm font-semibold text-red-700">Allergy Alert</div>
              <p className="mt-1 text-sm text-red-600">{value}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-white px-6 py-4">
        <div className="mx-auto max-w-md">
          <button
            onClick={() => onConfirm(value.trim())}
            className="w-full rounded-xl py-4 text-sm font-semibold text-white transition-all"
            style={{ background: '#1a1a4e' }}
          >
            Confirm &amp; Submit
          </button>
        </div>
      </div>
    </div>
  );
}
