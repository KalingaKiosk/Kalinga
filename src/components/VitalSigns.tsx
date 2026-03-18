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
  placeholder: string;
  min: number;
  max: number;
  required?: boolean;
  icon: string;
}

const fields: FieldConfig[] = [
  { key: 'temperature', label: 'Body Temperature', unit: '°C', min: 30, max: 45, required: true, icon: '🌡️' },
  { key: 'spo2', label: 'SpO2 (Oxygen)', unit: '%', min: 50, max: 100, required: true, icon: '💉' },
  { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', min: 30, max: 220, required: true, icon: '❤️' },
  { key: 'bloodPressureSystolic', label: 'BP Systolic', unit: 'mmHg', min: 60, max: 250, icon: '🩺' },
  { key: 'bloodPressureDiastolic', label: 'BP Diastolic', unit: 'mmHg', min: 30, max: 160, icon: '🩺' },
  { key: 'respiratoryRate', label: 'Resp. Rate', unit: 'breaths/min', min: 5, max: 60, icon: '🫁' },
  { key: 'weight', label: 'Weight', unit: 'kg', min: 10, max: 300, icon: '⚖️' },
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
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);

  const updateField = (key: keyof VitalSignsData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
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
    if (validate()) {
      onSubmit(data);
    }
  };

  const getFieldStatus = (index: number) => {
    if (errors[fields[index].key as keyof VitalSignsData]) return 'error';
    if (data[fields[index].key as keyof VitalSignsData].trim()) return 'complete';
    return 'pending';
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Header */}
      <div className="px-4 py-4 sm:px-6" style={{ background: 'linear-gradient(135deg, #1a1a4e 0%, #2d2d6b 100%)' }}>
        <div className="mx-auto max-w-lg">
          <button
            onClick={onBack}
            className="mb-3 flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold sm:text-2.5xl">Vital Signs</h1>
            <p className="mt-1 text-sm opacity-90">Record patient measurements</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mx-auto w-full max-w-lg px-4 pb-4">
        <div className="mx-2 rounded-full bg-white/50 p-1 shadow-sm">
          <div className="flex h-1.5 items-center justify-between rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 p-0.5">
            {fields.map((_, index) => (
              <div
                key={index}
                className={`h-full flex-1 rounded-full transition-all ${
                  index <= currentFieldIndex
                    ? 'bg-white shadow-sm'
                    : 'bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
        <p className="mt-1.5 text-center text-xs text-gray-600">
          Step {currentFieldIndex + 1} of {fields.length}
        </p>
      </div>

      <div className="flex-1 px-4 pb-8 sm:px-6">
        <div className="mx-auto max-w-lg">
          {/* Allergies Alert */}
          {allergies && (
            <div className="mb-4 rounded-xl border border-red-200/50 bg-gradient-to-r from-red-50 to-pink-50 p-4 shadow-sm">
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  ⚠️
                </div>
                <div>
                  <h4 className="font-semibold text-red-800">Known Allergies</h4>
                  <p className="mt-0.5 text-sm text-red-700">{allergies}</p>
                </div>
              </div>
            </div>
          )}

          {/* Compact Linear Table */}
          <div className="space-y-3">
            {fields.map((field, index) => {
              const status = getFieldStatus(index);
              const value = data[field.key as keyof VitalSignsData];
              const hasError = errors[field.key as keyof VitalSignsData];

              return (
                <div
                  key={field.key}
                  className={`group rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                    status === 'complete' 
                      ? 'ring-1 ring-green-200 border border-green-100' 
                      : status === 'error' 
                      ? 'ring-1 ring-red-200 border border-red-100' 
                      : 'border border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold shadow-sm transition-all ${
                          status === 'complete'
                            ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
                            : status === 'error'
                            ? 'bg-red-100 text-red-700 ring-1 ring-red-200'
                            : 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200'
                        }`}
                      >
                        {status === 'complete' ? '✓' : field.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-gray-900 text-sm">{field.label}</div>
                        <div className="text-xs text-gray-500">{field.unit}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {status === 'complete' && (
                        <div className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                          ✓
                        </div>
                      )}
                      <span className={`text-xs font-medium ${
                        status === 'error' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={field.placeholder}
                      value={value}
                      onChange={(e) => {
                        updateField(field.key as keyof VitalSignsData, e.target.value);
                        if (currentFieldIndex !== index) setCurrentFieldIndex(index);
                      }}
                      className={`w-full rounded-lg border-2 px-4 py-2.5 text-base font-semibold transition-all focus:outline-none focus:ring-2 ${
                        hasError
                          ? 'border-red-300 bg-red-50/50 text-red-900 placeholder-red-300 focus:border-red-400 focus:ring-red-200/50'
                          : value.trim()
                          ? 'border-green-300 bg-green-50/30 text-green-900 focus:border-green-400 focus:ring-green-200/50'
                          : 'border-gray-200 bg-white/50 text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-indigo-200/50'
                      }`}
                    />
                    {hasError && (
                      <p className="mt-1.5 flex items-center gap-1 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors[field.key as keyof VitalSignsData]}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compact Footer */}
      <div className="border-t bg-white/80 backdrop-blur-sm px-4 py-4 sm:px-6 shadow-lg">
        <div className="mx-auto max-w-lg">
          <button
            onClick={handleSubmit}
            disabled={Object.keys(errors).length > 0}
            className="w-full rounded-xl py-3 px-6 text-base font-bold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: 'linear-gradient(135deg, #1a1a4e 0%, #2d2d6b 50%, #4a4a8a 100%)',
            }}
          >
            {Object.values(data).some(v => v.trim()) ? '✅ Continue to Symptoms' : 'Continue to Symptoms'}
          </button>
        </div>
      </div>
    </div>
  );
}
