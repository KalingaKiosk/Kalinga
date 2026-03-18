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
  { key: 'temperature', label: 'Body Temperature', unit: '°C', placeholder: '36.5', min: 30, max: 45, required: true, icon: '🌡️' },
  { key: 'spo2', label: 'SpO2 (Oxygen)', unit: '%', placeholder: '98', min: 50, max: 100, required: true, icon: '💉' },
  { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', placeholder: '72', min: 30, max: 220, required: true, icon: '❤️' },
  { key: 'bloodPressureSystolic', label: 'BP Systolic', unit: 'mmHg', placeholder: '120', min: 60, max: 250, icon: '🩺' },
  { key: 'bloodPressureDiastolic', label: 'BP Diastolic', unit: 'mmHg', placeholder: '80', min: 30, max: 160, icon: '🩺' },
  { key: 'respiratoryRate', label: 'Resp. Rate', unit: 'breaths/min', placeholder: '16', min: 5, max: 60, icon: '🫁' },
  { key: 'weight', label: 'Weight', unit: 'kg', placeholder: '65', min: 10, max: 300, icon: '⚖️' },
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
      <div className="px-6 py-6" style={{ background: 'linear-gradient(135deg, #1a1a4e 0%, #2d2d6b 100%)' }}>
        <div className="mx-auto max-w-2xl">
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="text-center text-white">
            <h1 className="text-3xl font-bold">Vital Signs</h1>
            <p className="mt-2 text-lg opacity-90">Record patient measurements</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mx-auto w-full max-w-2xl px-6 pb-6">
        <div className="mx-4 rounded-full bg-white/50 p-1 shadow-lg">
          <div className="flex h-2 items-center justify-between rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 p-0.5">
            {fields.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  index <= currentFieldIndex
                    ? 'bg-white shadow-sm'
                    : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
        <p className="mt-2 text-center text-sm text-gray-600">
          Step {currentFieldIndex + 1} of {fields.length}
        </p>
      </div>

      <div className="flex-1 px-6 pb-12">
        <div className="mx-auto max-w-2xl">
          {/* Allergies Alert */}
          {allergies && (
            <div className="mb-6 rounded-2xl border border-red-200/50 bg-gradient-to-r from-red-50 to-pink-50 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Known Allergies</h3>
                  <p className="mt-1 text-sm text-red-700">{allergies}</p>
                </div>
              </div>
            </div>
          )}

          {/* Linear Table Form */}
          <div className="space-y-4">
            {fields.map((field, index) => {
              const status = getFieldStatus(index);
              const value = data[field.key as keyof VitalSignsData];
              const hasError = errors[field.key as keyof VitalSignsData];

              return (
                <div
                  key={field.key}
                  className={`group rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-md ${
                    status === 'complete' 
                      ? 'ring-2 ring-green-200 border-green-200' 
                      : status === 'error' 
                      ? 'ring-2 ring-red-200 border-red-200' 
                      : 'border border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm transition-all ${
                          status === 'complete'
                            ? 'bg-green-100 text-green-700 ring-2 ring-green-200'
                            : status === 'error'
                            ? 'bg-red-100 text-red-700 ring-2 ring-red-200'
                            : 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200'
                        }`}
                      >
                        {status === 'complete' ? '✓' : field.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{field.label}</div>
                        <div className="text-sm text-gray-500">{field.unit}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status === 'complete' && (
                        <div className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          ✓ Complete
                        </div>
                      )}
                      <span className={`text-sm font-medium ${
                        status === 'error' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={field.placeholder}
                      value={value}
                      onChange={(e) => {
                        updateField(field.key as keyof VitalSignsData, e.target.value);
                        if (currentFieldIndex !== index) setCurrentFieldIndex(index);
                      }}
                      className={`w-full rounded-xl border-2 px-5 py-4 text-lg font-semibold transition-all focus:outline-none focus:ring-4 ${
                        hasError
                          ? 'border-red-300 bg-red-50/50 text-red-900 placeholder-red-300 focus:border-red-400 focus:ring-red-100'
                          : value.trim()
                          ? 'border-green-300 bg-green-50/30 text-green-900 focus:border-green-400 focus:ring-green-100'
                          : 'border-gray-200 bg-white/50 text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-indigo-100'
                      }`}
                    />
                    {hasError && (
                      <p className="mt-2 flex items-center gap-1 rounded-lg bg-red-50 p-2 text-sm text-red-700">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
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

      {/* Footer */}
      <div className="border-t bg-white/80 backdrop-blur-sm px-6 py-6 shadow-lg">
        <div className="mx-auto max-w-2xl">
          <button
            onClick={handleSubmit}
            disabled={Object.keys(errors).length > 0}
            className="w-full rounded-2xl py-4 px-6 text-lg font-bold text-white shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:scale-[1.02] active:scale-[0.98]"
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
