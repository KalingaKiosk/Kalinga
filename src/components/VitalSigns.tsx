'use client';

import React, { useState } from 'react';

// --- CALIBRATION & FILTERING CONSTANTS ---
const SAMPLE_COUNT = 5;
const CALIBRATION_OFFSET = 3.39;
const MIN_TEMP = 25.0;
const MAX_TEMP = 42.0;

// --- SPO2 CALIBRATION EQUATION PARAMETERS ---
// Replace these with your calibration equation (e.g., calibrated = SLOPE * raw + INTERCEPT)
const SPO2_SLOPE = 1.0;
const SPO2_INTERCEPT = 0.0;

const calibrateSpo2 = (rawSpo2: number): number => {
  const calibrated = SPO2_SLOPE * rawSpo2 + SPO2_INTERCEPT;
  return Math.min(100, Math.max(0, Math.round(calibrated)));
};

export interface VitalSignsData {
  heartRate: string;
  spo2: string;
  temperature: string;
}

interface VitalSignsProps {
  vitals?: VitalSignsData;
  onVitalsChange?: (updatedVitals: VitalSignsData) => void;
  onSubmit?: (vitals: VitalSignsData) => void;
  onBack?: () => void;
  allergies?: string;
}

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
    setOximeterStatus('Collecting oximeter readings...');

    try {
      const baseUrl = getBaseUrl();
      const spo2Values: number[] = [];
      let latestHeartRate: number | null = null;
      let lastStatus = '';

      for (let i = 0; i < SAMPLE_COUNT; i++) {
        setOximeterStatus(`Reading oximeter (${i + 1}/${SAMPLE_COUNT})...`);

        const response = await fetch(`${baseUrl}/api/vitals`, { method: 'GET' });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        lastStatus = data.status || (data.isStable ? 'stabilized' : 'measuring');

        const hr = Number(data.heartRate);
        const spo2 = Number(data.spo2);

        if (!Number.isNaN(hr) && hr > 0) {
          latestHeartRate = hr;
        }
        if (!Number.isNaN(spo2) && spo2 > 0) {
          spo2Values.push(spo2);
        }

        if (i < SAMPLE_COUNT - 1) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }

      if (spo2Values.length === 0 || latestHeartRate === null) {
        setOximeterStatus(`Status: ${lastStatus || 'No valid finger reading detected'}`);
        return;
      }

      // Average only SpO2 values, then apply calibration equation
      const avgRawSpo2 =
        spo2Values.reduce((sum, val) => sum + val, 0) / spo2Values.length;
      const calibratedSpo2 = calibrateSpo2(avgRawSpo2);

      const updated = {
        ...currentVitals,
        heartRate: latestHeartRate.toString(),
        spo2: calibratedSpo2.toString(),
      };

      setCurrentVitals(updated);
      if (onVitalsChange) onVitalsChange(updated);
      setOximeterStatus(`Success: HR ${latestHeartRate} BPM, SpO2 ${calibratedSpo2}%`);
    } catch (error: any) {
      console.error('Oximeter Fetch Error:', error);
      setOximeterStatus(`Error: ${error.message}`);
    } finally {
      setLoadingOximeter(false);
    }
  };

  const handleReadTemperature = async () => {
    setLoadingTemp(true);
    setTempStatus('Collecting sensor readings...');

    try {
      const baseUrl = getBaseUrl();
      const readings: number[] = [];

      // Collect 5 sensor readings
      for (let i = 0; i < SAMPLE_COUNT; i++) {
        setTempStatus(`Collecting readings (${i + 1}/${SAMPLE_COUNT})...`);

        const response = await fetch(`${baseUrl}/api/temperature`, { method: 'GET' });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.temperature !== null) {
          const temp = Number(data.temperature);
          if (!Number.isNaN(temp) && temp >= MIN_TEMP && temp <= MAX_TEMP) {
            readings.push(temp);
          }
        }

        if (i < SAMPLE_COUNT - 1) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }

      // Check valid samples (at least 3 of 5)
      if (readings.length < 3) {
        setTempStatus('INVALID - REPOSITION SENSOR');
        return;
      }

      // Sort and take median
      readings.sort((a, b) => a - b);
      const validCount = readings.length;
      const median =
        validCount % 2 === 0
          ? (readings[validCount / 2 - 1] + readings[validCount / 2]) / 2.0
          : readings[Math.floor(validCount / 2)];

      // Apply calibration offset
      const estimatedTemp = median + CALIBRATION_OFFSET;
      const formattedTemp = estimatedTemp.toFixed(2);

      const updated = {
        ...currentVitals,
        temperature: formattedTemp,
      };

      setCurrentVitals(updated);
      if (onVitalsChange) onVitalsChange(updated);
      setTempStatus(`Success: ${formattedTemp} °C`);
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gray-50/50">
      <form 
        onSubmit={handleSubmitForm} 
        className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-8"
      >
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            {tempStatus && (
              <p className="mt-2 text-xs text-gray-500 font-mono">{tempStatus}</p>
            )}
          </div>

          {/* --- NAVIGATION BUTTONS --- */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition"
              >
                Back
              </button>
            ) : <div />}
            
            {onSubmit && (
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition shadow-sm"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
