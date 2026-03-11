# KALINGA Kiosk System Revisions — Design Spec

**Date:** 2026-03-11
**Status:** Approved

## Overview

Four major revisions to the KALINGA Health Kiosk System:
1. Replace LRN with Institution ID (9-digit) + role selector
2. Add doctor/health worker input section
3. Enable editable patient records (PIN-protected)
4. Add summary reports (daily, monthly, individual)

---

## 1. Institution ID (Replaces LRN)

### Changes
- Replace all 12-digit LRN references with **9-digit Institution ID**
- Add **role selector** ("Student" or "Employee") in kiosk flow
- Update OCR to detect 9-digit numbers instead of 12 (with stricter pattern matching — require isolated 9-digit sequence, not part of a larger number)
- Rename `lrn_number` → `institution_id` across entire codebase
- Rename `students` table → `members` table
- Update `PrivacyNotice.tsx` — replace "LRN" with "Institution ID", "Student" with "Member"
- Update `SplashScreen.tsx` — generalize "student" language to include employees
- Update `SubmissionSuccess.tsx` — replace "school health office" with "health office"

### Database
```sql
-- Migration: rename students → members, lrn_number → institution_id
ALTER TABLE students RENAME TO members;
ALTER TABLE members RENAME COLUMN lrn_number TO institution_id;
ALTER TABLE members ALTER COLUMN institution_id TYPE VARCHAR(9);
ALTER TABLE members ADD COLUMN role VARCHAR(10) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'employee'));
ALTER TABLE members RENAME COLUMN student_name TO member_name;

-- Update foreign keys in triage_records
ALTER TABLE triage_records RENAME COLUMN lrn_number TO institution_id;
ALTER TABLE triage_records ALTER COLUMN institution_id TYPE VARCHAR(9);
ALTER TABLE triage_records ADD COLUMN role VARCHAR(10) NOT NULL DEFAULT 'student';

-- Update foreign keys in reports
ALTER TABLE reports RENAME COLUMN lrn_number TO institution_id;
ALTER TABLE reports ALTER COLUMN institution_id TYPE VARCHAR(9);
```

