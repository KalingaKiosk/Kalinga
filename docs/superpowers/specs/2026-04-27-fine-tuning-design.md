# KALINGA Fine-Tuning Revisions — Design Spec

**Date:** 2026-04-27
**Status:** Draft → pending user review
**Builds on:** `2026-03-11-kiosk-revisions-design.md` (already implemented)

## Overview

Five targeted fine-tuning items requested for the KALINGA Health Kiosk System:

1. **Improve Body Model** — replace placeholder colored circles with a proper anatomical SVG with usable hotspots
2. **Buttons for Arms and Legs** — expose arms and legs as clickable body regions (data already exists in `symptomTree.ts`)
3. **Staff Dashboard SOAP method** — restructure `MedicalAssessment.tsx` into Subjective / Objective / Assessment / Plan sections
4. **Employee ID = 7 digits** — Institution ID is 9 digits for students but **7 digits for employees**; finish role-aware ID validation across the codebase
5. **Pending Diagnosis tab** — already exists as "Pending Review"; polish UX (sorting, badge counter, days-pending)

This spec describes **changes** to the existing app. It does NOT introduce new dependencies (no Drizzle, no shadcn, no Better-Auth).

## What's NOT changing

- DB driver (`@neondatabase/serverless` raw SQL — keep)
- Auth (PIN + JWT in sessionStorage — keep)
- Schema fundamentals (`members.institution_id VARCHAR(9)` accommodates 7 chars fine — keep, no migration needed)
- Kiosk flow steps (splash → privacy → role → ID → vitals → symptoms → allergies → success — keep)
- Reports page, Google Sheets sync (keep as-is)

---

## 1. Improve Body Model + Arms/Legs Buttons

These two items are coupled — they're the same component change.

### Current state

`src/components/SymptomsSelection.tsx` (lines 13-18, 109-141):

```tsx
const bodyRegions = [
  { id: 'head', cx: 150, cy: 45 },
  { id: 'torso', cx: 150, cy: 150 },
  { id: 'limbs', cx: 100, cy: 250 },        // ← BROKEN: 'limbs' is not a node in symptomTree
  { id: 'genitourinary', cx: 150, cy: 240 },
];
```

The current SVG renders 4 colored red circles overlaid on a stick figure. Clicking `limbs` calls `handleBodyClick('limbs')` which does `symptomTree.find(n => n.id === 'limbs')` — returns `undefined` and silently does nothing. **The arms and legs branches in `symptomTree` are unreachable from the body view** (only via the LIST view).

### Target state

Replace the SVG block with an anatomical figure that has **6 clickable regions** matching the top-level `symptomTree` nodes:

| Region | symptomTree id | Visual location |
|---|---|---|
| Head | `head` | top |
| Torso | `torso` | center body (chest + abdomen + back) |
| Arms | `arms` | left + right arm shapes (BOTH map to same `arms` node) |
| Legs | `legs` | left + right leg shapes (BOTH map to same `legs` node) |
| Genitourinary | `genitourinary` | pelvis area |

`arms` and `legs` get **two visual targets each** (left/right side of body) but both targets route to the same symptom subtree — current data model has no L/R distinction, and adding it would mean schema changes the user didn't ask for. YAGNI.

### Visual design

- Front-view SVG silhouette (~300×450 viewBox), gender-neutral, semi-realistic proportions
- Each region is a `<path>` shape filled with a base color (e.g., `#c7d2fe`) and a hover/active highlight
- On hover: stroke + slight scale, cursor pointer, region name tooltip
- On click: `handleBodyClick(regionId)` switches to LIST view at that subtree (existing behavior)
- Selected regions (where the user has chosen at least one symptom) get a colored overlay tint as a visual cue
- Mobile-friendly: each region's effective hit target ≥ 44×44 px (use `<path>` with `pointer-events: visiblePainted` and ensure adequate area)

### Region SVG paths (concrete)

To keep the file manageable, region paths live in a dedicated module:

