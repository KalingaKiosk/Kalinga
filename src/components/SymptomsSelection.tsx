'use client';

import { useState } from 'react';
import { symptomTree, SymptomNode } from '@/lib/symptomTree';

interface Props {
  onSubmit: (symptoms: string[]) => void;
  onBack: () => void;
}

type ViewMode = 'body' | 'list';

const bodyRegions = [
  { id: 'head', cx: 150, cy: 45 },
  { id: 'torso', cx: 150, cy: 150 },
  { id: 'limbs', cx: 100, cy: 250 },
  { id: 'genitourinary', cx: 150, cy: 240 },
];

export default function SymptomsSelection({ onSubmit, onBack }: Props) {
  const [view, setView] = useState<ViewMode>('body');
  const [currentNodes, setCurrentNodes] = useState<SymptomNode[]>(symptomTree);
  const [path, setPath] = useState<SymptomNode[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSymptom = (symptom: string) => {
    setSelected((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleClick = (node: SymptomNode) => {
    if (node.children) {
      setPath((prev) => [...prev, node]);
      setCurrentNodes(node.children);
    } else {
      toggleSymptom(node.label);
    }
  };

  const goBackLevel = () => {
    const newPath = [...path];
    newPath.pop();
    setPath(newPath);
    if (newPath.length === 0) {
      setCurrentNodes(symptomTree);
    } else {
      setCurrentNodes(newPath[newPath.length - 1].children || []);
    }
  };

  const handleBodyClick = (regionId: string) => {
    const node = symptomTree.find((n) => n.id === regionId);
    if (!node) return;
    setView('list');
    setPath([node]);
    setCurrentNodes(node.children || []);
  };

  const handleSubmit = () => {
    if (selected.length === 0) return;
    onSubmit(selected);
  };

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="px-6 py-5 text-center bg-indigo-900 text-white">
        <div className="relative mx-auto max-w-md">
          <button onClick={onBack} className="absolute left-0 top-0 text-sm text-blue-300 hover:text-blue-200">
            ←
          </button>
          <h1 className="text-lg font-bold">SYMPTOMS</h1>
          <p className="text-xs opacity-70">{today}</p>
        </div>
      </div>

      <div className="bg-white px-6 py-3 shadow-sm">
        <div className="flex max-w-md mx-auto rounded-full p-1 bg-gray-100">
          <button
            onClick={() => setView('body')}
            className={`flex-1 py-2 text-sm rounded-full font-medium transition-all ${
              view === 'body' ? 'bg-white shadow-sm text-indigo-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            BODY
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex-1 py-2 text-sm rounded-full font-medium transition-all ${
              view === 'list' ? 'bg-white shadow-sm text-indigo-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            LIST
          </button>
        </div>
      </div>

      <div className="flex-1 px-6 py-4">
        <div className="mx-auto max-w-md space-y-4">
          {view === 'body' && (
            <div className="bg-white p-8 rounded-xl shadow-lg flex justify-center">
              <svg viewBox="0 0 300 400" width="260" className="select-none">
                <circle cx="150" cy="40" r="28" fill="#c7d2fe" stroke="#a5b4fc" strokeWidth="2"/>
                <rect x="118" y="70" width="64" height="120" rx="8" fill="#c7d2fe" stroke="#a5b4fc" strokeWidth="2"/>
                <rect x="88" y="200" width="44" height="120" rx="6" fill="#c7d2fe" stroke="#a5b4fc" strokeWidth="2"/>
                <rect x="168" y="200" width="44" height="120" rx="6" fill="#c7d2fe" stroke="#a5b4fc" strokeWidth="2"/>

                {bodyRegions.map((r) => (
                  <g key={r.id}>
                    <circle
                      cx={r.cx}
                      cy={r.cy}
                      r="16"
                      fill="#ef4444"
                      className="cursor-pointer hover:fill-red-500 hover:scale-110 transition-all duration-200 shadow-lg hover:shadow-xl"
                      onClick={() => handleBodyClick(r.id)}
                    />
                    <text
                      x={r.cx}
                      y={r.cy + 4}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="bold"
                      fill="white"
                      className="cursor-pointer"
                      onClick={() => handleBodyClick(r.id)}
                    >
                      {r.id === 'head' ? 'H' : r.id === 'torso' ? 'T' : r.id === 'limbs' ? 'L' : 'G'}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}

          {view === 'list' && (
            <>
              {path.length > 0 && (
                <div className="text-xs text-gray-500 mb-3">
                  {path.map((p) => p.label).join(' > ')}
                </div>
              )}
              {path.length > 0 && (
                <button onClick={goBackLevel} className="text-sm text-indigo-600 hover:text-indigo-700 mb-4">
                  ← Back
                </button>
              )}
              <div className="space-y-2">
                {currentNodes.map((node) => {
                  const isSelected = selected.includes(node.label);
                  return (
                    <button
                      key={node.id}
                      onClick={() => handleClick(node)}
                      className={`w-full rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                        isSelected
                          ? 'bg-indigo-100 border-indigo-500 shadow-md'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{node.label}</span>
                        {node.children && <span>›</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {selected.length > 0 && (
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
              <h3 className="text-sm font-semibold mb-2 text-indigo-900">
                Selected ({selected.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selected.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-full transition-all"
                  >
                    {s} ✕
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-md">
          <button
            onClick={handleSubmit}
            disabled={selected.length === 0}
            className="w-full rounded-xl py-4 text-sm font-semibold text-white bg-indigo-900 hover:bg-indigo-800 disabled:opacity-50 transition-all shadow-lg"
          >
            CONTINUE ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
}
