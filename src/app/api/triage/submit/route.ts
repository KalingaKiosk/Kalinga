import { NextRequest, NextResponse } from 'next/server';
import { upsertMember, insertTriageRecord, insertReport } from '@/lib/db';
import { evaluateVitalSigns, flagsToString } from '@/lib/vital-flags';
import {
  appendMemberData,
  appendTriageData,
  appendReportData,
  findMemberInSheets,
} from '@/lib/google-sheets';
import type { MemberRole } from '@/types';

function generateTriageId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `T-${date}-${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { institutionId, role, name, allergies, symptoms, vitalSigns } = body;

    if (!institutionId || !name || !symptoms || !vitalSigns || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const flags = evaluateVitalSigns(vitalSigns);
    const flagsStr = flagsToString(flags);

    const triageId = generateTriageId();
    const reportId = `R-${triageId.slice(2)}`;
    const now = new Date();
    const time = now.toLocaleTimeString('en-PH', { hour12: true });
    const date = now.toLocaleDateString('en-PH');

    const vitalLabels: Record<string, string> = {
      temperature: 'Temp', spo2: 'SpO2', heartRate: 'HR',
      bloodPressureSystolic: 'BP Sys', bloodPressureDiastolic: 'BP Dia',
      respiratoryRate: 'RR', weight: 'Weight',
    };
    const vitalUnits: Record<string, string> = {
      temperature: '°C', spo2: '%', heartRate: 'bpm',
      bloodPressureSystolic: 'mmHg', bloodPressureDiastolic: 'mmHg',
      respiratoryRate: '/min', weight: 'kg',
    };
    const vitalSignsStr = Object.entries(vitalSigns)
      .filter(([, value]) => value !== '')
      .map(([key, value]) => `${vitalLabels[key] || key}: ${value}${vitalUnits[key] || ''}`)
      .join(', ');

    const symptomsStr = Array.isArray(symptoms) ? symptoms.join(', ') : symptoms;

    await upsertMember(institutionId, name, role as MemberRole, allergies || '');
    await insertTriageRecord({
      triageId,
      institutionId,
      role: role as MemberRole,
      time,
      date,
      symptoms: symptomsStr,
      vitalSigns: vitalSignsStr,
      temperature: vitalSigns.temperature ? parseFloat(vitalSigns.temperature) : undefined,
      spo2: vitalSigns.spo2 ? parseFloat(vitalSigns.spo2) : undefined,
      heartRate: vitalSigns.heartRate ? parseInt(vitalSigns.heartRate) : undefined,
      bpSystolic: vitalSigns.bloodPressureSystolic ? parseInt(vitalSigns.bloodPressureSystolic) : undefined,
      bpDiastolic: vitalSigns.bloodPressureDiastolic ? parseInt(vitalSigns.bloodPressureDiastolic) : undefined,
      respiratoryRate: vitalSigns.respiratoryRate ? parseInt(vitalSigns.respiratoryRate) : undefined,
      weight: vitalSigns.weight ? parseFloat(vitalSigns.weight) : undefined,
      flags: flagsStr,
    });
    await insertReport(reportId, institutionId, triageId);

    try {
      const existingInSheets = await findMemberInSheets(institutionId);
      if (!existingInSheets) {
        await appendMemberData({
          institution_id: institutionId,
          member_name: name,
          role: role as MemberRole,
          allergies: allergies || '',
        });
      }
      await appendTriageData({
        triage_id: triageId,
        institution_id: institutionId,
        role: role as MemberRole,
        time,
        date,
        symptoms: symptomsStr,
        vital_signs: vitalSignsStr + (flagsStr ? ` | FLAGS: ${flagsStr}` : ''),
      });
      await appendReportData({
        report_id: reportId,
        institution_id: institutionId,
        triage_id: triageId,
      });
    } catch (sheetsError) {
      console.warn('Google Sheets sync skipped:', sheetsError);
    }

    return NextResponse.json({ success: true, triageId, reportId, flags });
  } catch (error) {
    console.error('Triage submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit triage data. Please try again.' },
      { status: 500 }
    );
  }
}