**New file:** `src/components/body-regions.ts`
```ts
export interface BodyRegion {
  id: string;
  label: string;
  path: string; // SVG path d attribute
  labelPos: { x: number; y: number };
}

export const BODY_REGIONS: BodyRegion[] = [
  { id: 'head', label: 'Head', path: 'M150,30 a32,32 0 1,0 0.01,0 Z', labelPos: { x: 150, y: 65 } },
  { id: 'torso', label: 'Torso', path: 'M118,80 L182,80 L186,200 L114,200 Z', labelPos: { x: 150, y: 145 } },
  { id: 'arms', label: 'Arms (L)', path: 'M88,90 L114,90 L120,210 L94,220 Z', labelPos: { x: 100, y: 155 } },
  { id: 'arms', label: 'Arms (R)', path: 'M186,90 L212,90 L206,220 L180,210 Z', labelPos: { x: 200, y: 155 } },
  { id: 'genitourinary', label: 'Pelvis', path: 'M125,200 L175,200 L175,220 L125,220 Z', labelPos: { x: 150, y: 213 } },
  { id: 'legs', label: 'Legs (L)', path: 'M118,225 L148,225 L142,400 L112,400 Z', labelPos: { x: 130, y: 320 } },
  { id: 'legs', label: 'Legs (R)', path: 'M152,225 L182,225 L188,400 L158,400 Z', labelPos: { x: 170, y: 320 } },
];
```

(Path coordinates are intentionally simple polygons — capstone-grade anatomy, not medical-grade. The implementation plan can refine these.)

### File changes

| File | Change |
|---|---|
| `src/components/body-regions.ts` | **CREATE** — region paths constant |
| `src/components/SymptomsSelection.tsx` | **MODIFY** — replace `bodyRegions` array (lines 13-18) and SVG block (lines 109-141) with new region rendering using `BODY_REGIONS` |
| `src/lib/symptomTree.ts` | No change — `arms` and `legs` already exist |

---

## 2. Staff Dashboard SOAP Method

### Current state

`src/components/MedicalAssessment.tsx` exposes 4 flat fields:
- Final Diagnosis (textarea)
- Treatment / Actions Taken (textarea)
- Disposition (dropdown, role-filtered)
- Doctor's / Nurse's Notes (textarea)

These are all "doctor inputs" — there's no Subjective/Objective context shown.

### Target state

Restructure `MedicalAssessment.tsx` into **4 SOAP sections**:

#### S — Subjective (read-only, sourced from kiosk capture)
- Member name, sex, age, role badge
- **Allergies** (`members.allergies`)
- **Symptoms** (parsed from `triage_records.symptoms`)
- **Visit date/time** + visit reason

#### O — Objective (read-only, sourced from kiosk capture)
- Vital signs grid: Temperature, SpO₂, Heart Rate, BP, Respiratory Rate, Weight (from `triage_records.*`)
- Range badges: green (normal) / yellow (warning) / red (critical) based on `flags` field
- Visual indicator for any present `flags`

#### A — Assessment (editable)
- **Final Diagnosis** (textarea, was top-level field)
- *(Differentials and ICD-10 are out of scope — current data model doesn't have them and user didn't ask)*

#### P — Plan (editable)
- **Treatment / Actions Taken** (textarea, was top-level field)
- **Disposition** (dropdown, role-filtered, was top-level field)
- **Doctor's / Nurse's Notes** (textarea, was top-level field)
- **Updated By** selector (Doctor / Nurse) — preserved at top of P section

### Visual layout

Tabs (S | O | A | P) along the top of the assessment panel. Default opens to the first incomplete section: if Assessment is empty, open A; otherwise open P. S and O tabs are read-only views with badges showing data is sourced from the kiosk.

A "Save Assessment" button persists A + P fields via the existing `POST /api/triage/update` endpoint (no API changes needed — endpoint already accepts these fields).

### File changes

| File | Change |
|---|---|
| `src/components/MedicalAssessment.tsx` | **MODIFY** — add tab UI, split fields into S/O/A/P sections, accept extra props for kiosk-captured data |
| `src/app/dashboard/page.tsx` | **MODIFY** — pass extra props (member, vitals, symptoms, flags) to `<MedicalAssessment>` (the data is already loaded in `record`) |
| API/DB | No changes needed |

### Backwards compatibility

- The dashboard already loads all needed fields in `record` (member_name, symptoms, vital_signs, temperature, spo2, etc.); just propagate them as props.
- API contract unchanged — same fields are sent on save.

---

## 3. Employee ID = 7 Digits (role-aware ID validation)

### Current state — the partial work