### Fresh Schema (for new installations)
```sql
CREATE TABLE IF NOT EXISTS members (
  institution_id VARCHAR(9) PRIMARY KEY,
  member_name VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('student', 'employee')),
  allergies TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Kiosk Flow (Updated)
1. Splash Screen
2. Privacy Notice
3. **Role Selection (Student / Employee)** — NEW STEP
4. Institution ID Capture (OCR scan or manual 9-digit entry)
5. Vital Signs
6. Symptoms Selection
7. Allergy Confirmation
8. Submission Success

The selected role is stored in the kiosk data state (`KioskData.role`) and propagated through all subsequent steps and API calls.

### API Changes
- `GET /api/student/lookup?lrn=...` → `GET /api/member/lookup?id=...&role=...`
- `POST /api/triage/submit` — payload uses `institution_id` + `role` instead of `lrn_number`

---

## 2. Doctor/Health Worker Input Section

### New Fields on Triage Records
| Field | Type | Description |
|-------|------|-------------|
| `final_diagnosis` | TEXT | Doctor's final diagnosis |
| `treatment_actions` | TEXT | Treatment or actions taken |
| `disposition` | VARCHAR(30) | See values below |
| `doctor_notes` | TEXT | Free-form doctor/nurse notes |
| `updated_by` | VARCHAR(50) | Label: "Doctor" or "Nurse" |
| `updated_at` | TIMESTAMP | When medical assessment was last updated |

### Disposition Values
- `returned_to_class` — for students
- `returned_to_work` — for employees
- `sent_home` — for both
- `referred_to_hospital` — for both

The disposition dropdown filters options by the member's role: students see "Returned to Class", employees see "Returned to Work". Both roles see "Sent Home" and "Referred to Hospital".

### Database Migration
```sql
ALTER TABLE triage_records ADD COLUMN final_diagnosis TEXT;
ALTER TABLE triage_records ADD COLUMN treatment_actions TEXT;
ALTER TABLE triage_records ADD COLUMN disposition VARCHAR(30);
ALTER TABLE triage_records ADD COLUMN doctor_notes TEXT;
ALTER TABLE triage_records ADD COLUMN updated_by VARCHAR(50);
ALTER TABLE triage_records ADD COLUMN updated_at TIMESTAMP;
```

### UI: Medical Assessment Panel
- Appears on dashboard when viewing/expanding a triage record
- PIN-protected (must unlock before editing)
- Fields: Final Diagnosis, Treatment/Actions, Disposition (role-filtered dropdown), Doctor's Notes
- Shows who last updated and when
- Visual badge: "Reviewed" (green) if `updated_by` is set, "Pending Review" (yellow) otherwise

---

## 3. Editable Patient Records

### PIN Authentication
- Clinic PIN stored in `clinic_settings` table (hashed with SHA-256)
- Default PIN: `1234` (set during DB setup, admin should change it)
- `POST /api/auth/verify-pin` verifies PIN and returns a signed JWT token (2-hour expiry)
- Token stored in `sessionStorage` on the client
- All protected API endpoints (`PUT /api/triage/update`, `PUT /api/member/update`) validate the JWT server-side
- `POST /api/auth/change-pin` — allows changing the PIN (requires current PIN)

### Database
```sql
CREATE TABLE IF NOT EXISTS clinic_settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value TEXT NOT NULL
);
-- Initial PIN insert during setup (SHA-256 hash of '1234')
INSERT INTO clinic_settings (setting_key, setting_value)
VALUES ('clinic_pin', '<sha256_hash_of_1234>')
ON CONFLICT (setting_key) DO NOTHING;
```

### Editable Fields (when PIN-unlocked)
- Vital signs (temperature, SpO2, heart rate, BP, respiratory rate, weight)
- Symptoms
- Allergies (on member record)
- All doctor/health worker fields (diagnosis, treatment, disposition, notes)

### API Endpoints
- `POST /api/auth/verify-pin` — verifies clinic PIN, returns JWT (2hr expiry)
- `POST /api/auth/change-pin` — changes PIN (requires current PIN + new PIN)
- `POST /api/triage/update` — updates triage record fields (JWT required in Authorization header)
- `POST /api/member/update` — updates member allergies/name (JWT required)

Note: Using `POST` instead of `PUT` to match the existing codebase convention.

### Validation Rules
- `disposition` must be one of the valid enum values
- `temperature`, `spo2`, `heart_rate`, etc. must be within reasonable ranges (same validation as kiosk entry)
- `institution_id` must be a valid 9-digit string
- JWT token must be valid and not expired

### Edit Tracking
- `updated_at` and `updated_by` fields on triage records track the last edit
- Visual badge on dashboard: "Reviewed" (green) vs "Pending Review" (yellow)

---

## 4. Summary Reports

### New Page: `/reports`

Reports page is PIN-protected (same JWT auth as edit mode).

#### Daily Summary
- Select a date via date picker
- Shows: total visits, flagged cases count, disposition breakdown (pie/counts)
- List of all visits for that day with key info
- Filterable by role (student/employee/all) — server-side via query parameter

#### Monthly Summary
- Select a month/year
- Shows: total visits, visits per day (simple HTML/CSS bar chart — no external library), top 10 symptoms
- Flagged cases count, disposition breakdown
- Filterable by role — `role` query parameter, `all` returns unfiltered results, omitting is same as `all`

#### Individual History
- Search by Institution ID
- Shows: member info (name, role, allergies), complete visit history
- Each visit expandable to show full details (vitals, symptoms, diagnosis, treatment, disposition)

### API
- `GET /api/reports?type=daily&date=YYYY-MM-DD&role=all` — JWT required
- `GET /api/reports?type=monthly&month=YYYY-MM&role=all` — JWT required
- `GET /api/reports?type=individual&id=XXXXXXXXX` — JWT required

### Print Support
- CSS `@media print` styles for all report views
- Clean, formatted output suitable for printing
- Hide navigation and action buttons in print mode

---

## Database Schema (Complete — Fresh Install)

```sql
-- Members (formerly students)
CREATE TABLE IF NOT EXISTS members (
  institution_id VARCHAR(9) PRIMARY KEY,
  member_name VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('student', 'employee')),
  allergies TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Triage Records (updated)
