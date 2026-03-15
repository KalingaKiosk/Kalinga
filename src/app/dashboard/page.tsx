'use client';

import { useState, useEffect, useCallback } from 'react';
import PinGate from '@/components/PinGate';
import MedicalAssessment from '@/components/MedicalAssessment';

interface TriageRecord {
  triage_id: string;
  institution_id: string;
  role: string;
  member_name: string;
  sex: string;
  age: number | null;
  allergies: string;
  visit_time: string;
  visit_date: string;
  symptoms: string;
  vital_signs: string;
  temperature: number | null;
  spo2: number | null;
  heart_rate: number | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  respiratory_rate: number | null;
  weight: number | null;
  flags: string;
  final_diagnosis: string | null;
  treatment_actions: string | null;
  disposition: string | null;
  doctor_notes: string | null;
  updated_by: string | null;
  updated_at: string | null;
  created_at: string;
}

interface Stats {
  totalMembers: number;
  totalVisits: number;
  todayVisits: number;
  flaggedToday: number;
}

type Tab = 'recent' | 'flagged' | 'search';

function dispositionLabel(d: string | null): string {
  if (!d) return '';
  const map: Record<string, string> = {
    returned_to_class: 'Returned to Class',
    returned_to_work: 'Returned to Work',
    sent_home: 'Sent Home',
    referred_to_hospital: 'Referred to Hospital',
  };
  return map[d] || d;
}

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('recent');
  const [records, setRecords] = useState<TriageRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [showPinGate, setShowPinGate] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteRecord = async (triageId: string) => {
    if (!authToken) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/triage/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ triageId }),
      });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirm(null);
        fetchRecords(tab === 'search' ? 'history' : tab, tab === 'search' ? searchId : undefined);
        fetchStats();
      }
    } catch {
      // silent fail
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAllHistory = async (institutionId: string) => {
    if (!authToken) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/triage/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ institutionId, deleteAll: true }),
      });
      const data = await res.json();
      if (data.success) {
        setDeleteConfirm(null);
        fetchRecords(tab === 'search' ? 'history' : tab, tab === 'search' ? searchId : undefined);
        fetchStats();
      }
    } catch {
      // silent fail
    } finally {
      setDeleting(false);
    }
  };

  const fetchRecords = useCallback(async (view: string, id?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ view });
      if (id) params.set('id', id);
      const res = await fetch(`/api/dashboard?${params}`);
      const data = await res.json();
      setRecords(data.records || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard?view=stats');
      const data = await res.json();
      setStats(data);
    } catch {
      setStats(null);
    }
  }, []);

  const setupDB = async () => {
    try {
      const res = await fetch('/api/db/setup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDbReady(true);
        fetchRecords('recent');
        fetchStats();
      }
    } catch (err) {
      console.error('DB setup failed:', err);
    }
  };

  useEffect(() => {
    fetchRecords('recent');
    fetchStats();
  }, [fetchRecords, fetchStats]);

  useEffect(() => {
    if (tab === 'recent') fetchRecords('recent');
    else if (tab === 'flagged') fetchRecords('flagged');
  }, [tab, fetchRecords]);

  const handleSearch = () => {
    if (searchId.length === 9) {
      fetchRecords('history', searchId);
    }
  };

  const handlePinSuccess = (token: string) => {
    setAuthToken(token);
    sessionStorage.setItem('clinic_token', token);
    setShowPinGate(false);
  };

  // Restore token from session on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('clinic_token');
    if (stored) setAuthToken(stored);
  }, []);

  if (!dbReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">Database not initialized</p>
          <button onClick={setupDB} className="mt-4 rounded-xl bg-indigo-600 px-6 py-3 text-white">
            Initialize Database
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showPinGate && <PinGate onSuccess={handlePinSuccess} onCancel={() => setShowPinGate(false)} />}

      {/* Header */}
      <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #1a1a4e, #2d2d6b)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">KALINGA Staff Dashboard</h1>
              <p className="mt-1 text-sm text-blue-200/70">Real-time health monitoring</p>
            </div>
            <div className="flex gap-2">
              <a
                href="/reports"
                className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20"
              >
                Reports
              </a>
              {!authToken ? (
                <button
                  onClick={() => setShowPinGate(true)}
                  className="rounded-lg bg-indigo-500 px-3 py-2 text-xs text-white hover:bg-indigo-400"
                >
                  Unlock Edit Mode
                </button>
              ) : (
                <span className="rounded-lg bg-green-500/20 px-3 py-2 text-xs text-green-300">
                  Edit Mode Active
                </span>
              )}
              <button
                onClick={setupDB}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20"
              >
                Setup DB
              </button>
              <button
                onClick={() => { fetchRecords(tab === 'search' ? 'recent' : tab); fetchStats(); }}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20"
              >
                Refresh
              </button>
            </div>
          </div>

          {stats && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Total Members', value: stats.totalMembers, color: '#6c63ff' },
                { label: 'Total Visits', value: stats.totalVisits, color: '#0ea5e9' },
                { label: 'Today Visits', value: stats.todayVisits, color: '#10b981' },
                { label: 'Flagged Today', value: stats.flaggedToday, color: stats.flaggedToday > 0 ? '#ef4444' : '#6b7280' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-blue-200/70">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-white px-6">
        <div className="mx-auto flex max-w-6xl gap-1">
          {(['recent', 'flagged', 'search'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'recent' && 'Recent Visits'}
              {t === 'flagged' && 'Flagged / Abnormal'}
              {t === 'search' && 'Patient History'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="mx-auto max-w-6xl">
          {tab === 'search' && (
            <div className="mb-6 flex gap-3">
              <input
                type="text"
                inputMode="numeric"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="Enter 9-digit Institution ID"
                className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 font-mono tracking-wider focus:border-indigo-500"
              />
              <button
                onClick={handleSearch}
                disabled={searchId.length !== 9}
                className="rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: '#1a1a4e' }}
              >
                Search
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="h-8 w-8 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No records found. {tab === 'search' && 'Try searching with a valid Institution ID.'}
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.triage_id}
                  className={`rounded-2xl bg-white p-5 shadow-sm ${
                    record.flags ? 'border-l-4 border-red-500' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{record.member_name}</span>
                        {record.sex && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            record.sex === 'Male' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'
                          }`}>
                            {record.sex}
                          </span>
                        )}
                        {record.age && (
                          <span className="text-xs text-gray-500">Age {record.age}</span>
                        )}
                        <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500">
                          {record.institution_id}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          record.role === 'employee' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {record.role === 'employee' ? 'Employee' : 'Student'}
                        </span>
                        {record.updated_by ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                            Reviewed
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-700">
                            Pending Review
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {record.triage_id} &middot; {record.visit_date} {record.visit_time}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {record.disposition && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                          {dispositionLabel(record.disposition)}
                        </span>
                      )}
                      {record.flags && (
                        <div className="flex flex-wrap gap-1">
                          {record.flags.split('; ').map((flag, i) => (
                            <span
                              key={i}
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                                flag.includes('CRITICAL') ? 'bg-red-500' : 'bg-yellow-500'
                              }`}
                            >
                              {flag.replace('[CRITICAL] ', '').replace('[WARNING] ', '')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-xs font-medium uppercase text-gray-400">Symptoms</span>
                      <p className="mt-0.5 text-gray-700">{record.symptoms}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium uppercase text-gray-400">Vital Signs</span>
                      <p className="mt-0.5 text-gray-700">{record.vital_signs}</p>
                    </div>
                  </div>

                  {record.final_diagnosis && (
                    <div className="mt-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700">
                      <strong>Diagnosis:</strong> {record.final_diagnosis}
                      {record.treatment_actions && <> &middot; <strong>Treatment:</strong> {record.treatment_actions}</>}
                    </div>
                  )}

                  {record.allergies && (
                    <div className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">
                      Allergies: {record.allergies}
                    </div>
                  )}

                  {/* Expand / Medical Assessment + Delete */}
                  {authToken && (
                    <div className="mt-2">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setExpandedRecord(expandedRecord === record.triage_id ? null : record.triage_id)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          {expandedRecord === record.triage_id ? 'Hide Assessment' : 'Edit / Add Assessment'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(deleteConfirm === record.triage_id ? null : record.triage_id)}
                          className="text-xs font-medium text-red-500 hover:text-red-700"
                        >
                          Delete Record
                        </button>
                      </div>

                      {/* Delete confirmation */}
                      {deleteConfirm === record.triage_id && (
                        <div className="mt-2 rounded-xl border-2 border-red-200 bg-red-50 p-3">
                          <p className="text-xs font-semibold text-red-700">Are you sure you want to delete this record?</p>
                          <p className="mt-1 text-xs text-red-600">This action cannot be undone.</p>
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => handleDeleteRecord(record.triage_id)}
                              disabled={deleting}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {deleting ? 'Deleting...' : 'Delete This Record'}
                            </button>
                            {tab === 'search' && (
                              <button
                                onClick={() => handleDeleteAllHistory(record.institution_id)}
                                disabled={deleting}
                                className="rounded-lg bg-red-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-900 disabled:opacity-50"
                              >
                                {deleting ? 'Deleting...' : 'Delete ALL History'}
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {expandedRecord === record.triage_id && (
                        <MedicalAssessment
                          triageId={record.triage_id}
                          role={record.role}
                          currentData={{
                            final_diagnosis: record.final_diagnosis,
                            treatment_actions: record.treatment_actions,
                            disposition: record.disposition,
                            doctor_notes: record.doctor_notes,
                            updated_by: record.updated_by,
                          }}
                          token={authToken}
                          onSaved={() => {
                            fetchRecords(tab === 'search' ? 'history' : tab, tab === 'search' ? searchId : undefined);
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
