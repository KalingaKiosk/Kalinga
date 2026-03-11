'use client';

import { useState, useEffect, useCallback } from 'react';
import PinGate from '@/components/PinGate';

interface TriageRecord {
  triage_id: string;
  institution_id: string;
  role: string;
  member_name: string;
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

interface DailyStats {
  total: number;
  flagged: number;
  dispositions: Record<string, number>;
}

interface MonthlyStats {
  totalVisits: number;
  flaggedCount: number;
  dispositionBreakdown: Record<string, number>;
  topSymptoms: { symptom: string; count: number }[];
}

interface MemberInfo {
  institution_id: string;
  member_name: string;
  role: string;
  allergies: string;
}

type ReportTab = 'daily' | 'monthly' | 'individual';

function dispositionLabel(d: string): string {
  const map: Record<string, string> = {
    returned_to_class: 'Returned to Class',
    returned_to_work: 'Returned to Work',
    sent_home: 'Sent Home',
    referred_to_hospital: 'Referred to Hospital',
  };
  return map[d] || d;
}

function todayStr(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function thisMonthStr(): string {
  const d = new Date();
  return d.toISOString().slice(0, 7);
}

export default function ReportsPage() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [showPinGate, setShowPinGate] = useState(false);
  const [tab, setTab] = useState<ReportTab>('daily');

  // Daily state
  const [dailyDate, setDailyDate] = useState(todayStr());
  const [dailyRole, setDailyRole] = useState('all');
  const [dailyRecords, setDailyRecords] = useState<TriageRecord[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  // Monthly state
  const [monthlyMonth, setMonthlyMonth] = useState(thisMonthStr());
  const [monthlyRole, setMonthlyRole] = useState('all');
  const [monthlyRecords, setMonthlyRecords] = useState<TriageRecord[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Individual state
  const [individualId, setIndividualId] = useState('');
  const [individualMember, setIndividualMember] = useState<MemberInfo | null>(null);
  const [individualRecords, setIndividualRecords] = useState<TriageRecord[]>([]);
  const [individualLoading, setIndividualLoading] = useState(false);
  const [individualExpanded, setIndividualExpanded] = useState<string | null>(null);

  // Restore token on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('clinic_token');
    if (stored) {
      setAuthToken(stored);
    } else {
      setShowPinGate(true);
    }
  }, []);

  const handlePinSuccess = (token: string) => {
    setAuthToken(token);
    sessionStorage.setItem('clinic_token', token);
    setShowPinGate(false);
  };

  // Fetch daily report
  const fetchDaily = useCallback(async () => {
    if (!authToken) return;
    setDailyLoading(true);
    try {
      const params = new URLSearchParams({ type: 'daily', date: dailyDate, role: dailyRole });
      const res = await fetch(`/api/reports?${params}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await res.json();
      setDailyRecords(data.records || []);
      setDailyStats(data.stats || null);
    } catch {
      setDailyRecords([]);
      setDailyStats(null);
    } finally {
      setDailyLoading(false);
    }
  }, [authToken, dailyDate, dailyRole]);

  // Fetch monthly report
  const fetchMonthly = useCallback(async () => {
    if (!authToken) return;
    setMonthlyLoading(true);
    try {
      const params = new URLSearchParams({ type: 'monthly', month: monthlyMonth, role: monthlyRole });
      const res = await fetch(`/api/reports?${params}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await res.json();
      setMonthlyRecords(data.records || []);
      setMonthlyStats(data.stats || null);
    } catch {
      setMonthlyRecords([]);
      setMonthlyStats(null);
    } finally {
      setMonthlyLoading(false);
    }
  }, [authToken, monthlyMonth, monthlyRole]);

  // Fetch individual report
  const fetchIndividual = useCallback(async () => {
    if (!authToken || individualId.length !== 9) return;
    setIndividualLoading(true);
    try {
      const params = new URLSearchParams({ type: 'individual', id: individualId });
      const res = await fetch(`/api/reports?${params}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await res.json();
      setIndividualMember(data.member || null);
      setIndividualRecords(data.records || []);
    } catch {
      setIndividualMember(null);
      setIndividualRecords([]);
    } finally {
      setIndividualLoading(false);
    }
  }, [authToken, individualId]);

  // Auto-fetch when tab changes or filters change
  useEffect(() => {
    if (tab === 'daily' && authToken) fetchDaily();
  }, [tab, authToken, fetchDaily]);

  useEffect(() => {
    if (tab === 'monthly' && authToken) fetchMonthly();
  }, [tab, authToken, fetchMonthly]);

  if (!authToken && !showPinGate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">Authentication required</p>
          <button
            onClick={() => setShowPinGate(true)}
            className="mt-4 rounded-xl px-6 py-3 text-sm font-semibold text-white"
            style={{ background: '#1a1a4e' }}
          >
            Enter PIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-full { width: 100% !important; max-width: 100% !important; padding: 0 !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        {showPinGate && (
          <PinGate
            onSuccess={handlePinSuccess}
            onCancel={() => {
              setShowPinGate(false);
              window.location.href = '/dashboard';
            }}
          />
        )}

        {/* Header */}
        <div className="no-print px-6 py-5" style={{ background: 'linear-gradient(135deg, #1a1a4e, #2d2d6b)' }}>
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">KALINGA Reports</h1>
                <p className="mt-1 text-sm text-blue-200/70">Health data reports and analytics</p>
              </div>
              <div className="flex gap-2">
                <a
                  href="/dashboard"
                  className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20"
                >
                  Dashboard
                </a>
                <button
                  onClick={() => window.print()}
                  className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="no-print border-b bg-white px-6">
          <div className="mx-auto flex max-w-6xl gap-1">
            {(['daily', 'monthly', 'individual'] as ReportTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'daily' && 'Daily Summary'}
                {t === 'monthly' && 'Monthly Summary'}
                {t === 'individual' && 'Individual History'}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-6 print-full">
          <div className="mx-auto max-w-6xl print-full">

            {/* ============== DAILY TAB ============== */}
            {tab === 'daily' && (
              <div>
                {/* Filters */}
                <div className="no-print mb-6 flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Date</label>
                    <input
                      type="date"
                      value={dailyDate}
                      onChange={(e) => setDailyDate(e.target.value)}
                      className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Role</label>
                    <select
                      value={dailyRole}
                      onChange={(e) => setDailyRole(e.target.value)}
                      className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    >
                      <option value="all">All</option>
                      <option value="student">Students</option>
                      <option value="employee">Employees</option>
                    </select>
                  </div>
                  <button
                    onClick={fetchDaily}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                    style={{ background: '#1a1a4e' }}
                  >
                    Generate
                  </button>
                </div>

                {/* Print header */}
                <div className="mb-4 hidden print:block">
                  <h2 className="text-xl font-bold text-gray-900">KALINGA Health Kiosk - Daily Report</h2>
                  <p className="text-sm text-gray-600">Date: {dailyDate} | Role: {dailyRole}</p>
                </div>

                {/* Stats cards */}
                {dailyStats && (
                  <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <div className="text-2xl font-bold" style={{ color: '#6c63ff' }}>{dailyStats.total}</div>
                      <div className="text-xs text-gray-500">Total Visits</div>
                    </div>
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <div className="text-2xl font-bold text-red-600">{dailyStats.flagged}</div>
                      <div className="text-xs text-gray-500">Flagged</div>
                    </div>
                    {Object.entries(dailyStats.dispositions || {}).map(([key, count]) => (
                      <div key={key} className="rounded-xl bg-white p-4 shadow-sm">
                        <div className="text-2xl font-bold text-gray-900">{count}</div>
                        <div className="text-xs text-gray-500">{dispositionLabel(key)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Records table */}
                {dailyLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <svg className="h-8 w-8 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                ) : dailyRecords.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">No records for this date.</div>
                ) : (
                  <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b text-xs font-medium uppercase text-gray-400">
                          <th className="px-4 py-3">Time</th>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">ID</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Symptoms</th>
                          <th className="px-4 py-3">Flags</th>
                          <th className="px-4 py-3">Diagnosis</th>
                          <th className="px-4 py-3">Disposition</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyRecords.map((r) => (
                          <tr key={r.triage_id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="whitespace-nowrap px-4 py-3 text-gray-600">{r.visit_time}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{r.member_name}</td>
                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.institution_id}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                r.role === 'employee' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {r.role === 'employee' ? 'Emp' : 'Stu'}
                              </span>
                            </td>
                            <td className="max-w-[200px] truncate px-4 py-3 text-gray-600">{r.symptoms}</td>
                            <td className="px-4 py-3">
                              {r.flags ? (
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                                  r.flags.includes('CRITICAL') ? 'bg-red-500' : 'bg-yellow-500'
                                }`}>
                                  Flagged
                                </span>
                              ) : (
                                <span className="text-xs text-gray-300">--</span>
                              )}
                            </td>
                            <td className="max-w-[150px] truncate px-4 py-3 text-xs text-gray-600">
                              {r.final_diagnosis || <span className="text-gray-300">--</span>}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {r.disposition ? (
                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                  {dispositionLabel(r.disposition)}
                                </span>
                              ) : (
                                <span className="text-gray-300">--</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {r.updated_by ? (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                  Reviewed
                                </span>
                              ) : (
                                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-700">
                                  Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ============== MONTHLY TAB ============== */}
            {tab === 'monthly' && (
              <div>
                {/* Filters */}
                <div className="no-print mb-6 flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Month</label>
                    <input
                      type="month"
                      value={monthlyMonth}
                      onChange={(e) => setMonthlyMonth(e.target.value)}
                      className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Role</label>
                    <select
                      value={monthlyRole}
                      onChange={(e) => setMonthlyRole(e.target.value)}
                      className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    >
                      <option value="all">All</option>
                      <option value="student">Students</option>
                      <option value="employee">Employees</option>
                    </select>
                  </div>
                  <button
                    onClick={fetchMonthly}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                    style={{ background: '#1a1a4e' }}
                  >
                    Generate
                  </button>
                </div>

                {/* Print header */}
                <div className="mb-4 hidden print:block">
                  <h2 className="text-xl font-bold text-gray-900">KALINGA Health Kiosk - Monthly Report</h2>
                  <p className="text-sm text-gray-600">Month: {monthlyMonth} | Role: {monthlyRole}</p>
                </div>

                {monthlyLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <svg className="h-8 w-8 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                ) : (
                  <>
                    {/* Stats overview */}
                    {monthlyStats && (
                      <div className="mb-6 space-y-6">
                        {/* Summary cards */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-xl bg-white p-4 shadow-sm">
                            <div className="text-2xl font-bold" style={{ color: '#6c63ff' }}>{monthlyStats.totalVisits}</div>
                            <div className="text-xs text-gray-500">Total Visits</div>
                          </div>
                          <div className="rounded-xl bg-white p-4 shadow-sm">
                            <div className="text-2xl font-bold text-red-600">{monthlyStats.flaggedCount}</div>
                            <div className="text-xs text-gray-500">Flagged Cases</div>
                          </div>
                          {Object.entries(monthlyStats.dispositionBreakdown || {}).map(([key, count]) => (
                            <div key={key} className="rounded-xl bg-white p-4 shadow-sm">
                              <div className="text-2xl font-bold text-gray-900">{count}</div>
                              <div className="text-xs text-gray-500">{dispositionLabel(key)}</div>
                            </div>
                          ))}
                        </div>

                        {/* Top Symptoms bar chart */}
                        {monthlyStats.topSymptoms && monthlyStats.topSymptoms.length > 0 && (
                          <div className="rounded-xl bg-white p-5 shadow-sm">
                            <h3 className="mb-4 text-sm font-bold text-gray-900">Top 10 Symptoms</h3>
                            <div className="space-y-2">
                              {monthlyStats.topSymptoms.slice(0, 10).map((item, idx) => {
                                const maxCount = monthlyStats.topSymptoms[0]?.count || 1;
                                const widthPct = Math.max((item.count / maxCount) * 100, 4);
                                return (
                                  <div key={idx} className="flex items-center gap-3">
                                    <div className="w-32 shrink-0 truncate text-right text-xs text-gray-600">
                                      {item.symptom}
                                    </div>
                                    <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-gray-100">
                                      <div
                                        className="absolute inset-y-0 left-0 rounded-full"
                                        style={{
                                          width: `${widthPct}%`,
                                          background: `linear-gradient(90deg, #6c63ff, #1a1a4e)`,
                                        }}
                                      />
                                    </div>
                                    <div className="w-8 text-right text-xs font-bold text-gray-700">{item.count}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Disposition breakdown chart */}
                        {monthlyStats.dispositionBreakdown && Object.keys(monthlyStats.dispositionBreakdown).length > 0 && (
                          <div className="rounded-xl bg-white p-5 shadow-sm">
                            <h3 className="mb-4 text-sm font-bold text-gray-900">Disposition Breakdown</h3>
                            <div className="flex gap-2">
                              {(() => {
                                const entries = Object.entries(monthlyStats.dispositionBreakdown);
                                const total = entries.reduce((s, [, c]) => s + c, 0) || 1;
                                const colors: Record<string, string> = {
                                  returned_to_class: '#10b981',
                                  returned_to_work: '#0ea5e9',
                                  sent_home: '#f59e0b',
                                  referred_to_hospital: '#ef4444',
                                };
                                return entries.map(([key, count]) => (
                                  <div
                                    key={key}
                                    className="flex flex-col items-center justify-end"
                                    style={{ flex: count / total }}
                                  >
                                    <div className="mb-1 text-xs font-bold text-gray-700">{count}</div>
                                    <div
                                      className="w-full rounded-lg"
                                      style={{
                                        height: `${Math.max((count / total) * 200, 20)}px`,
                                        backgroundColor: colors[key] || '#6b7280',
                                      }}
                                    />
                                    <div className="mt-1 text-center text-[10px] text-gray-500">
                                      {dispositionLabel(key)}
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Monthly records list */}
                    {monthlyRecords.length > 0 && (
                      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b text-xs font-medium uppercase text-gray-400">
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Time</th>
                              <th className="px-4 py-3">Name</th>
                              <th className="px-4 py-3">Role</th>
                              <th className="px-4 py-3">Symptoms</th>
                              <th className="px-4 py-3">Flags</th>
                              <th className="px-4 py-3">Disposition</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthlyRecords.map((r) => (
                              <tr key={r.triage_id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="whitespace-nowrap px-4 py-3 text-gray-600">{r.visit_date}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-gray-600">{r.visit_time}</td>
                                <td className="px-4 py-3 font-medium text-gray-900">{r.member_name}</td>
                                <td className="px-4 py-3">
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    r.role === 'employee' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {r.role === 'employee' ? 'Emp' : 'Stu'}
                                  </span>
                                </td>
                                <td className="max-w-[200px] truncate px-4 py-3 text-gray-600">{r.symptoms}</td>
                                <td className="px-4 py-3">
                                  {r.flags ? (
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                                      r.flags.includes('CRITICAL') ? 'bg-red-500' : 'bg-yellow-500'
                                    }`}>
                                      Flagged
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-300">--</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  {r.disposition ? (
                                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                      {dispositionLabel(r.disposition)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300">--</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {!monthlyStats && monthlyRecords.length === 0 && (
                      <div className="py-12 text-center text-gray-500">No data for this month.</div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ============== INDIVIDUAL TAB ============== */}
            {tab === 'individual' && (
              <div>
                {/* Search */}
                <div className="no-print mb-6 flex gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={individualId}
                    onChange={(e) => setIndividualId(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="Enter 9-digit Institution ID"
                    className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 font-mono tracking-wider focus:border-indigo-500"
                  />
                  <button
                    onClick={fetchIndividual}
                    disabled={individualId.length !== 9}
                    className="rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
                    style={{ background: '#1a1a4e' }}
                  >
                    Search
                  </button>
                </div>

                {individualLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <svg className="h-8 w-8 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                ) : (
                  <>
                    {/* Member info card */}
                    {individualMember && (
                      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                            style={{ background: '#1a1a4e' }}
                          >
                            {individualMember.member_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{individualMember.member_name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span className="font-mono">{individualMember.institution_id}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                individualMember.role === 'employee' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {individualMember.role === 'employee' ? 'Employee' : 'Student'}
                              </span>
                            </div>
                          </div>
                        </div>
                        {individualMember.allergies && (
                          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                            Allergies: {individualMember.allergies}
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-400">
                          Total visits: {individualRecords.length}
                        </div>
                      </div>
                    )}

                    {/* Visit history */}
                    {individualRecords.length > 0 ? (
                      <div className="space-y-3">
                        {individualRecords.map((record) => (
                          <div key={record.triage_id} className={`rounded-xl bg-white p-4 shadow-sm ${
                            record.flags ? 'border-l-4 border-red-500' : ''
                          }`}>
                            <div
                              className="flex cursor-pointer items-center justify-between"
                              onClick={() => setIndividualExpanded(
                                individualExpanded === record.triage_id ? null : record.triage_id
                              )}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {record.visit_date} {record.visit_time}
                                  </span>
                                  {record.flags && (
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                                      record.flags.includes('CRITICAL') ? 'bg-red-500' : 'bg-yellow-500'
                                    }`}>
                                      Flagged
                                    </span>
                                  )}
                                  {record.updated_by ? (
                                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                      Reviewed
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-700">
                                      Pending
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 text-xs text-gray-500">{record.symptoms}</div>
                              </div>
                              <svg
                                className={`h-5 w-5 text-gray-400 transition-transform ${
                                  individualExpanded === record.triage_id ? 'rotate-180' : ''
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>

                            {individualExpanded === record.triage_id && (
                              <div className="mt-3 border-t pt-3">
                                <div className="grid gap-3 text-sm sm:grid-cols-2">
                                  <div>
                                    <span className="text-xs font-medium uppercase text-gray-400">Vital Signs</span>
                                    <p className="mt-0.5 text-gray-700">{record.vital_signs}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium uppercase text-gray-400">Symptoms</span>
                                    <p className="mt-0.5 text-gray-700">{record.symptoms}</p>
                                  </div>
                                </div>

                                {/* Individual vitals */}
                                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                                  {record.temperature != null && (
                                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                                      <div className="text-xs text-gray-400">Temp</div>
                                      <div className="text-sm font-bold text-gray-800">{record.temperature}&deg;C</div>
                                    </div>
                                  )}
                                  {record.heart_rate != null && (
                                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                                      <div className="text-xs text-gray-400">HR</div>
                                      <div className="text-sm font-bold text-gray-800">{record.heart_rate} bpm</div>
                                    </div>
                                  )}
                                  {record.spo2 != null && (
                                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                                      <div className="text-xs text-gray-400">SpO2</div>
                                      <div className="text-sm font-bold text-gray-800">{record.spo2}%</div>
                                    </div>
                                  )}
                                  {record.bp_systolic != null && record.bp_diastolic != null && (
                                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                                      <div className="text-xs text-gray-400">BP</div>
                                      <div className="text-sm font-bold text-gray-800">{record.bp_systolic}/{record.bp_diastolic}</div>
                                    </div>
                                  )}
                                  {record.respiratory_rate != null && (
                                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                                      <div className="text-xs text-gray-400">RR</div>
                                      <div className="text-sm font-bold text-gray-800">{record.respiratory_rate}/min</div>
                                    </div>
                                  )}
                                  {record.weight != null && (
                                    <div className="rounded-lg bg-gray-50 p-2 text-center">
                                      <div className="text-xs text-gray-400">Weight</div>
                                      <div className="text-sm font-bold text-gray-800">{record.weight} kg</div>
                                    </div>
                                  )}
                                </div>

                                {record.flags && (
                                  <div className="mt-2 flex flex-wrap gap-1">
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

                                {record.final_diagnosis && (
                                  <div className="mt-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700">
                                    <strong>Diagnosis:</strong> {record.final_diagnosis}
                                    {record.treatment_actions && (
                                      <> &middot; <strong>Treatment:</strong> {record.treatment_actions}</>
                                    )}
                                  </div>
                                )}

                                {record.disposition && (
                                  <div className="mt-2 text-xs text-gray-600">
                                    <strong>Disposition:</strong> {dispositionLabel(record.disposition)}
                                  </div>
                                )}

                                {record.doctor_notes && (
                                  <div className="mt-2 text-xs text-gray-600">
                                    <strong>Notes:</strong> {record.doctor_notes}
                                  </div>
                                )}

                                {record.updated_by && (
                                  <div className="mt-1 text-[10px] text-gray-400">
                                    Reviewed by {record.updated_by} {record.updated_at ? `on ${record.updated_at}` : ''}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : individualMember ? (
                      <div className="py-12 text-center text-gray-500">No visit records found.</div>
                    ) : (
                      <div className="py-12 text-center text-gray-500">
                        Enter a 9-digit Institution ID to view individual history.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
