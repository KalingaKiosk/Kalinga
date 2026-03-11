import { neon } from '@neondatabase/serverless';
import type { MemberRole } from '@/types';

function getSQL() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

// ─── Schema Setup ───────────────────────────────────────────────

export async function initializeDatabase() {
  const sql = getSQL();

  // Check if old students table exists and migrate
  const oldTable = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables WHERE table_name = 'students'
    ) as exists
  `;

  if (oldTable[0].exists) {
    // Migration: rename students → members
    await sql`ALTER TABLE triage_records DROP CONSTRAINT IF EXISTS triage_records_lrn_number_fkey`;
    await sql`ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_lrn_number_fkey`;
    await sql`ALTER TABLE students RENAME TO members`;
    await sql`ALTER TABLE members RENAME COLUMN lrn_number TO institution_id`;
    await sql`ALTER TABLE members RENAME COLUMN student_name TO member_name`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS role VARCHAR(10) NOT NULL DEFAULT 'student'`;
    await sql`ALTER TABLE triage_records RENAME COLUMN lrn_number TO institution_id`;
    await sql`ALTER TABLE triage_records ADD COLUMN IF NOT EXISTS role VARCHAR(10) NOT NULL DEFAULT 'student'`;
    await sql`ALTER TABLE reports RENAME COLUMN lrn_number TO institution_id`;
    // Re-add constraints
    await sql`ALTER TABLE triage_records ADD CONSTRAINT triage_records_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES members(institution_id)`;
    await sql`ALTER TABLE reports ADD CONSTRAINT reports_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES members(institution_id)`;
  } else {
    // Fresh install
    await sql`
      CREATE TABLE IF NOT EXISTS members (
        institution_id VARCHAR(9) PRIMARY KEY,
        member_name VARCHAR(255) NOT NULL,
        role VARCHAR(10) NOT NULL DEFAULT 'student',
        allergies TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS triage_records (
        triage_id VARCHAR(20) PRIMARY KEY,
        institution_id VARCHAR(9) NOT NULL REFERENCES members(institution_id),
        role VARCHAR(10) NOT NULL DEFAULT 'student',
        visit_time VARCHAR(20) NOT NULL,
        visit_date VARCHAR(20) NOT NULL,
        symptoms TEXT NOT NULL,
        vital_signs TEXT NOT NULL,
        temperature DECIMAL(4,1),
        spo2 DECIMAL(5,1),
        heart_rate INTEGER,
        bp_systolic INTEGER,
        bp_diastolic INTEGER,
        respiratory_rate INTEGER,
        weight DECIMAL(5,1),
        flags TEXT DEFAULT '',
        final_diagnosis TEXT,
        treatment_actions TEXT,
        disposition VARCHAR(30),
        doctor_notes TEXT,
        updated_by VARCHAR(50),
        updated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS reports (
        report_id VARCHAR(20) PRIMARY KEY,
        institution_id VARCHAR(9) NOT NULL REFERENCES members(institution_id),
        triage_id VARCHAR(20) NOT NULL REFERENCES triage_records(triage_id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
  }

  // Add new columns to triage_records if they don't exist (handles partial migration)
  await sql`ALTER TABLE triage_records ADD COLUMN IF NOT EXISTS final_diagnosis TEXT`;
  await sql`ALTER TABLE triage_records ADD COLUMN IF NOT EXISTS treatment_actions TEXT`;
  await sql`ALTER TABLE triage_records ADD COLUMN IF NOT EXISTS disposition VARCHAR(30)`;
  await sql`ALTER TABLE triage_records ADD COLUMN IF NOT EXISTS doctor_notes TEXT`;
  await sql`ALTER TABLE triage_records ADD COLUMN IF NOT EXISTS updated_by VARCHAR(50)`;
  await sql`ALTER TABLE triage_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP`;
  await sql`ALTER TABLE triage_records ADD COLUMN IF NOT EXISTS role VARCHAR(10) NOT NULL DEFAULT 'student'`;

  // Clinic settings table
  await sql`
    CREATE TABLE IF NOT EXISTS clinic_settings (
      setting_key VARCHAR(50) PRIMARY KEY,
      setting_value TEXT NOT NULL
    )
  `;

  // Default PIN: 1234 (SHA-256 hash)
  // crypto.createHash('sha256').update('1234').digest('hex')
  await sql`
    INSERT INTO clinic_settings (setting_key, setting_value)
    VALUES ('clinic_pin', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4')
    ON CONFLICT (setting_key) DO NOTHING
  `;

  return { success: true };
}

// ─── Member Operations ──────────────────────────────────────────

export async function findMemberById(id: string) {
  const sql = getSQL();
  const rows = await sql`
    SELECT institution_id, member_name, role, allergies
    FROM members WHERE institution_id = ${id}
  `;
  return rows.length > 0 ? rows[0] : null;
}

export async function upsertMember(id: string, name: string, role: MemberRole, allergies: string) {
  const sql = getSQL();
  await sql`
    INSERT INTO members (institution_id, member_name, role, allergies)
    VALUES (${id}, ${name}, ${role}, ${allergies})
    ON CONFLICT (institution_id) DO UPDATE SET
      member_name = EXCLUDED.member_name,
      role = EXCLUDED.role,
      allergies = EXCLUDED.allergies
  `;
}

export async function updateMember(id: string, data: { member_name?: string; allergies?: string }) {
  const sql = getSQL();
  if (data.member_name !== undefined && data.allergies !== undefined) {
    await sql`UPDATE members SET member_name = ${data.member_name}, allergies = ${data.allergies} WHERE institution_id = ${id}`;
  } else if (data.member_name !== undefined) {
    await sql`UPDATE members SET member_name = ${data.member_name} WHERE institution_id = ${id}`;
  } else if (data.allergies !== undefined) {
    await sql`UPDATE members SET allergies = ${data.allergies} WHERE institution_id = ${id}`;
  }
}

// ─── Triage Operations ──────────────────────────────────────────

export async function insertTriageRecord(data: {
  triageId: string;
  institutionId: string;
  role: MemberRole;
  time: string;
  date: string;
  symptoms: string;
  vitalSigns: string;
  temperature?: number;
  spo2?: number;
  heartRate?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  respiratoryRate?: number;
  weight?: number;
  flags: string;
}) {
  const sql = getSQL();
  await sql`
    INSERT INTO triage_records (
      triage_id, institution_id, role, visit_time, visit_date, symptoms, vital_signs,
      temperature, spo2, heart_rate, bp_systolic, bp_diastolic,
      respiratory_rate, weight, flags
    ) VALUES (
      ${data.triageId}, ${data.institutionId}, ${data.role}, ${data.time}, ${data.date},
      ${data.symptoms}, ${data.vitalSigns},
      ${data.temperature ?? null}, ${data.spo2 ?? null},
      ${data.heartRate ?? null}, ${data.bpSystolic ?? null},
      ${data.bpDiastolic ?? null}, ${data.respiratoryRate ?? null},
      ${data.weight ?? null}, ${data.flags}
    )
  `;
}

export async function updateTriageRecord(triageId: string, data: {
  final_diagnosis?: string;
  treatment_actions?: string;
  disposition?: string;
  doctor_notes?: string;
  updated_by?: string;
  // Also allow editing vitals/symptoms
  symptoms?: string;
  vital_signs?: string;
  temperature?: number | null;
  spo2?: number | null;
  heart_rate?: number | null;
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  respiratory_rate?: number | null;
  weight?: number | null;
  flags?: string;
}) {
  const sql = getSQL();
  await sql`
    UPDATE triage_records SET
      final_diagnosis = COALESCE(${data.final_diagnosis ?? null}, final_diagnosis),
      treatment_actions = COALESCE(${data.treatment_actions ?? null}, treatment_actions),
      disposition = COALESCE(${data.disposition ?? null}, disposition),
      doctor_notes = COALESCE(${data.doctor_notes ?? null}, doctor_notes),
      updated_by = COALESCE(${data.updated_by ?? null}, updated_by),
      symptoms = COALESCE(${data.symptoms ?? null}, symptoms),
      vital_signs = COALESCE(${data.vital_signs ?? null}, vital_signs),
      temperature = COALESCE(${data.temperature !== undefined ? data.temperature : null}, temperature),
      spo2 = COALESCE(${data.spo2 !== undefined ? data.spo2 : null}, spo2),
      heart_rate = COALESCE(${data.heart_rate !== undefined ? data.heart_rate : null}, heart_rate),
      bp_systolic = COALESCE(${data.bp_systolic !== undefined ? data.bp_systolic : null}, bp_systolic),
      bp_diastolic = COALESCE(${data.bp_diastolic !== undefined ? data.bp_diastolic : null}, bp_diastolic),
      respiratory_rate = COALESCE(${data.respiratory_rate !== undefined ? data.respiratory_rate : null}, respiratory_rate),
      weight = COALESCE(${data.weight !== undefined ? data.weight : null}, weight),
      flags = COALESCE(${data.flags ?? null}, flags),
      updated_at = NOW()
    WHERE triage_id = ${triageId}
  `;
}

export async function getTriageRecord(triageId: string) {
  const sql = getSQL();
  const rows = await sql`
    SELECT t.*, m.member_name, m.allergies
    FROM triage_records t
    JOIN members m ON t.institution_id = m.institution_id
    WHERE t.triage_id = ${triageId}
  `;
  return rows.length > 0 ? rows[0] : null;
}

export async function insertReport(reportId: string, institutionId: string, triageId: string) {
  const sql = getSQL();
  await sql`
    INSERT INTO reports (report_id, institution_id, triage_id)
    VALUES (${reportId}, ${institutionId}, ${triageId})
  `;
}

// ─── Dashboard Queries ──────────────────────────────────────────

export async function getRecentTriageRecords(limit = 50) {
  const sql = getSQL();
  return sql`
    SELECT t.*, m.member_name, m.allergies
    FROM triage_records t
    JOIN members m ON t.institution_id = m.institution_id
    ORDER BY t.created_at DESC
    LIMIT ${limit}
  `;
}

export async function getFlaggedRecords(limit = 50) {
  const sql = getSQL();
  return sql`
    SELECT t.*, m.member_name, m.allergies
    FROM triage_records t
    JOIN members m ON t.institution_id = m.institution_id
    WHERE t.flags != '' AND t.flags IS NOT NULL
    ORDER BY t.created_at DESC
    LIMIT ${limit}
  `;
}

export async function getMemberHistory(id: string) {
  const sql = getSQL();
  return sql`
    SELECT t.*, m.member_name, m.allergies
    FROM triage_records t
    JOIN members m ON t.institution_id = m.institution_id
    WHERE t.institution_id = ${id}
    ORDER BY t.created_at DESC
  `;
}

export async function getDashboardStats() {
  const sql = getSQL();
  const totalMembers = await sql`SELECT COUNT(*) as count FROM members`;
  const totalVisits = await sql`SELECT COUNT(*) as count FROM triage_records`;
  const todayVisits = await sql`SELECT COUNT(*) as count FROM triage_records WHERE visit_date = ${new Date().toLocaleDateString('en-PH')}`;
  const flaggedToday = await sql`SELECT COUNT(*) as count FROM triage_records WHERE visit_date = ${new Date().toLocaleDateString('en-PH')} AND flags != '' AND flags IS NOT NULL`;

  return {
    totalMembers: Number(totalMembers[0].count),
    totalVisits: Number(totalVisits[0].count),
    todayVisits: Number(todayVisits[0].count),
    flaggedToday: Number(flaggedToday[0].count),
  };
}

// ─── Report Queries ─────────────────────────────────────────────

export async function getDailyReport(date: string, role?: string) {
  const sql = getSQL();
  if (role && role !== 'all') {
    return sql`
      SELECT t.*, m.member_name, m.allergies
      FROM triage_records t
      JOIN members m ON t.institution_id = m.institution_id
      WHERE t.visit_date = ${date} AND t.role = ${role}
      ORDER BY t.created_at DESC
    `;
  }
  return sql`
    SELECT t.*, m.member_name, m.allergies
    FROM triage_records t
    JOIN members m ON t.institution_id = m.institution_id
    WHERE t.visit_date = ${date}
    ORDER BY t.created_at DESC
  `;
}

export async function getMonthlyReport(yearMonth: string, role?: string) {
  const sql = getSQL();
  // yearMonth format: "YYYY-MM" -> match visit_date that starts with the corresponding month
  // visit_date is stored in en-PH locale format like "3/11/2026"
  // We need to extract month and year from visit_date
  const [year, month] = yearMonth.split('-');
  const monthNum = parseInt(month);

  if (role && role !== 'all') {
    return sql`
      SELECT t.*, m.member_name, m.allergies
      FROM triage_records t
      JOIN members m ON t.institution_id = m.institution_id
      WHERE t.role = ${role}
        AND t.visit_date LIKE ${`${monthNum}/%/${year}`}
      ORDER BY t.created_at DESC
    `;
  }
  return sql`
    SELECT t.*, m.member_name, m.allergies
    FROM triage_records t
    JOIN members m ON t.institution_id = m.institution_id
    WHERE t.visit_date LIKE ${`${monthNum}/%/${year}`}
    ORDER BY t.created_at DESC
  `;
}

export async function getMonthlyStats(yearMonth: string, role?: string) {
  const sql = getSQL();
  const [year, month] = yearMonth.split('-');
  const monthNum = parseInt(month);
  const pattern = `${monthNum}/%/${year}`;

  const baseFilter = role && role !== 'all';

  const totalVisits = baseFilter
    ? await sql`SELECT COUNT(*) as count FROM triage_records WHERE visit_date LIKE ${pattern} AND role = ${role}`
    : await sql`SELECT COUNT(*) as count FROM triage_records WHERE visit_date LIKE ${pattern}`;

  const flaggedCount = baseFilter
    ? await sql`SELECT COUNT(*) as count FROM triage_records WHERE visit_date LIKE ${pattern} AND role = ${role} AND flags != '' AND flags IS NOT NULL`
    : await sql`SELECT COUNT(*) as count FROM triage_records WHERE visit_date LIKE ${pattern} AND flags != '' AND flags IS NOT NULL`;

  const dispositionBreakdown = baseFilter
    ? await sql`SELECT disposition, COUNT(*) as count FROM triage_records WHERE visit_date LIKE ${pattern} AND role = ${role} AND disposition IS NOT NULL GROUP BY disposition`
    : await sql`SELECT disposition, COUNT(*) as count FROM triage_records WHERE visit_date LIKE ${pattern} AND disposition IS NOT NULL GROUP BY disposition`;

  // Top symptoms
  const allRecords = baseFilter
    ? await sql`SELECT symptoms FROM triage_records WHERE visit_date LIKE ${pattern} AND role = ${role}`
    : await sql`SELECT symptoms FROM triage_records WHERE visit_date LIKE ${pattern}`;

  const symptomCounts: Record<string, number> = {};
  for (const row of allRecords) {
    if (row.symptoms) {
      const syms = (row.symptoms as string).split(', ');
      for (const s of syms) {
        const trimmed = s.trim();
        if (trimmed) symptomCounts[trimmed] = (symptomCounts[trimmed] || 0) + 1;
      }
    }
  }
  const topSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return {
    totalVisits: Number(totalVisits[0].count),
    flaggedCount: Number(flaggedCount[0].count),
    dispositionBreakdown: dispositionBreakdown.map(r => ({ disposition: r.disposition, count: Number(r.count) })),
    topSymptoms,
  };
}

// ─── Clinic Settings (PIN) ──────────────────────────────────────

export async function getClinicPin(): Promise<string | null> {
  const sql = getSQL();
  const rows = await sql`SELECT setting_value FROM clinic_settings WHERE setting_key = 'clinic_pin'`;
  return rows.length > 0 ? (rows[0].setting_value as string) : null;
}

export async function setClinicPin(hashedPin: string) {
  const sql = getSQL();
  await sql`
    INSERT INTO clinic_settings (setting_key, setting_value) VALUES ('clinic_pin', ${hashedPin})
    ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value
  `;
}
