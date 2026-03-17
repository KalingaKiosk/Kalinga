'use client';

import { useState } from 'react';

interface PrivacyNoticeProps {
  onAgree: () => void;
  onBack: () => void;
}

export default function PrivacyNotice({ onAgree, onBack }: PrivacyNoticeProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'linear-gradient(180deg, #1a1a4e 0%, #2d2d6b 40%, #f5f5f5 40%)' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-16">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-blue-300/70 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Card */}
      <div className="flex-1 px-6">
        <div className="mx-auto max-w-md -mt-6 rounded-3xl bg-white p-6 shadow-xl">
          <h1 className="text-xl font-bold text-gray-900">Privacy Notice</h1>
          <p className="mt-2 text-sm text-gray-500">
            KALINGA needs your permission to handle your health data to provide its services.
          </p>

          <div className="mt-5 max-h-[40vh] space-y-4 overflow-y-auto pr-2 text-sm leading-relaxed text-gray-600">
            <div>
              <h3 className="font-semibold text-gray-800">Information We Collect</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>Name, Age, Sex</li>
                <li>Institution ID</li>
                <li>Allergy Information</li>
                <li>Vital signs (temperature, SpO2, pulse, blood pressure)</li>
                <li>Reported Symptoms and Chief Complaints</li>
                <li>Date and time of visit</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800">How We Use Your Information</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>To provide immediate health assessment and triage</li>
                <li>To maintain institutional health records</li>
                <li>To auto-flag abnormal vital signs for urgent attention</li>
                <li>To notify parents/guardians if necessary</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800">Data Security</h3>
              <p className="mt-1">
                Your information is stored securely in an encrypted database and is only
                accessible to authorized health personnel.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800">Your Rights</h3>
              <p className="mt-1">
                You may request access to, correction of, or deletion of your personal
                data by contacting the health office.
              </p>
            </div>
          </div>

          {/* Consent */}
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border-2 border-gray-200 p-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs text-gray-700">
              I have read and understood the privacy notice. I consent to the collection
              and processing of my health information.
            </span>
          </label>

          <button
            onClick={onAgree}
            disabled={!agreed}
            className="mt-5 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: agreed ? '#1a1a4e' : '#9ca3af' }}
          >
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
}
