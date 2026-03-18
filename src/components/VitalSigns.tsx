'use client';

import { useState } from 'react';

export interface VitalSignsData {
  temperature: string;
  spo2: string;
  heartRate: string;
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  respiratoryRate: string;
  weight: string;
}

interface VitalSignsProps {
  onSubmit: (data: VitalSignsData) => void;
  onBack: () => void;
  allergies: string;
}

interface FieldConfig {
  key: keyof VitalSignsData;
  label: string;
  unit: string;
  placeholder: string;  // ✅ Required in interface
  min: number;
  max: number;
  required?: boolean;
  icon: string;
}

const fields: FieldConfig[] = [
  { 
    key: 'temperature', 
    label: 'Body Temperature', 
    unit: '°C', 
    placeholder: '36.5',  // ✅ Added
    min: 30, 
    max: 45, 
    required: true, 
    icon: '🌡️' 
  },
  { 
    key: 'spo2', 
    label: 'SpO2 (Oxygen Saturation)', 
    unit: '%', 
    placeholder: '98',    // ✅ Added
    min: 50, 
    max: 100, 
    required: true, 
    icon: '💉' 
  },
  { 
    key: 'heartRate', 
    label: 'Pulse / Heart Rate', 
    unit: 'bpm', 
    placeholder: '72',    // ✅ Added
    min: 30, 
    max: 220, 
    required: true, 
    icon: '❤️' 
  },
  { 
    key: 'bloodPressureSystolic', 
    label: 'BP Systolic', 
    unit: 'mmHg', 
    placeholder: '120',   // ✅ Added
    min: 60, 
    max: 250, 
    icon: '🩺' 
  },
  { 
    key: 'bloodPressureDiastolic', 
    label: 'BP Diastolic', 
    unit: 'mmHg', 
    placeholder: '80',    // ✅ Added
    min: 30, 
    max: 160, 
    icon: '🩺' 
  },
  { 
    key: 'respiratoryRate', 
    label: 'Respiratory Rate', 
    unit: '/min', 
    placeholder: '16',    // ✅ Added
    min: 5, 
    max: 60, 
    icon: '🫁' 
  },
  { 
    key: 'weight', 
    label: 'Weight', 
    unit: 'kg', 
    placeholder: '65',    // ✅ Added
    min: 10, 
    max: 300, 
    icon: '⚖️' 
  },
];

export default function VitalSigns({ onSubmit, onBack, allergies }: VitalSignsProps) {
  const [data, setData] = useState<VitalSignsData>({
    temperature: '',
    spo2: '',
    heartRate: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    respiratoryRate: '',
    weight: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof VitalSignsData, string>>>({});

  const updateField = (key: keyof VitalSignsData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
    // ✅ Fixed: Clear error when user types
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VitalSignsData, string>> = {};
    let valid = true;

    for (const field of fields) {
      const val = data[field.key];
      if (field.required && !val.trim()) {
        newErrors[field.key] = `${field.label} is required`;
        valid = false;
        continue;
      }
      if (!val.trim()) continue;
      
      const num = parseFloat(val);
      if (isNaN(num)) {
        newErrors[field.key] = 'Must be a number';
        valid = false;
      } else if (num < field.min || num > field.max) {
        newErrors[field.key] = `Must be ${field.min}–${field.max} ${field.unit}`;
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = () => {
    if (validate()) onSubmit(data);
  };

  return (
    <div className="space-y-4">
      {/* Allergies Display */}
      {allergies && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-red-600 font-medium">⚠️ Allergies:</span>
            <span className="text-red-800">{allergies}</span>
          </div>
        </div>
      )}

      {/* Vital Signs Form */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span>{field.icon}</span>
              <span>{field.label}</span>
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min={field.min}
                max={field.max}
                placeholder={field.placeholder}
                value={data[field.key]}
                onChange={(e) => updateField(field.key, e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 pr-12 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${
                  errors[field.key] 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-200'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {field.unit}
              </span>
            </div>
            {errors[field.key] && (
              <p className="text-xs text-red-600">{errors[field.key]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Next: Symptoms
        </button>
      </div>
    </div>
  );

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
        <h1 className="text-2xl font-bold text-white">Vital Signs</h1>
        <p className="mt-1 text-sm text-blue-200/70">Enter the patient&apos;s measurements</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-md space-y-4">
          {/* Allergy Warning */}
          {allergies && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Known Allergies
              </div>
              <p className="mt-1 text-sm text-red-600">{allergies}</p>
            </div>
          )}

          {/* Sensor readings info */}
          <div className="rounded-xl p-3 text-center text-xs" style={{ background: '#eef0ff', color: '#6c63ff' }}>
            Enter readings from Pulse Oximeter (SpO2 + Pulse) and IR Thermometer (Temperature)
          </div>

          {/* Fields */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {field.icon} {field.label}
                      {field.required && <span className="ml-1 text-red-500">*</span>}
                    </span>
                    <span className="text-xs text-gray-400">{field.unit}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={data[field.key]}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={`w-full rounded-xl border-2 px-4 py-3 text-gray-900 transition-colors ${
                        errors[field.key] ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">{field.unit}</span>
                  </div>
                  {errors[field.key] && <p className="mt-1 text-xs text-red-500">{errors[field.key]}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-white px-6 py-4">
        <div className="mx-auto max-w-md">
          <button
            onClick={handleSubmit}
            className="w-full rounded-xl py-4 text-sm font-semibold text-white transition-all"
            style={{ background: '#1a1a4e' }}
          >
            Continue to Symptoms
          </button>
        </div>
      </div>
    </div>
  );
}
