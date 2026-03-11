'use client';

import { useState } from 'react';

interface PinGateProps {
  onSuccess: (token: string) => void;
  onCancel: () => void;
}

export default function PinGate({ onSuccess, onCancel }: PinGateProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        onSuccess(data.token);
      } else {
        setError(data.error || 'Invalid PIN');
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-gray-900">Staff Authentication</h2>
        <p className="mt-1 text-sm text-gray-500">Enter the clinic PIN to access edit mode</p>

        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
          placeholder="Enter PIN"
          className="mt-4 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-center font-mono text-2xl tracking-widest text-gray-900 transition-colors focus:border-indigo-500"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />

        {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || pin.length < 4}
            className="flex-1 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: '#1a1a4e' }}
          >
            {loading ? 'Verifying...' : 'Unlock'}
          </button>
        </div>
      </div>
    </div>
  );
}
