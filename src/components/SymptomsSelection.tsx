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

  // ✅ toggle symptom
  const toggleSymptom = (symptom: string) => {
    setSelected((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  // 👉 drill down
  const handleClick = (node: SymptomNode) => {
    if (node.children) {
      setPath((prev) => [...prev, node]);
      setCurrentNodes(node.children);
    } else {
      toggleSymptom(node.label);
    }
  };

  // 🔙 go up
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

  // 🧍 BODY CLICK → OPEN TREE
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

      {/* HEADER */}
      <div className="px-6 py-5 text-center bg-indigo-900 text-white">
        <div className="relative mx-auto max-w-md">
          <button onClick={onBack} className="absolute left-0 top-0 text-sm text-blue-300">
            ←
          </button>
          <h1 className="text-lg font-bold">SYMPTOMS</h1>
          <p className="text-xs opacity-70">{today}</p>
        </div>
      </div>

      {/* VIEW TOGGLE */}
      <div className="bg-white px-6 py-3 shadow-sm">
        <div className="flex max-w-md mx-auto rounded-full p-1 bg-gray-100">
          <button
            onClick={() => setView('body')}
            className={`flex-1 py-2 text-sm rounded-full ${
              view === 'body' ? 'bg-white shadow' : 'text-gray-500'
            }`}
          >
            BODY
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex-1 py-2 text-sm rounded-full ${
              view === 'list' ? 'bg-white shadow' : 'text-gray-500'
            }`}
          >
            LIST
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 px-6 py-4">
        <div className="mx-auto max-w-md space-y-4">

          {/* 🧍 BODY VIEW */}
          {view === 'body' && (
            <div className="bg-white p-4 rounded-xl shadow flex justify-center">
              <svg viewBox="0 0 300 400" width="260">
                {/* Body */}
                <circle cx="150" cy="40" r="25" fill="#c7d2fe" />
                <rect x="120" y="70" width="60" height="120" fill="#c7d2fe" />
                <rect x="90" y="200" width="40" height="120" fill="#c7d2fe" />
                <rect x="170" y="200" width="40" height="120" fill="#c7d2fe" />

                {/* HOTSPOTS */}
                {bodyRegions.map((r) => (
                  <circle
                    key={r.id}
                    cx={r.cx}
                    cy={r.cy}
                    r="12"
                    fill="#ef4444"
                    opacity="0.7"
                    className="cursor-pointer"
                    onClick={() => handleBodyClick(r.id)}
                  />
                ))}
              </svg>
            </div>
          )}

          {/* 📋 LIST VIEW */}
          {view === 'list' && (
            <>
              {/* Breadcrumb */}
              {path.length > 0 && (
                <div className="text-xs text-gray-500">
                  {path.map((p) => p.label).join(' > ')}
                </div>
              )}

              {/* Back */}
              {path.length > 0 && (
                <button onClick={goBackLevel} className="text-sm text-indigo-600">
                  ← Back
                </button>
              )}

              {/* Nodes */}
              <div className="space-y-2">
                {currentNodes.map((node) => {
                  const isSelected = selected.includes(node.label);

                  return (
                    <button
                      key={node.id}
                      onClick={() => handleClick(node)}
                      className={`w-full rounded-xl border p-4 text-left ${
                        isSelected
                          ? 'bg-indigo-100 border-indigo-500'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">
                          {node.label}
                        </span>
                        {node.children && <span>›</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* SELECTED */}
          {selected.length > 0 && (
            <div className="bg-indigo-50 p-3 rounded-xl">
              <h3 className="text-sm font-semibold mb-2">
                Selected ({selected.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selected.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    className="text-xs bg-indigo-500 text-white px-3 py-1 rounded-full"
                  >
                    {s} ✕
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t bg-white px-6 py-4">
        <div className="mx-auto max-w-md">
          <button
            onClick={handleSubmit}
            disabled={selected.length === 0}
            className="w-full rounded-xl py-4 text-sm font-semibold text-white bg-indigo-900 disabled:opacity-40"
          >
            CONTINUE ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
}
