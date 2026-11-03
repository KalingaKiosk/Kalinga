'use client';

import React, { useState } from 'react';

export interface VitalSignsData {
  heartRate: string;
  spo2: string;
  temperature: string;
}

// 1. Updated interface to include onSubmit, onBack, and allergies
interface VitalSignsProps {
  vitals?: VitalSignsData;
  onVitalsChange?: (updatedVitals: VitalSignsData) => void;
  onSubmit?: (vitals: VitalSignsData) => void;
  onBack?: () => void;
  allergies?: string;
}

// 2. Destructure the new props in the component signature
export default function VitalSigns({ 
  vitals, 
  onVitalsChange, 
  onSubmit, 
  onBack, 
  allergies 
}: VitalSignsProps) {
  const [currentVitals, setCurrentVitals] = useState<VitalSignsData>({
    heartRate: vitals?.heartRate || '',
    spo2: vitals?.spo2 || '',
    temperature: vitals?.temperature || '',
  });

  const [loadingOximeter, setLoadingOximeter] = useState(false);
  const [loadingTemp, setLoadingTemp] = useState(false);
  const [oximeterStatus, setOximeterStatus] = useState<string>('');
  const [tempStatus, setTempStatus] = useState<string>('');

  const getBaseUrl = (): string => {
    const rawUrl = process.env.NEXT_PUBLIC_PI_API_URL || '';
    if (!rawUrl) {
      throw new Error('NEXT_PUBLIC_PI_API_URL is missing in environment variables.');
    }
    return rawUrl.trim().replace(/\/+$/, '');
  };

  const handleReadOximeter = async () => {
    setLoadingOximeter(true);
    setOximeterStatus('Connecting to MAX30100 sensor...');

    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/vitals`, { method: 'GET' });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const pulse = data.heartRate ? data.heartRate.toString() : '';
      const oxygen = data.spo2 ? data.spo2.toString() : '';
      const statusText = data.status || (data.isStable ? ' stabilized' : ' measuring');

      const updated = {
        ...currentVitals,
        heartRate: pulse,
        spo2: oxygen,
      };

      setCurrentVitals(updated);
      if (onVitalsChange) onVitalsChange(updated);
      setOximeterStatus(`Status: ${statusText}`);
    } catch (error: any) {
      console.error('Oximeter Fetch Error:', error);
      setOximeterStatus(`Error: ${error.message}`);
    } finally {
      setLoadingOximeter(false);
    }
  };

  const handleReadTemperature = async () => {
    setLoadingTemp(true);
    setTempStatus('Triggering Arduino thermometer...');

    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/temperature`, { method: 'GET' });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.temperature !== null) {
        const formattedTemp = Number(data.temperature).toFixed(2);

        const updated = {
          ...currentVitals,
          temperature: formattedTemp,
        };

        setCurrentVitals(updated);
        if (onVitalsChange) onVitalsChange(updated);
        setTempStatus(`Success: ${formattedTemp} °C`);
      } else {
        throw new Error(data.status || 'Failed to capture temperature reading.');
      }
    } catch (error: any) {
      console.error('Temperature Fetch Error:', error);
      setTempStatus(`Error: ${error.message}`);
    } finally {
      setLoadingTemp(false);
    }
  };

  const handleInputChange = (field: keyof VitalSignsData, value: string) => {
    const updated = { ...currentVitals, [field]: value };
    setCurrentVitals(updated);
    if (onVitalsChange) onVitalsChange(updated);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(currentVitals);
    }
  };

  return (
    <form onSubmit={handleSubmitForm} className="w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Patient Vital Signs</h2>
        <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-full font-medium border border-green-200">
          Cloudflare API Connected
        </span>
      </div>

      <div className="space-y-6">
        {/* --- PULSE & SPO2 SECTION --- */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Pulse Oximeter (MAX30100)</h3>
            <button
              type="button"
              onClick={handleReadOximeter}
              disabled={loadingOximeter}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-medium rounded-md transition"
            >
              {loadingOximeter ? 'Reading Sensor...' : 'Read Pulse & SpO2'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Heart Rate / Pulse (BPM)
              </label>
              <input
                type="number"
                value={currentVitals.heartRate}
                onChange={(e) => handleInputChange('heartRate', e.target.value)}
                placeholder="-- BPM"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Blood Oxygen (SpO2 %)
              </label>
              <input
                type="number"
                value={currentVitals.spo2}
                onChange={(e) => handleInputChange('spo2', e.target.value)}
                placeholder="-- %"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {oximeterStatus && (
            <p className="mt-2 text-xs text-gray-500 font-mono">{oximeterStatus}</p>
          )}
        </div>

        {/* --- THERMOMETER SECTION --- */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Thermometer (Arduino Serial)</h3>
            <button
              type="button"
              onClick={handleReadTemperature}
              disabled={loadingTemp}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-medium rounded-md transition"
            >
              {loadingTemp ? 'Triggering Arduino...' : 'Read Temperature'}
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Body Temperature (°C)
            </label>
            <input
              type="number"
              step="0.01"
              value={currentVitals.temperature}
              onChange={(e) => handleInputChange('temperature', e.target.value)}
              placeholder="-- °C"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {tempStatus && (
            <p className="mt-2 text-xs text-gray-500 font-mono">{tempStatus}</p>
          )}
        </div>

        {/* --- NAVIGATION BUTTONS FOR FLOW STEP --- */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition"
            >
              Back
            </button>
          )}
          {onSubmit && (
            <button
              type="submit"
              className="ml-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