`src/components/InstitutionIDCapture.tsx`:
- **Line 192**: `const maxLimit = role === 'employee' ? 7 : 9;` ← role-aware input limit, present
- **Line 95**: OCR matches `/\b\d{9}\b/` ← only 9-digit detection
- **Line 169**: `if (idValue.length !== 9) return;` ← hardcoded 9 (in OCR completion handler)
- **Line 203**: `if (!institutionId || institutionId.length !== 9) { setError('...9-digit...'); }` ← hardcoded 9 (in submit)
- **Line 589**: `disabled={institutionId.length !== 9 || ...}` ← hardcoded 9 (submit button)

`src/app/api/member/lookup/route.ts:7`:
```ts
if (!id || id.length !== 9 || !/^\d{9}$/.test(id)) { ... }
```

`src/app/dashboard/page.tsx`:
- **Line 171, 296, 302**: hardcoded `length === 9` / `length !== 9` for search input

`src/app/reports/page.tsx`:
- **Line 159, 637**: hardcoded `length !== 9` for individual lookup

### Target state — single source of truth

Create a tiny shared validator and use it everywhere.

**New file:** `src/lib/id-validation.ts`
```ts
import type { MemberRole } from '@/types';

export function expectedIdLength(role: MemberRole): 7 | 9 {
  return role === 'employee' ? 7 : 9;
}

export function isValidId(id: string, role: MemberRole): boolean {
  const len = expectedIdLength(role);
  return id.length === len && /^\d+$/.test(id);
}

// For places where role is not yet known (search, OCR detection)
export function isValidIdAnyRole(id: string): boolean {
  return /^\d{7}$/.test(id) || /^\d{9}$/.test(id);
}

export function inferRoleFromId(id: string): MemberRole | null {
  if (id.length === 7 && /^\d+$/.test(id)) return 'employee';
  if (id.length === 9 && /^\d+$/.test(id)) return 'student';
  return null;
}
```

### File changes

