'use client';

import { type VitalFlag } from '@/lib/vital-flags';

interface SubmissionSuccessProps {
  triageId: string;
  memberName: string;
  flags: VitalFlag[];
  onRestart: () => void;
}

export default function SubmissionSuccess({
  triageId,
  memberName,
  flags,
  onRestart,
}: SubmissionSuccessProps) {
  const hasCritical = flags.some((f) => f.type === 'critical');

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-white"
      style={{
        background: hasCritical
          ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
          : 'linear-gradient(135deg, #059669 0%, #065f46 100%)',
      }}
    >
      <div className="flex flex-col items-center gap-5 text-center">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          {hasCritical ? (
            <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ) : (
            <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold">
            {hasCritical ? 'URGENT — Abnormal Vitals' : 'Submission Complete'}
          </h1>
          <p className="mt-2 text-lg opacity-80">
            Thank you, <strong>{memberName}</strong>
          </p>
        </div>

        <div className="rounded-2xl bg-white/15 px-8 py-4 backdrop-blur-sm">
          <div className="text-sm opacity-80">Triage Reference ID</div>
          <div className="mt-1 font-mono text-2xl font-bold tracking-wider">{triageId}</div>
        </div>

        {/* Flags */}
        {flags.length > 0 && (
          <div className="w-full max-w-sm space-y-2">
            {flags.map((flag, i) => (
              <div
                key={i}
                className={`rounded-xl px-4 py-3 text-left text-sm ${
                  flag.type === 'critical' ? 'bg-white/20' : 'bg-white/10'
                }`}
              >
                <div className="font-semibold">
                  {flag.type === 'critical' ? '🔴' : '🟡'} {flag.label}
                </div>
                <div className="mt-0.5 text-xs opacity-80">{flag.message}</div>
              </div>
            ))}
          </div>
        )}

        <p className="max-w-sm text-sm opacity-80">
          {hasCritical
            ? 'Please proceed IMMEDIATELY to the health office for urgent assessment.'
            : 'Your health information has been recorded. Please proceed to the health office.'}
        </p>

        <button
          onClick={onRestart}
          className="mt-4 rounded-2xl bg-white px-12 py-4 text-lg font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ color: hasCritical ? '#dc2626' : '#059669' }}
        >
          New Patient
        </button>
      </div>
    </div>
  );
}