CREATE TABLE IF NOT EXISTS triage_records (
  triage_id VARCHAR(20) PRIMARY KEY,
  institution_id VARCHAR(9) NOT NULL REFERENCES members(institution_id),
  role VARCHAR(10) NOT NULL,
  visit_time VARCHAR(20) NOT NULL,
  visit_date VARCHAR(20) NOT NULL,
  symptoms TEXT,
  vital_signs TEXT,
  temperature DECIMAL(4,1),
  spo2 DECIMAL(5,1),
  heart_rate INTEGER,
  bp_systolic INTEGER,
  bp_diastolic INTEGER,
  respiratory_rate INTEGER,
  weight DECIMAL(5,1),
  flags TEXT,
  final_diagnosis TEXT,
  treatment_actions TEXT,
  disposition VARCHAR(30),
  doctor_notes TEXT,
  updated_by VARCHAR(50),
  updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  report_id VARCHAR(20) PRIMARY KEY,
  institution_id VARCHAR(9) NOT NULL REFERENCES members(institution_id),
  triage_id VARCHAR(20) NOT NULL REFERENCES triage_records(triage_id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clinic Settings
CREATE TABLE IF NOT EXISTS clinic_settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value TEXT NOT NULL
);
```

---

## Database Migration Strategy

The `initializeDatabase()` function in `db.ts` will:
1. Check if the old `students` table exists
2. If yes: run migration SQL (rename tables/columns, add new columns)
3. If no: run fresh `CREATE TABLE IF NOT EXISTS` statements
4. Either path ends with the same final schema

This ensures both existing deployments and fresh installs work correctly.

---

## Google Sheets Sync Updates

- Rename "Student Information Sheet" → "Member Information Sheet"
  - Columns: Institution ID | Member Name | Role | Allergies (range `A:D`)
- Update "Triage Information Sheet"
  - Add columns: Final Diagnosis | Treatment | Disposition | Doctor Notes | Updated By
  - Updated range to include new columns
- Update all sheet sync functions accordingly

---

## TypeScript Types

Add shared interfaces in `src/types/index.ts`:

```typescript
interface Member {
  institution_id: string;
  member_name: string;
  role: 'student' | 'employee';
  allergies: string;
  created_at: string;
}

interface TriageRecord {
  triage_id: string;
  institution_id: string;
  role: string;
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
  disposition: Disposition | null;
  doctor_notes: string | null;
  updated_by: string | null;
  updated_at: string | null;
  created_at: string;
}

type Disposition = 'returned_to_class' | 'returned_to_work' | 'sent_home' | 'referred_to_hospital';

type MemberRole = 'student' | 'employee';

interface KioskData {
  role: MemberRole;
  institution_id: string;
  member_name: string;
  // ... existing fields
}
```

---

## File Changes Summary

### Modified Files
- `src/components/LRNCapture.tsx` → rename to `InstitutionIDCapture.tsx`
- `src/components/PrivacyNotice.tsx` — update LRN/student references to Institution ID/member
- `src/components/SplashScreen.tsx` — generalize student-only language
- `src/components/SubmissionSuccess.tsx` — update LRN and "school" references
- `src/components/VitalSigns.tsx` — no major changes
- `src/components/SymptomsSelection.tsx` — no major changes
- `src/components/AllergyConfirmation.tsx` — no major changes
- `src/app/page.tsx` — add role selection step, update flow, add KioskData.role
- `src/app/dashboard/page.tsx` — add medical assessment panel, PIN gate, edit mode
- `src/lib/db.ts` — migration logic + full rewrite of schema + queries
- `src/lib/google-sheets.ts` — update sheet names, column ranges, and mappings
- `src/app/api/triage/submit/route.ts` — update to use institution_id + role
- `src/app/api/dashboard/route.ts` — update queries for new schema
- `src/app/api/db/setup/route.ts` — update schema initialization with migration

### New Files
- `src/types/index.ts` — shared TypeScript interfaces
- `src/components/RoleSelection.tsx` — Student/Employee selector
- `src/components/MedicalAssessment.tsx` — Doctor input form
- `src/components/PinGate.tsx` — PIN entry modal
- `src/app/reports/page.tsx` — Reports page (daily, monthly, individual)
- `src/app/api/reports/route.ts` — Reports API
- `src/app/api/auth/verify-pin/route.ts` — PIN verification, returns JWT
- `src/app/api/auth/change-pin/route.ts` — PIN change endpoint
- `src/app/api/triage/update/route.ts` — Update triage record (JWT-protected)
- `src/app/api/member/lookup/route.ts` — Member lookup (replaces student/lookup)
- `src/app/api/member/update/route.ts` — Update member record (JWT-protected)

### Deleted Files
- `src/app/api/student/lookup/route.ts` — replaced by `api/member/lookup`