| File | Change |
|---|---|
| `src/lib/id-validation.ts` | **CREATE** — `expectedIdLength`, `isValidId`, `isValidIdAnyRole`, `inferRoleFromId` |
| `src/components/InstitutionIDCapture.tsx` | **MODIFY** — replace lines 95, 169, 203, 589 with role-aware checks; OCR pattern uses `\b\d{7}\b\|\b\d{9}\b` |
| `src/app/api/member/lookup/route.ts` | **MODIFY** — replace line 7 with `isValidIdAnyRole(id)` (server doesn't always know role); optionally accept `role` query param to enforce stricter validation |
| `src/app/dashboard/page.tsx` | **MODIFY** — search input accepts 7 OR 9 digits; submit enabled when valid for either; show role badge on result |
| `src/app/reports/page.tsx` | **MODIFY** — same as dashboard; individual lookup accepts 7 OR 9 |
| `src/app/api/triage/submit/route.ts` | **NO CHANGE** — backend doesn't validate length, just non-empty (defense in depth optional but not required) |

### Database

`institution_id VARCHAR(9)` — already accommodates 7-digit values without schema change. **No migration required.**

### OCR pattern

Update line 95 of `InstitutionIDCapture.tsx`:
```ts
// Before
const plainMatch = text.match(/\b\d{9}\b/);

// After — match 9 first (preferred), then 7
const plainMatch = text.match(/\b\d{9}\b/) ?? text.match(/\b\d{7}\b/);
```

When `role === 'employee'`, prefer 7-digit match first:
```ts
const patterns = role === 'employee' ? [/\b\d{7}\b/, /\b\d{9}\b/] : [/\b\d{9}\b/, /\b\d{7}\b/];
const plainMatch = patterns.map(p => text.match(p)).find(m => m !== null) ?? null;
```

---

## 4. Pending Diagnosis Tab — Polish

### Current state

The `pending` tab already exists in `src/app/dashboard/page.tsx:271-285` and is wired to `/api/dashboard?view=pending` → `getPendingReviewRecords()` (`src/lib/db.ts:334`). Records are filtered by `WHERE updated_by IS NULL`.

### Target state — small polish

Three small improvements:

#### 4.1 Sort by oldest pending first
`getPendingReviewRecords()` currently sorts `ORDER BY t.created_at DESC` (newest first). Change to **ASC** so the longest-waiting patient appears at top — clinically meaningful.

#### 4.2 Days-pending badge per record
On each record card in the pending tab, show how many days/hours the record has been awaiting assessment.

```tsx
// In dashboard/page.tsx, render only when tab === 'pending':
{tab === 'pending' && (
  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
    Pending {daysSince(record.created_at)}
  </span>
)}
```

`daysSince(timestamp)` returns "2h", "3d", "1w" etc. — implement as small util in `src/lib/format.ts`.

#### 4.3 Pending count badge in tab nav
Show a count next to the "Pending Review" tab label so staff see at a glance how much work is queued.

Add to `getDashboardStats()` (`src/lib/db.ts:369`) a `pendingCount` field, then render in the tab button:

```tsx
{t === 'pending' && (
  <>Pending Review {stats?.pendingCount ? <span className="ml-1 rounded-full bg-orange-500 px-1.5 text-[10px] text-white">{stats.pendingCount}</span> : null}</>
)}
```

### File changes

| File | Change |
|---|---|
| `src/lib/db.ts` | **MODIFY** — `getPendingReviewRecords` ORDER BY ASC; add `pendingCount` to `getDashboardStats` return |
| `src/lib/format.ts` | **CREATE** — `daysSince(ts)` formatter |
| `src/app/dashboard/page.tsx` | **MODIFY** — render pending badge on records, count badge on tab |
| `src/app/api/dashboard/route.ts` | No change (stats route already returns whatever `getDashboardStats` exports) |

---

## 5. Acceptance Criteria

| # | Item | Acceptance test |
|---|---|---|
| 1 | Body Model | On Symptoms screen BODY view, can click 6 distinct regions: head, torso, arms (L or R), legs (L or R), pelvis. Each opens the correct subtree from `symptomTree`. The "limbs" placeholder region is gone. |
| 2 | Arms / Legs Buttons | Clicking left arm OR right arm opens `arms` subtree (Upper Arm / Elbow / Forearm/Wrist / Hand/Fingers). Clicking left leg OR right leg opens `legs` subtree (Hip / Thigh / Knee / Shin/Calf / Ankle/Foot). |
| 3 | SOAP Dashboard | When staff expands a record's "Edit / Add Assessment", they see 4 tabs labeled S, O, A, P. S shows symptoms+allergies+demographics read-only. O shows vital signs read-only with flag colors. A has Final Diagnosis editable. P has Treatment, Disposition, Notes, and Doctor/Nurse selector editable. Save button persists A+P fields. |
| 4 | 7-Digit Employee ID | When role=Employee on kiosk, ID input accepts 7 digits and submit button enables at 7. When role=Student, still requires 9. OCR detects 7-digit IDs preferentially when employee role is selected. Dashboard search accepts both 7 and 9. Reports individual search accepts both. Lookup API accepts both. |
| 5 | Pending Tab Polish | Pending tab sorts oldest-first. Each pending card shows a "Pending Xd"/"Pending Xh" badge. Tab label shows numeric count badge when count > 0. |

## 6. Out of Scope

- New body model views (back view, gender selection)
- Body marker persistence per encounter (the existing app stores symptoms as a flat list, not anatomical markers — adding markers would require a new table)
- Severity per symptom (not in current data model)
- ICD-10 codes (not in current model)
- Differential diagnosis field (not in current model)
- Switching to Drizzle / shadcn / Better-Auth
- Schema migrations beyond what's already in `db.ts:initializeDatabase()`
- Body model accessibility audit (basic keyboard nav OK, full WCAG out of scope)

## 7. Implementation Phasing (preview for plan)

Each phase is independently testable and shippable.

1. **Body model + arms/legs buttons** — visual change, easy to verify, no DB. Start here.
2. **Role-aware ID validation** — touches many files but mechanical; centralizes via `id-validation.ts`.
3. **SOAP restructure of MedicalAssessment** — UI restructure only, same API.
4. **Pending tab polish** — small enhancements (sort order + 2 badges).

## 8. Open Questions

None as of 2026-04-27. All decisions confirmed by user approval to "do the recommended."

---

## Quick Reference — Key Files

| Area | File |
|---|---|
| Body model SVG | `src/components/SymptomsSelection.tsx` |
| Symptom tree | `src/lib/symptomTree.ts` |
| Medical Assessment form | `src/components/MedicalAssessment.tsx` |
| Dashboard tabs | `src/app/dashboard/page.tsx` |
| ID Capture (kiosk) | `src/components/InstitutionIDCapture.tsx` |
| DB queries | `src/lib/db.ts` |
| Member lookup API | `src/app/api/member/lookup/route.ts` |
| Triage update API | `src/app/api/triage/update/route.ts` |
| Reports page | `src/app/reports/page.tsx` |
