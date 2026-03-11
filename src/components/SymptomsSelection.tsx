'use client';

import { useState } from 'react';
import { symptomCategories, bodyRegionMap } from '@/lib/symptoms';

interface SymptomsSelectionProps {
  onSubmit: (symptoms: string[]) => void;
  onBack: () => void;
}

type ViewMode = 'body' | 'list';

const bodyRegions = [
  { id: 'head', label: 'Head', cx: 150, cy: 45 },
  { id: 'throat', label: 'Throat', cx: 150, cy: 85 },
  { id: 'chest', label: 'Chest', cx: 150, cy: 135 },
  { id: 'leftArm', label: 'L. Arm', cx: 85, cy: 155 },
  { id: 'rightArm', label: 'R. Arm', cx: 215, cy: 155 },
  { id: 'abdomen', label: 'Abdomen', cx: 150, cy: 195 },
  { id: 'leftLeg', label: 'L. Leg', cx: 120, cy: 295 },
  { id: 'rightLeg', label: 'R. Leg', cx: 180, cy: 295 },
  { id: 'skin', label: 'Skin', cx: 265, cy: 45 },
];

export default function SymptomsSelection({ onSubmit, onBack }: SymptomsSelectionProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [view, setView] = useState<ViewMode>('body');
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleSymptom = (symptom: string) => {
    setSelected((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSubmit = () => {
    if (selected.length === 0) return;
    onSubmit(selected);
  };

  const activeSymptoms = activeRegion ? (bodyRegionMap[activeRegion] || []) : [];
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="px-6 py-5 text-center" style={{ background: 'linear-gradient(135deg, #1a1a4e, #2d2d6b)' }}>
        <div className="relative mx-auto max-w-md">
          <button
            onClick={onBack}
            className="absolute left-0 top-0 flex items-center gap-1 text-sm text-blue-300/70 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-white">SYMPTOMS</h1>
          <p className="text-xs text-blue-200/70">{today}</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white px-6 py-3 shadow-sm">
        <div className="mx-auto flex max-w-md rounded-full p-1" style={{ background: '#f0f0f5' }}>
          <button
            onClick={() => setView('body')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${
              view === 'body' ? 'bg-white shadow-sm' : 'text-gray-500'
            }`}
            style={view === 'body' ? { color: '#1a1a4e' } : undefined}
          >
            BODY VIEW
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${
              view === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'
            }`}
            style={view === 'list' ? { color: '#1a1a4e' } : undefined}
          >
            LIST VIEW
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-md">
          {/* Body View */}
          {view === 'body' && (
            <div className="space-y-4">
              {/* SVG Body Figure */}
              <div className="relative mx-auto flex justify-center rounded-2xl bg-white p-4 shadow-sm">
                <svg viewBox="0 0 300 400" width="280" height="370" className="mx-auto">
                  {/* Body outline */}
                  <defs>
                    <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>

                  {/* Head */}
                  <ellipse cx="150" cy="40" rx="25" ry="30" fill="url(#bodyGrad)" stroke="#6366f1" strokeWidth="1.5" opacity="0.7" />
                  {/* Neck */}
                  <rect x="140" y="68" width="20" height="15" rx="5" fill="url(#bodyGrad)" stroke="#6366f1" strokeWidth="1" opacity="0.5" />
                  {/* Torso */}
                  <path d="M110 83 L190 83 L195 220 L105 220 Z" fill="url(#bodyGrad)" stroke="#6366f1" strokeWidth="1.5" opacity="0.6" />
                  {/* Left arm */}
                  <path d="M110 88 L70 140 L60 200 L75 200 L90 145 L110 110" fill="url(#bodyGrad)" stroke="#6366f1" strokeWidth="1.5" opacity="0.5" />
                  {/* Right arm */}
                  <path d="M190 88 L230 140 L240 200 L225 200 L210 145 L190 110" fill="url(#bodyGrad)" stroke="#6366f1" strokeWidth="1.5" opacity="0.5" />
                  {/* Left leg */}
                  <path d="M108 220 L100 300 L95 370 L115 370 L120 300 L135 220" fill="url(#bodyGrad)" stroke="#6366f1" strokeWidth="1.5" opacity="0.5" />
                  {/* Right leg */}
                  <path d="M165 220 L180 300 L185 370 L205 370 L200 300 L192 220" fill="url(#bodyGrad)" stroke="#6366f1" strokeWidth="1.5" opacity="0.5" />

                  {/* Clickable hotspots */}
                  {bodyRegions.map((region) => {
                    const regionSymptoms = bodyRegionMap[region.id] || [];
                    const hasSelected = regionSymptoms.some((s) => selected.includes(s));
                    const isActive = activeRegion === region.id;

                    return (
                      <g key={region.id} onClick={() => setActiveRegion(isActive ? null : region.id)} className="cursor-pointer">
                        <circle
                          cx={region.cx}
                          cy={region.cy}
                          r={isActive ? 14 : 10}
                          fill={hasSelected ? '#ef4444' : isActive ? '#6c63ff' : '#ef4444'}
                          opacity={isActive ? 1 : hasSelected ? 0.9 : 0.6}
                          className="transition-all"
                        />
                        <circle
                          cx={region.cx}
                          cy={region.cy}
                          r={isActive ? 18 : 14}
                          fill="none"
                          stroke={hasSelected ? '#ef4444' : '#ef4444'}
                          strokeWidth="1"
                          opacity={isActive ? 0.5 : 0.2}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Active region symptoms */}
              {activeRegion && activeSymptoms.length > 0 && (
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    {bodyRegions.find((r) => r.id === activeRegion)?.label} — Select Symptoms
                  </h3>
                  <div className="space-y-2">
                    {activeSymptoms.map((symptom) => (
                      <label
                        key={symptom}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-colors ${
                          selected.includes(symptom) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(symptom)}
                          onChange={() => toggleSymptom(symptom)}
                          className="h-5 w-5 rounded border-gray-300 text-indigo-600"
                        />
                        <span className="text-sm text-gray-700">{symptom}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List View — 5 categories from Figure 5 */}
          {view === 'list' && (
            <div className="space-y-3">
              {symptomCategories.map((category) => {
                const isExpanded = expandedCategory === category.id;
                const selectedCount = category.symptoms.filter((s) => selected.includes(s)).length;

                return (
                  <div key={category.id} className="rounded-2xl bg-white shadow-sm overflow-hidden">
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
                      <span className="text-sm font-semibold text-gray-800">{category.label}</span>
                      <div className="flex items-center gap-2">
                        {selectedCount > 0 && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white" style={{ background: '#6c63ff' }}>
                            {selectedCount}
                          </span>
                        )}
                        <svg
                          className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t px-4 pb-4 pt-2">
                        <div className="space-y-2">
                          {category.symptoms.map((symptom) => (
                            <label
                              key={symptom}
                              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-colors ${
                                selected.includes(symptom) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selected.includes(symptom)}
                                onChange={() => toggleSymptom(symptom)}
                                className="h-5 w-5 rounded border-gray-300 text-indigo-600"
                              />
                              <span className="text-sm text-gray-700">{symptom}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected summary */}
          {selected.length > 0 && (
            <div className="mt-4 rounded-2xl p-4" style={{ background: '#eef0ff' }}>
              <h3 className="text-sm font-semibold" style={{ color: '#1a1a4e' }}>Selected ({selected.length})</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {selected.map((symptom) => (
                  <button
                    key={symptom}
                    onClick={() => toggleSymptom(symptom)}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white"
                    style={{ background: '#6c63ff' }}
                  >
                    {symptom}
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-white px-6 py-4">
        <div className="mx-auto max-w-md">
          <button
            onClick={handleSubmit}
            disabled={selected.length === 0}
            className="w-full rounded-xl py-4 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: '#1a1a4e' }}
          >
            CONTINUE ({selected.length} selected)
          </button>
        </div>
      </div>
    </div>
  );
}
