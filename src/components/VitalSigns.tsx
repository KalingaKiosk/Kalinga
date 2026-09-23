import React, { useState } from 'react';

export interface VitalSignsData {
  heartRate: string;
  spo2: string;
  temperature?: string;
  bloodPressure?: string;
}

interface VitalSignsProps {
  onSubmit: (vitalSigns: VitalSignsData) => void;
  onBack?: () => void;
  allergies?: string;
}

export default function VitalSigns({ onSubmit, onBack, allergies }: VitalSignsProps) {
  const [vitals, setVitals] = useState<VitalSignsData>({
    heartRate: '',
    spo2: '',
    temperature: '',
    bloodPressure: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleAutoRead = async () => {
    setLoading(true);
    setStatusMessage('Reading from MAX30100 sensor on Pi...');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_PI_API_URL;
      console.log('Fetching sensor readings from URL:', apiUrl);

      if (!apiUrl) {
        throw new Error('NEXT_PUBLIC_PI_API_URL environment variable is missing.');
      }

      const response = await fetch(apiUrl, { method: 'GET' });

      if (!response.ok) {
        throw new Error(`Sensor API HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received sensor response:', data);

      // Support both heartRate and pulse_rate JSON key names
      const pulse = data.heartRate || data.pulse_rate || '';
      const oxygen = data.spo2 || '';

      if (pulse || oxygen) {
        setVitals((prev) => ({
          ...prev,
          heartRate: pulse.toString(),
          spo2: oxygen.toString(),
        }));
        setStatusMessage('Readings updated successfully!');
      } else if (data.status === 'Initializing') {
        setStatusMessage('Sensor is initializing... Keep finger on sensor and try again in 5 seconds.');
      } else {
        throw new Error('No valid pulse or SpO2 reading returned from sensor.');
      }
    } catch (error: any) {
      console.error('Error fetching sensor data:', error);
      setStatusMessage(`Error: ${error.message || 'Could not connect to Raspberry Pi.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVitals({
      ...vitals,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(vitals);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Patient Vital Signs</h2>
        <button
          type="button"
          onClick={handleAutoRead}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow transition disabled:opacity-50"
        >
          {loading ? 'Reading...' : 'Auto-Read from Sensor'}
        </button>
      </div>

      {statusMessage && (
        <p
          className={`text-xs mb-4 p-2 rounded ${
            statusMessage.startsWith('Error')
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-green-50 text-green-600 border border-green-200'
          }`}
        >
          {statusMessage}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Heart Rate / Pulse (BPM)
          </label>
          <input
            type="number"
            name="heartRate"
            value={vitals.heartRate}
            onChange={handleChange}
            placeholder="e.g. 72"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Oxygen Saturation — SpO2 (%)
          </label>
          <input
            type="number"
            name="spo2"
            value={vitals.spo2}
            onChange={handleChange}
            placeholder="e.g. 98"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Body Temperature (°C)
          </label>
          <input
            type="text"
            name="temperature"
            value={vitals.temperature}
            onChange={handleChange}
            placeholder="e.g. 36.6"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Blood Pressure (mmHg)
          </label>
          <input
            type="text"
            name="bloodPressure"
            value={vitals.bloodPressure}
            onChange={handleChange}
            placeholder="e.g. 120/80"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 mt-6">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-1/3 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-md transition"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow transition"
          >
            Save Vital Signs Log
          </button>
        </div>
      </form>
    </div>
  );
}
