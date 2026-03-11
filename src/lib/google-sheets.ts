import { google, sheets_v4 } from 'googleapis';
import { JWT } from 'google-auth-library';
import type { MemberRole } from '@/types';

export interface MemberData {
  institution_id: string;
  member_name: string;
  role: MemberRole;
  allergies: string;
}

export interface TriageData {
  triage_id: string;
  institution_id: string;
  role: MemberRole;
  time: string;
  date: string;
  symptoms: string;
  vital_signs: string;
}

export interface ReportData {
  report_id: string;
  institution_id: string;
  triage_id: string;
}

let sheetsInstance: sheets_v4.Sheets | null = null;

function getSheets(): sheets_v4.Sheets {
  if (sheetsInstance) return sheetsInstance;

  const sheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !email || !key) {
    throw new Error(
      'Missing Google Sheets environment variables. Please set GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY.'
    );
  }

  const auth = new JWT({
    email,
    key: key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsInstance = google.sheets({ version: 'v4', auth });
  return sheetsInstance;
}

function getSheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error('GOOGLE_SHEET_ID is not set');
  return id;
}

export async function appendMemberData(data: MemberData) {
  const sheets = getSheets();
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: 'Member Information Sheet!A:D',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[data.institution_id, data.member_name, data.role, data.allergies]],
    },
  });
  return response.data;
}

export async function appendTriageData(data: TriageData) {
  const sheets = getSheets();
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: 'Triage Information Sheet!A:G',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        data.triage_id,
        data.institution_id,
        data.role,
        data.time,
        data.date,
        data.symptoms,
        data.vital_signs,
      ]],
    },
  });
  return response.data;
}

export async function appendReportData(data: ReportData) {
  const sheets = getSheets();
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: 'Report!A:C',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[data.report_id, data.institution_id, data.triage_id]],
    },
  });
  return response.data;
}

export async function findMemberInSheets(id: string): Promise<MemberData | null> {
  const sheets = getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: 'Member Information Sheet!A:D',
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) return null;

  const member = rows.find((row) => row[0] === id);
  if (member) {
    return {
      institution_id: member[0],
      member_name: member[1] || '',
      role: (member[2] || 'student') as MemberRole,
      allergies: member[3] || '',
    };
  }
  return null;
}
