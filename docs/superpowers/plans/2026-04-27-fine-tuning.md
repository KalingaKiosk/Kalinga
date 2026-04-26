# KALINGA Fine-Tuning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 4 fine-tuning phases from `2026-04-27-fine-tuning-design.md` — anatomical body model, SOAP-structured medical assessment, role-aware (7 vs 9 digit) ID validation, and Pending Review tab polish.

**Architecture:** Pure modifications to the existing Next.js 16 + raw Neon SQL kiosk app. No new runtime dependencies (one dev dep: Vitest for unit tests). No DB schema migrations. Each phase is independently shippable and demoable.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 · `@neondatabase/serverless` (raw SQL) · custom PIN+JWT auth · `tesseract.js` OCR. Adding: Vitest 2.x as devDependency.

---

## File Structure

### New files
```
src/components/body-regions.ts          ← clickable region path data
src/lib/id-validation.ts                ← role-aware ID validators (single source of truth)
src/lib/format.ts                       ← daysSince formatter
src/lib/__tests__/id-validation.test.ts ← unit tests
src/lib/__tests__/format.test.ts        ← unit tests
vitest.config.ts                        ← test runner config
```

### Modified files
```
src/components/SymptomsSelection.tsx    ← Phase 1 (body model)
src/components/MedicalAssessment.tsx    ← Phase 3 (SOAP restructure)
src/components/InstitutionIDCapture.tsx ← Phase 2 (role-aware ID)
src/app/api/member/lookup/route.ts      ← Phase 2
src/app/dashboard/page.tsx              ← Phases 2, 3, 4
src/app/reports/page.tsx                ← Phase 2
src/lib/db.ts                           ← Phase 4 (sort + pendingCount)
package.json                            ← add Vitest devDep + script
```

### Untouched
- `src/lib/symptomTree.ts` (already has arms+legs)
- All other API routes
- Schema in `db.ts:initializeDatabase()`
- `picamera-server/`, `googleapis` integration

---

# Phase 1 — Body Model + Arms/Legs Buttons

Goal: Replace the broken 4-circle body model with an anatomical SVG that exposes 6 distinct symptom-tree regions (head, torso, arms, legs, pelvis) as clickable shapes. After this phase, clicking arms or legs in BODY view opens the correct subtree.

## Task 1.1: Create body-regions module

**Files:**
- Create: `src/components/body-regions.ts`

- [ ] **Step 1: Create the file with region definitions**

```ts
// src/components/body-regions.ts
//
// Anatomical region shapes for the symptoms body view.
// `targetId` matches a top-level node id from src/lib/symptomTree.ts.
// Multiple shapes can share the same targetId (e.g. left arm + right arm
// both route to the `arms` subtree).

export interface BodyRegion {
  key: string;          // unique React key
  targetId: string;     // symptomTree top-level node id
  label: string;        // visible label / tooltip
  path: string;         // SVG path d-attribute
  labelPos: { x: number; y: number };
}

export const BODY_REGIONS: BodyRegion[] = [
  {
    key: 'head',
    targetId: 'head',
    label: 'Head',
    path: 'M150,12 a30,34 0 1,0 0.01,0 Z',
    labelPos: { x: 150, y: 50 },
  },
  {
    key: 'torso',
    targetId: 'torso',
    label: 'Torso',
    path: 'M120,80 L180,80 Q188,82 188,90 L184,200 Q184,206 178,206 L122,206 Q116,206 116,200 L112,90 Q112,82 120,80 Z',
    labelPos: { x: 150, y: 145 },
  },
  {
    key: 'arms-left',
    targetId: 'arms',
    label: 'Arms',
    path: 'M88,90 L110,90 L116,206 Q116,212 110,212 L92,212 Q86,212 84,206 Z',
    labelPos: { x: 100, y: 155 },
  },
  {
    key: 'arms-right',
    targetId: 'arms',
    label: 'Arms',
    path: 'M190,90 L212,90 L216,206 Q216,212 210,212 L192,212 Q186,212 184,206 Z',
    labelPos: { x: 200, y: 155 },
  },
  {
    key: 'pelvis',
    targetId: 'genitourinary',
    label: 'Pelvis',
    path: 'M122,206 L178,206 L176,232 L124,232 Z',
    labelPos: { x: 150, y: 222 },
  },
  {
    key: 'legs-left',
    targetId: 'legs',
    label: 'Legs',
    path: 'M124,234 L150,234 L146,400 Q146,406 140,406 L122,406 Q116,406 116,400 Z',
    labelPos: { x: 132, y: 320 },
  },
  {
    key: 'legs-right',
    targetId: 'legs',
    label: 'Legs',
    path: 'M150,234 L176,234 L184,400 Q184,406 178,406 L160,406 Q154,406 154,400 Z',
    labelPos: { x: 168, y: 320 },
  },
];
```

- [ ] **Step 2: Verify file compiles**

Run: `npx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 3: Quick stage**

```bash
git add src/components/body-regions.ts
```

## Task 1.2: Replace the body SVG in SymptomsSelection.tsx

**Files:**
- Modify: `src/components/SymptomsSelection.tsx:1-141`

- [ ] **Step 1: Update imports (add BODY_REGIONS)**

In `src/components/SymptomsSelection.tsx`, change the imports block at the top:

```tsx
'use client';

import { useState } from 'react';
import { symptomTree, SymptomNode } from '@/lib/symptomTree';
import { BODY_REGIONS } from './body-regions';
```

- [ ] **Step 2: Delete the old `bodyRegions` array (lines 13-18)**

Remove this block entirely:
```tsx
const bodyRegions = [
  { id: 'head', cx: 150, cy: 45 },
  { id: 'torso', cx: 150, cy: 150 },
  { id: 'limbs', cx: 100, cy: 250 },
  { id: 'genitourinary', cx: 150, cy: 240 },
];
```

- [ ] **Step 3: Replace the SVG block (current lines ~109-141) with the anatomical body**

Locate the `{view === 'body' && ( ... )}` block and replace its contents with:

```tsx
{view === 'body' && (
  <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center">
    <p className="mb-3 text-xs text-gray-500 text-center">
      Tap a body region to select symptoms
    </p>
    <svg viewBox="0 0 300 420" width="280" className="select-none">
      {BODY_REGIONS.map((region) => {
        const hasSelection = selected.some((s) =>
          isSymptomInRegion(s, region.targetId, symptomTree),
        );
        return (
          <g
            key={region.key}
            className="cursor-pointer group"
            onClick={() => handleBodyClick(region.targetId)}
          >
            <path
              d={region.path}
              fill={hasSelection ? '#818cf8' : '#c7d2fe'}
              stroke="#4f46e5"
              strokeWidth="1.5"
              className="transition-colors group-hover:fill-indigo-400"
            />
            <text
              x={region.labelPos.x}
              y={region.labelPos.y}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#1e1b4b"
              pointerEvents="none"
            >
              {region.label}
            </text>
          </g>
        );
      })}
    </svg>
  </div>
)}
```

- [ ] **Step 4: Add the `isSymptomInRegion` helper near the top of the file (after imports, before the component)**

```tsx
function isSymptomInRegion(
  symptomLabel: string,
  topLevelId: string,
  tree: SymptomNode[],
): boolean {
  const root = tree.find((n) => n.id === topLevelId);
  if (!root) return false;
  const stack: SymptomNode[] = [root];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.label === symptomLabel) return true;
    if (node.children) stack.push(...node.children);
  }
  return false;
}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: PASS or only pre-existing warnings unrelated to these files.

## Task 1.3: Smoke test the body model in the browser

**Files:** none

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: Server starts at `http://localhost:3000`. Wait for "Ready" output.

- [ ] **Step 2: Walk through the kiosk flow to the symptoms screen**

Open `http://localhost:3000` in a browser. Click START → accept Privacy → pick a Role → enter any test ID (skip the lookup) → enter test name + sex → submit vitals (any values) → land on the SYMPTOMS screen with BODY view selected by default.

- [ ] **Step 3: Verify all 6 region targets respond**

Click each in turn:
- **Head** → opens Eye/Ear/Nose/Mouth/Forehead list
- **Torso** → opens Chest/Shoulder/Abdomen/Back list
- **Arms (either side)** → opens Upper Arm/Elbow/Forearm/Hand list
- **Pelvis** → opens Genitourinary symptom list
- **Legs (either side)** → opens Hip/Thigh/Knee/Shin/Ankle list

If any click does nothing, check that `region.targetId` matches an `id` in `src/lib/symptomTree.ts`.

- [ ] **Step 4: Verify selection feedback**

Switch to LIST view, select e.g. "Knee Pain" under Legs, switch back to BODY. The Legs shape should now be filled with the darker tint (`#818cf8`).

- [ ] **Step 5: Stop dev server (Ctrl+C in the terminal running it)**

## Task 1.4: Commit Phase 1

- [ ] **Step 1: Stage and commit**

```bash
git add src/components/body-regions.ts src/components/SymptomsSelection.tsx
git commit -m "Replace body model with anatomical regions (head/torso/arms/legs/pelvis)

Removes the broken 'limbs' hotspot that didn't map to any symptom-tree
node. Exposes Arms and Legs as clickable regions per the fine-tuning
spec. Selected regions get a tinted fill so users can see at a glance
which body areas they have symptoms for."
```

- [ ] **Step 2: Verify clean status**

Run: `git status`
Expected: "nothing to commit, working tree clean".

---

# Phase 2 — Role-Aware ID Validation (7 digits for employees, 9 for students)

Goal: Centralize ID validation in one module (`src/lib/id-validation.ts`) and replace 8 hardcoded `length === 9` / `length !== 9` checks across the codebase. After this phase: kiosk accepts 7-digit IDs when role=Employee, dashboard search and reports lookup accept either 7 or 9, OCR detects both lengths.

## Task 2.1: Add Vitest for unit tests

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Vitest as a dev dependency**

Run: `npm install -D vitest@^2 @vitest/ui@^2`
Expected: dependencies install; package-lock.json updates.

- [ ] **Step 2: Add `test` script to package.json**

In `package.json`, add to the `scripts` block:
```json
"test": "vitest run",
"test:watch": "vitest"
```

After the change, the scripts block should read:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest"
},
```

- [ ] **Step 3: Create Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/__tests__/*.test.ts'],
  },
});
```

- [ ] **Step 4: Verify test runner starts**

Run: `npm test`
Expected: "No test files found, exiting with code 1" (we haven't written tests yet — this confirms the runner works).

## Task 2.2: TDD — id-validation module

**Files:**
- Create: `src/lib/__tests__/id-validation.test.ts`
- Create: `src/lib/id-validation.ts`

- [ ] **Step 1: Write the failing tests first**

Create `src/lib/__tests__/id-validation.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  expectedIdLength,
  isValidId,
  isValidIdAnyRole,
  inferRoleFromId,
} from '../id-validation';

describe('expectedIdLength', () => {
  it('returns 7 for employees', () => {
    expect(expectedIdLength('employee')).toBe(7);
  });
  it('returns 9 for students', () => {
    expect(expectedIdLength('student')).toBe(9);
  });
});

describe('isValidId', () => {
  it('accepts 9 digits for student', () => {
    expect(isValidId('123456789', 'student')).toBe(true);
  });
  it('accepts 7 digits for employee', () => {
    expect(isValidId('1234567', 'employee')).toBe(true);
  });
  it('rejects 7 digits for student', () => {
    expect(isValidId('1234567', 'student')).toBe(false);
  });
  it('rejects 9 digits for employee', () => {
    expect(isValidId('123456789', 'employee')).toBe(false);
  });
  it('rejects non-digits', () => {
    expect(isValidId('12345abc', 'employee')).toBe(false);
    expect(isValidId('12345-789', 'student')).toBe(false);
  });
  it('rejects empty', () => {
    expect(isValidId('', 'student')).toBe(false);
    expect(isValidId('', 'employee')).toBe(false);
  });
});

describe('isValidIdAnyRole', () => {
  it('accepts 7 digits', () => {
    expect(isValidIdAnyRole('1234567')).toBe(true);
  });
  it('accepts 9 digits', () => {
    expect(isValidIdAnyRole('123456789')).toBe(true);
  });
  it('rejects 8 digits', () => {
    expect(isValidIdAnyRole('12345678')).toBe(false);
  });
  it('rejects letters', () => {
    expect(isValidIdAnyRole('abcdefghi')).toBe(false);
  });
});

describe('inferRoleFromId', () => {
  it('infers employee from 7 digits', () => {
    expect(inferRoleFromId('1234567')).toBe('employee');
  });
  it('infers student from 9 digits', () => {
    expect(inferRoleFromId('123456789')).toBe('student');
  });
  it('returns null for invalid lengths', () => {
    expect(inferRoleFromId('12345')).toBeNull();
    expect(inferRoleFromId('1234567890')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test`
Expected: FAIL — "Cannot find module '../id-validation'" or similar.

- [ ] **Step 3: Implement the module**

Create `src/lib/id-validation.ts`:
```ts
import type { MemberRole } from '@/types';

export function expectedIdLength(role: MemberRole): 7 | 9 {
  return role === 'employee' ? 7 : 9;
}

export function isValidId(id: string, role: MemberRole): boolean {
  const len = expectedIdLength(role);
  return id.length === len && /^\d+$/.test(id);
}

export function isValidIdAnyRole(id: string): boolean {
  return /^\d{7}$/.test(id) || /^\d{9}$/.test(id);
}

export function inferRoleFromId(id: string): MemberRole | null {
  if (/^\d{7}$/.test(id)) return 'employee';
  if (/^\d{9}$/.test(id)) return 'student';
  return null;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `npm test`
Expected: PASS — all 14 assertions green.

## Task 2.3: Update InstitutionIDCapture.tsx

**Files:**
- Modify: `src/components/InstitutionIDCapture.tsx`

- [ ] **Step 1: Add the import**

At the top of the file (after the existing imports), add:
```ts
import { expectedIdLength, isValidId } from '@/lib/id-validation';
```

- [ ] **Step 2: Update `extractID` to detect 7 OR 9 digits, role-preferred (replaces lines ~87-97)**

Replace:
```ts
// Extract ID from OCR text — supports LRN format (XX-XXXX-XXX) and plain 9 digits
const extractID = (text: string): string | null => {
  // Try LRN format first: XX-XXXX-XXX
  const lrnMatch = text.match(/\d{2}-\d{4}-\d{3}/);
  if (lrnMatch) {
    return lrnMatch[0].replace(/-/g, '');
  }
  // Fall back to plain 9 digits
  const plainMatch = text.match(/\b\d{9}\b/);
  return plainMatch ? plainMatch[0] : null;
};
```

With:
```ts
// Extract ID from OCR text — supports LRN format (XX-XXXX-XXX), plain 9 digits (students),
// and plain 7 digits (employees). Role determines which length is preferred.
const extractID = (text: string): string | null => {
  // LRN format always takes priority (formatted with dashes)
  const lrnMatch = text.match(/\d{2}-\d{4}-\d{3}/);
  if (lrnMatch) {
    return lrnMatch[0].replace(/-/g, '');
  }
  // Try the role-preferred length first, then the other
  const patterns = role === 'employee'
    ? [/\b\d{7}\b/, /\b\d{9}\b/]
    : [/\b\d{9}\b/, /\b\d{7}\b/];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return null;
};
```

- [ ] **Step 3: Update `lookupMember` to use role-aware length (line ~169)**

Replace:
```ts
const lookupMember = async (idValue: string) => {
  if (idValue.length !== 9) return;
```

With:
```ts
const lookupMember = async (idValue: string) => {
  if (!isValidId(idValue, role)) return;
```

- [ ] **Step 4: Update `handleIDChange` slice limit (lines 191-200)**

Replace:
```ts
const handleIDChange = (value: string) => {
  const maxLimit = role === 'employee' ? 7 : 9; // Allows employees to input 7 digits only.
  const digits = value.replace(/\D/g, '').slice(0, 9);
  setInstitutionId(digits);
  setMemberFound(null);
  setNotFound(false);
  if (digits.length === maxLimit) {
    lookupMember(digits);
  }
};
```

With:
```ts
const handleIDChange = (value: string) => {
  const maxLimit = expectedIdLength(role);
  const digits = value.replace(/\D/g, '').slice(0, maxLimit);
  setInstitutionId(digits);
  setMemberFound(null);
  setNotFound(false);
  if (digits.length === maxLimit) {
    lookupMember(digits);
  }
};
```

- [ ] **Step 5: Update `handleSubmit` validation (lines 202-205)**

Replace:
```ts
const handleSubmit = () => {
  if (!institutionId || institutionId.length !== 9) {
    setError('Please enter a valid 9-digit Institution ID.');
    return;
  }
```

With:
```ts
const handleSubmit = () => {
  const expectedLen = expectedIdLength(role);
  if (!institutionId || !isValidId(institutionId, role)) {
    setError(`Please enter a valid ${expectedLen}-digit ${role === 'employee' ? 'Employee' : 'Institution'} ID.`);
    return;
  }
```

- [ ] **Step 6: Update the submit button `disabled` prop (line ~589)**

Replace:
```tsx
disabled={institutionId.length !== 9 || !name.trim() || !sex}
```

With:
```tsx
disabled={!isValidId(institutionId, role) || !name.trim() || !sex}
```

- [ ] **Step 7: Update placeholder text and labels (around lines 295-296, 373, 383, 389)**

Find the static text strings that say "9-digit" and update them to be role-aware. Specifically:

Line ~296 (in the choose-mode card description):
Replace `Type the 9-digit Institution ID / LRN number` with:
```tsx
{`Type the ${expectedIdLength(role)}-digit ${role === 'employee' ? 'Employee' : 'Institution'} ID`}
```

Line ~373 (toggle-back link):
Replace `Enter Institution ID manually instead` with the same role-aware string.

Line ~383 (label):
Replace `LRN / Institution ID` with:
```tsx
{role === 'employee' ? 'Employee ID' : 'LRN / Institution ID'}
```

Line ~389 (input placeholder):
Replace `Enter 9-digit LRN or Institution ID` with:
```tsx
{`Enter ${expectedIdLength(role)}-digit ${role === 'employee' ? 'Employee' : 'Institution'} ID`}
```

- [ ] **Step 8: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

## Task 2.4: Update member lookup API

**Files:**
- Modify: `src/app/api/member/lookup/route.ts`

- [ ] **Step 1: Replace the validation block**

Replace the entire file with:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { findMemberById } from '@/lib/db';
import { isValidIdAnyRole } from '@/lib/id-validation';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');

  if (!id || !isValidIdAnyRole(id)) {
    return NextResponse.json(
      { error: 'Invalid ID. Must be a 7-digit (employee) or 9-digit (student) number.' },
      { status: 400 },
    );
  }

  try {
    const member = await findMemberById(id);
    if (member) {
      return NextResponse.json({ found: true, member });
    }
    return NextResponse.json({ found: false, member: null });
  } catch (error) {
    console.error('Member lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to look up member. Please try again.' },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

## Task 2.5: Update dashboard search input

**Files:**
- Modify: `src/app/dashboard/page.tsx:170-174, 290-309`

- [ ] **Step 1: Add the import at the top of the file**

```ts
import { isValidIdAnyRole } from '@/lib/id-validation';
```

- [ ] **Step 2: Update `handleSearch` (around line 170)**

Replace:
```tsx
const handleSearch = () => {
  if (searchId.length === 9) {
    fetchRecords('history', searchId);
  }
};
```

With:
```tsx
const handleSearch = () => {
  if (isValidIdAnyRole(searchId)) {
    fetchRecords('history', searchId);
  }
};
```

- [ ] **Step 3: Update the search input slice (line ~296)**

Replace:
```tsx
onChange={(e) => setSearchId(e.target.value.replace(/\D/g, '').slice(0, 9))}
placeholder="Enter 9-digit Institution ID"
```

With:
```tsx
onChange={(e) => setSearchId(e.target.value.replace(/\D/g, '').slice(0, 9))}
placeholder="Enter 7-digit Employee ID or 9-digit Institution ID"
```

(Slice stays at 9 — that's the max possible length.)

- [ ] **Step 4: Update the Search button `disabled` (line ~302)**

Replace:
```tsx
disabled={searchId.length !== 9}
```

With:
```tsx
disabled={!isValidIdAnyRole(searchId)}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

## Task 2.6: Update reports individual lookup

**Files:**
- Modify: `src/app/reports/page.tsx:159, 637`

- [ ] **Step 1: Add the import**

```ts
import { isValidIdAnyRole } from '@/lib/id-validation';
```

- [ ] **Step 2: Update the lookup guard (line ~159)**

Replace:
```ts
if (!authToken || individualId.length !== 9) return;
```

With:
```ts
if (!authToken || !isValidIdAnyRole(individualId)) return;
```

- [ ] **Step 3: Update the search button (line ~637)**

Replace:
```tsx
disabled={individualId.length !== 9}
```

With:
```tsx
disabled={!isValidIdAnyRole(individualId)}
```

- [ ] **Step 4: Locate the input that sets `individualId` and update its placeholder if it says "9-digit"**

Search the file for `individualId` setter (`setIndividualId`) and update the input's `placeholder` to "Enter 7-digit Employee ID or 9-digit Institution ID".

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

## Task 2.7: Smoke test role-aware ID flow

- [ ] **Step 1: Run the unit tests once more**

Run: `npm test`
Expected: PASS — 14 assertions.

- [ ] **Step 2: Start dev server**

Run: `npm run dev`

- [ ] **Step 3: Test EMPLOYEE flow (7 digits)**

Open `http://localhost:3000` → splash → privacy → choose **Employee** role → on the ID screen, enter **7 digits** (e.g. `1234567`). Expected: input caps at 7, lookup fires automatically at 7, submit becomes enabled at 7. Try entering 8 digits — should be capped at 7.

- [ ] **Step 4: Test STUDENT flow (9 digits)**

Restart kiosk → choose **Student** role → enter **9 digits**. Expected: input caps at 9 (employee 7-digit limit doesn't apply), lookup fires at 9, submit enabled at 9.

- [ ] **Step 5: Test dashboard search**

Open `/dashboard` → click "Patient History" tab → enter a 7-digit ID → click Search. Expected: search runs (button enabled at 7). Repeat with 9 digits — also works.

- [ ] **Step 6: Test reports individual lookup**

Open `/reports` (PIN-unlock if needed) → individual section → enter 7 or 9 digits → search. Expected: works for both.

- [ ] **Step 7: Stop dev server**

## Task 2.8: Commit Phase 2

- [ ] **Step 1: Stage and commit**

```bash
git add package.json package-lock.json vitest.config.ts \
  src/lib/id-validation.ts src/lib/__tests__/id-validation.test.ts \
  src/components/InstitutionIDCapture.tsx \
  src/app/api/member/lookup/route.ts \
  src/app/dashboard/page.tsx \
  src/app/reports/page.tsx
git commit -m "Centralize role-aware ID validation (7 employee / 9 student)

Adds src/lib/id-validation.ts as the single source of truth and
removes 8 hardcoded length checks across kiosk, dashboard, reports,
and lookup API. Adds Vitest with 14 unit tests for the validators."
```

- [ ] **Step 2: Verify clean status**

Run: `git status`
Expected: clean.

---

# Phase 3 — SOAP Restructure of Medical Assessment

Goal: Restructure `MedicalAssessment.tsx` into 4 tabs (S | O | A | P). S and O are read-only views of kiosk-captured data (symptoms, vitals, demographics). A and P remain editable using the existing fields and the existing `POST /api/triage/update` endpoint.

## Task 3.1: Extend MedicalAssessment props with kiosk-captured data

**Files:**
- Modify: `src/components/MedicalAssessment.tsx:1-17`

- [ ] **Step 1: Update the props interface**

Replace the existing `MedicalAssessmentProps` interface with:
```tsx
interface MedicalAssessmentProps {
  triageId: string;
  role: string;
  // Kiosk-captured data (read-only, shown in S and O tabs)
  member: {
    name: string;
    sex: string;
    age: number | null;
    allergies: string;
  };
  visit: {
    date: string;
    time: string;
  };
  symptoms: string;       // comma-separated symptom labels
  vitals: {
    temperature: number | null;
    spo2: number | null;
    heart_rate: number | null;
    bp_systolic: number | null;
    bp_diastolic: number | null;
    respiratory_rate: number | null;
    weight: number | null;
  };
  flags: string;          // semicolon-separated flag tokens
  // Editable doctor data (existing)
  currentData: {
    final_diagnosis?: string | null;
    treatment_actions?: string | null;
    disposition?: string | null;
    doctor_notes?: string | null;
    updated_by?: string | null;
  };
  token: string;
  onSaved: () => void;
}
```

## Task 3.2: Add SOAP tab navigation

**Files:**
- Modify: `src/components/MedicalAssessment.tsx`

- [ ] **Step 1: Add tab state above existing state declarations**

Inside the component function, add as the FIRST state hook (before `const [diagnosis, setDiagnosis]`):
```tsx
type SoapTab = 'S' | 'O' | 'A' | 'P';
const initialTab: SoapTab = (currentData.final_diagnosis ?? '').trim() === '' ? 'A' : 'P';
const [activeTab, setActiveTab] = useState<SoapTab>(initialTab);
```

- [ ] **Step 2: Replace the panel header (currently the `<div className="mb-3 flex ...">` block) with a tab bar**

Replace the current header div + select with:
```tsx
<div className="mb-3 flex items-center justify-between">
  <h3 className="text-sm font-bold text-indigo-900">Medical Assessment (SOAP)</h3>
</div>

<div className="mb-3 flex rounded-lg border border-gray-200 overflow-hidden">
  {(['S', 'O', 'A', 'P'] as SoapTab[]).map((t) => (
    <button
      key={t}
      type="button"
      onClick={() => setActiveTab(t)}
      className={`flex-1 py-2 text-xs font-semibold transition-colors ${
        activeTab === t
          ? 'bg-indigo-900 text-white'
          : 'bg-white text-gray-600 hover:bg-gray-50'
      }`}
    >
      {t === 'S' && 'Subjective'}
      {t === 'O' && 'Objective'}
      {t === 'A' && 'Assessment'}
      {t === 'P' && 'Plan'}
    </button>
  ))}
</div>
```

## Task 3.3: Implement Subjective tab (read-only)

**Files:**
- Modify: `src/components/MedicalAssessment.tsx`

- [ ] **Step 1: Replace the existing form body (the `<div className="space-y-3">` block containing the 4 fields) with conditional rendering per tab**

Insert this BEFORE the existing `space-y-3` block (we'll progressively add each tab):
```tsx
{activeTab === 'S' && (
  <div className="space-y-3">
    <p className="text-[10px] uppercase font-semibold text-indigo-700">
      Reported by patient (read-only — captured at kiosk)
    </p>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <span className="block text-gray-500">Name</span>
        <span className="font-medium text-gray-900">{member.name}</span>
      </div>
      <div>
        <span className="block text-gray-500">Role</span>
        <span className="font-medium text-gray-900 capitalize">{role}</span>
      </div>
      <div>
        <span className="block text-gray-500">Sex</span>
        <span className="font-medium text-gray-900">{member.sex || '—'}</span>
      </div>
      <div>
        <span className="block text-gray-500">Age</span>
        <span className="font-medium text-gray-900">{member.age ?? '—'}</span>
      </div>
      <div className="col-span-2">
        <span className="block text-gray-500">Visit</span>
        <span className="font-medium text-gray-900">{visit.date} {visit.time}</span>
      </div>
    </div>
    <div>
      <span className="block text-[10px] uppercase font-semibold text-gray-500">Reported Symptoms</span>
      <p className="mt-1 text-sm text-gray-800">{symptoms || 'None reported'}</p>
    </div>
    {member.allergies && (
      <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
        <strong>Allergies:</strong> {member.allergies}
      </div>
    )}
  </div>
)}
```

## Task 3.4: Implement Objective tab (read-only with flag colors)

- [ ] **Step 1: Add the Objective tab block immediately after the Subjective block**

```tsx
{activeTab === 'O' && (
  <div className="space-y-3">
    <p className="text-[10px] uppercase font-semibold text-indigo-700">
      Vital signs (read-only — captured at kiosk)
    </p>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <VitalCell label="Temperature" value={vitals.temperature} unit="°C" />
      <VitalCell label="SpO₂" value={vitals.spo2} unit="%" />
      <VitalCell label="Heart Rate" value={vitals.heart_rate} unit="bpm" />
      <VitalCell label="Resp Rate" value={vitals.respiratory_rate} unit="/min" />
      <VitalCell
        label="Blood Pressure"
        value={
          vitals.bp_systolic && vitals.bp_diastolic
            ? `${vitals.bp_systolic}/${vitals.bp_diastolic}`
            : null
        }
        unit="mmHg"
      />
      <VitalCell label="Weight" value={vitals.weight} unit="kg" />
    </div>
    {flags && (
      <div className="space-y-1">
        <span className="block text-[10px] uppercase font-semibold text-orange-700">
          Flagged values
        </span>
        <div className="flex flex-wrap gap-1">
          {flags.split('; ').filter(Boolean).map((flag, i) => (
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
      </div>
    )}
  </div>
)}
```

- [ ] **Step 2: Add the `VitalCell` helper at the top of the file (above the component)**

```tsx
function VitalCell({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | string | null;
  unit: string;
}) {
  const display = value === null || value === undefined ? '—' : `${value} ${unit}`;
  return (
    <div className="rounded-lg bg-white border border-gray-200 px-2 py-1.5">
      <span className="block text-[10px] text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{display}</span>
    </div>
  );
}
```

## Task 3.5: Implement Assessment tab (editable diagnosis)

- [ ] **Step 1: Add the Assessment tab block**

```tsx
{activeTab === 'A' && (
  <div className="space-y-3">
    <p className="text-[10px] uppercase font-semibold text-indigo-700">
      Doctor / nurse assessment
    </p>
    <div>
      <label className="block text-xs font-medium text-gray-600">Final Diagnosis</label>
      <textarea
        value={diagnosis}
        onChange={(e) => setDiagnosis(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500"
        placeholder="Enter final diagnosis..."
      />
    </div>
  </div>
)}
```

## Task 3.6: Implement Plan tab (editable treatment + disposition + notes + reviewer)

- [ ] **Step 1: Add the Plan tab block**

```tsx
{activeTab === 'P' && (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <p className="text-[10px] uppercase font-semibold text-indigo-700">
        Treatment plan & disposition
      </p>
      <select
        value={updatedBy}
        onChange={(e) => setUpdatedBy(e.target.value)}
        className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700"
      >
        <option value="Doctor">Doctor</option>
        <option value="Nurse">Nurse</option>
      </select>
    </div>

    <div>
      <label className="block text-xs font-medium text-gray-600">Treatment / Actions Taken</label>
      <textarea
        value={treatment}
        onChange={(e) => setTreatment(e.target.value)}
        rows={2}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500"
        placeholder="Enter treatment details..."
      />
    </div>

    <div>
      <label className="block text-xs font-medium text-gray-600">Disposition</label>
      <select
        value={disposition}
        onChange={(e) => setDisposition(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500"
      >
        <option value="">-- Select Disposition --</option>
        {dispositions.map((d) => (
          <option key={d.value} value={d.value}>{d.label}</option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-xs font-medium text-gray-600">Doctor&apos;s / Nurse&apos;s Notes</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500"
        placeholder="Additional notes..."
      />
    </div>
  </div>
)}
```

- [ ] **Step 2: Delete the OLD `<div className="space-y-3">` block** (the one that was wrapping the original 4 fields). The four fields are now distributed across the A and P tabs.

- [ ] **Step 3: Verify the Save button still appears OUTSIDE the tab blocks (it should be `<button onClick={handleSave} ...>` near the bottom). Leave it as-is — it persists A+P fields regardless of which tab is active.**

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

## Task 3.7: Update dashboard to pass kiosk-captured props to MedicalAssessment

**Files:**
- Modify: `src/app/dashboard/page.tsx:466-482`

- [ ] **Step 1: Replace the `<MedicalAssessment ... />` render with the expanded prop set**

Find:
```tsx
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
```

Replace with:
```tsx
{expandedRecord === record.triage_id && (
  <MedicalAssessment
    triageId={record.triage_id}
    role={record.role}
    member={{
      name: record.member_name,
      sex: record.sex,
      age: record.age,
      allergies: record.allergies,
    }}
    visit={{
      date: record.visit_date,
      time: record.visit_time,
    }}
    symptoms={record.symptoms}
    vitals={{
      temperature: record.temperature,
      spo2: record.spo2,
      heart_rate: record.heart_rate,
      bp_systolic: record.bp_systolic,
      bp_diastolic: record.bp_diastolic,
      respiratory_rate: record.respiratory_rate,
      weight: record.weight,
    }}
    flags={record.flags}
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

## Task 3.8: Smoke test SOAP flow

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Submit a triage record from the kiosk**

Open `http://localhost:3000` → walk through: splash → privacy → role → ID → vitals (enter realistic numbers) → symptoms (pick a few from BODY view) → allergies → success. Note the Triage ID shown.

- [ ] **Step 3: Open the dashboard and unlock edit mode**

Open `/dashboard`. Click "Unlock Edit Mode", enter PIN `1234` (default).

- [ ] **Step 4: Expand the new record's assessment**

Find your test record at the top of "Recent Visits". Click "Edit / Add Assessment".

- [ ] **Step 5: Verify all 4 SOAP tabs work**

- **S tab**: shows name, sex, age, role, visit date/time, reported symptoms, allergies (if any). All read-only.
- **O tab**: shows 6 vital cells with values + flagged badges if any.
- **A tab**: Final Diagnosis textarea, editable.
- **P tab**: Treatment textarea, Disposition dropdown (with role-appropriate options), Notes textarea, Doctor/Nurse selector.
- Default tab opens to **A** (since no diagnosis yet).

- [ ] **Step 6: Save and reload**

Type a diagnosis on A. Type a treatment + pick disposition + notes on P. Click "Save Assessment". Verify the record now shows "Reviewed" badge. Re-expand — default tab should now open to **P** (since diagnosis is filled).

- [ ] **Step 7: Stop dev server**

## Task 3.9: Commit Phase 3

- [ ] **Step 1: Stage and commit**

```bash
git add src/components/MedicalAssessment.tsx src/app/dashboard/page.tsx
git commit -m "Restructure MedicalAssessment into SOAP tabs

Splits the 4-field flat form into Subjective | Objective | Assessment
| Plan tabs. S and O show kiosk-captured data read-only (demographics,
symptoms, vitals, flags). A holds Final Diagnosis. P holds Treatment,
Disposition, Notes, and the Doctor/Nurse reviewer selector. The Save
button persists A+P fields via the existing /api/triage/update
endpoint — no API or schema changes."
```

---

# Phase 4 — Pending Review Tab Polish

Goal: Three small improvements to the existing Pending Review tab — sort oldest-first, days-pending badge per record, count badge on the tab label.

## Task 4.1: TDD — daysSince formatter

**Files:**
- Create: `src/lib/__tests__/format.test.ts`
- Create: `src/lib/format.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/format.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { daysSince } from '../format';

describe('daysSince', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-27T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns minutes when under 1 hour', () => {
    expect(daysSince('2026-04-27T11:30:00Z')).toBe('30m');
  });

  it('returns hours when under 1 day', () => {
    expect(daysSince('2026-04-27T08:00:00Z')).toBe('4h');
  });

  it('returns days when under 1 week', () => {
    expect(daysSince('2026-04-25T12:00:00Z')).toBe('2d');
  });

  it('returns weeks when 1 week or more', () => {
    expect(daysSince('2026-04-13T12:00:00Z')).toBe('2w');
  });

  it('returns "now" for very recent timestamps', () => {
    expect(daysSince('2026-04-27T11:59:30Z')).toBe('now');
  });

  it('returns empty string for null/undefined', () => {
    expect(daysSince(null)).toBe('');
    expect(daysSince(undefined)).toBe('');
    expect(daysSince('')).toBe('');
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/lib/format.ts`:
```ts
export function daysSince(timestamp: string | null | undefined): string {
  if (!timestamp) return '';
  const ms = Date.now() - new Date(timestamp).getTime();
  if (Number.isNaN(ms) || ms < 0) return '';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS — all 6 + the 14 from Phase 2 = 20 assertions green.

## Task 4.2: Update db.ts — sort order + pendingCount stat

**Files:**
- Modify: `src/lib/db.ts:334-344, 369-382`

- [ ] **Step 1: Change sort order in `getPendingReviewRecords` (line ~341)**

In `getPendingReviewRecords`, change:
```ts
ORDER BY t.created_at DESC
```
to:
```ts
ORDER BY t.created_at ASC
```

(The full function should now be:)
```ts
export async function getPendingReviewRecords(limit = 50) {
  const sql = getSQL();
  return sql`
    SELECT t.*, m.member_name, m.sex, m.age, m.allergies
    FROM triage_records t
    JOIN members m ON t.institution_id = m.institution_id
    WHERE t.updated_by IS NULL
    ORDER BY t.created_at ASC
    LIMIT ${limit}
  `;
}
```

- [ ] **Step 2: Add `pendingCount` to `getDashboardStats` (lines ~369-382)**

Replace the entire `getDashboardStats` function with:
```ts
export async function getDashboardStats() {
  const sql = getSQL();
  const totalMembers = await sql`SELECT COUNT(*) as count FROM members`;
  const totalVisits = await sql`SELECT COUNT(*) as count FROM triage_records`;
  const todayVisits = await sql`SELECT COUNT(*) as count FROM triage_records WHERE visit_date = ${new Date().toLocaleDateString('en-PH')}`;
  const flaggedToday = await sql`SELECT COUNT(*) as count FROM triage_records WHERE visit_date = ${new Date().toLocaleDateString('en-PH')} AND flags != '' AND flags IS NOT NULL`;
  const pendingCount = await sql`SELECT COUNT(*) as count FROM triage_records WHERE updated_by IS NULL`;

  return {
    totalMembers: Number(totalMembers[0].count),
    totalVisits: Number(totalVisits[0].count),
    todayVisits: Number(todayVisits[0].count),
    flaggedToday: Number(flaggedToday[0].count),
    pendingCount: Number(pendingCount[0].count),
  };
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

## Task 4.3: Update dashboard with pending badges

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Add the `daysSince` import**

```ts
import { daysSince } from '@/lib/format';
```

- [ ] **Step 2: Extend the `Stats` interface (around line 36)**

Replace:
```ts
interface Stats {
  totalMembers: number;
  totalVisits: number;
  todayVisits: number;
  flaggedToday: number;
}
```

With:
```ts
interface Stats {
  totalMembers: number;
  totalVisits: number;
  todayVisits: number;
  flaggedToday: number;
  pendingCount: number;
}
```

- [ ] **Step 3: Add the count badge to the Pending Review tab button (around line 271-285)**

In the tab button render block, replace:
```tsx
{t === 'pending' && 'Pending Review'}
```

With:
```tsx
{t === 'pending' && (
  <>
    Pending Review
    {stats?.pendingCount && stats.pendingCount > 0 ? (
      <span className="ml-1.5 inline-block rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
        {stats.pendingCount}
      </span>
    ) : null}
  </>
)}
```

- [ ] **Step 4: Add the days-pending badge in the record header (around line 353-361, alongside the Reviewed/Pending Review badges)**

Find the existing block:
```tsx
{record.updated_by ? (
  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
    Reviewed
  </span>
) : (
  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-700">
    Pending Review
  </span>
)}
```

Append a sibling badge after it (only when on the pending tab):
```tsx
{record.updated_by ? (
  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
    Reviewed
  </span>
) : (
  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-700">
    Pending Review
  </span>
)}
{tab === 'pending' && !record.updated_by && (
  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
    Waiting {daysSince(record.created_at)}
  </span>
)}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

## Task 4.4: Smoke test pending tab polish

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Submit one or two new triage records via the kiosk** (so there's pending work)

- [ ] **Step 3: Open the dashboard**

Open `/dashboard`. The "Pending Review" tab in the navigation should now show a count badge (e.g. "Pending Review 2").

- [ ] **Step 4: Click the Pending Review tab**

Verify:
- Records are sorted **oldest first** (records that have been waiting longer appear at the top)
- Each record card shows the orange "Waiting Xm/h/d" badge alongside "Pending Review"

- [ ] **Step 5: Mark one record as reviewed (PIN unlock + add diagnosis + save), then reload**

Verify:
- The reviewed record disappears from the Pending Review tab
- The count badge on the tab decrements

- [ ] **Step 6: Stop dev server**

## Task 4.5: Commit Phase 4

- [ ] **Step 1: Stage and commit**

```bash
git add src/lib/format.ts src/lib/__tests__/format.test.ts \
  src/lib/db.ts \
  src/app/dashboard/page.tsx
git commit -m "Polish Pending Review tab: oldest-first sort + waiting badges

- getPendingReviewRecords now ORDER BY ASC so longest-waiting
  records surface first.
- getDashboardStats exposes pendingCount.
- Tab nav shows a count badge when pendingCount > 0.
- Each pending record card shows a 'Waiting Xd/h/m' badge using
  the new daysSince formatter (with 6 unit tests)."
```

---

# Final Verification

## Task F.1: Run the full test suite

- [ ] **Step 1: All unit tests pass**

Run: `npm test`
Expected: PASS — 20 total assertions (14 id-validation + 6 daysSince).

## Task F.2: Build verifies cleanly

- [ ] **Step 1: Production build**

Run: `npm run build`
Expected: PASS — no type errors, no missing imports.

## Task F.3: Lint clean

- [ ] **Step 1: Run linter**

Run: `npm run lint`
Expected: no new errors introduced by these changes.

## Task F.4: End-to-end smoke walk

- [ ] **Step 1: Final E2E walkthrough**

Run: `npm run dev`. With one browser session per role, run through the entire flow:

1. **Employee kiosk submission** (7-digit ID flow): splash → privacy → Employee role → 7-digit ID → vitals → symptoms (use the new BODY view, click Arms → pick a symptom, click Legs → pick another) → allergies → success.
2. **Student kiosk submission** (9-digit ID flow): same but Student role + 9-digit ID.
3. **Dashboard**: PIN unlock → see both records with role badges. Pending count badge visible on tab.
4. **Pending tab**: oldest-first order, "Waiting" badges visible.
5. **SOAP assessment**: expand the employee record → walk all 4 SOAP tabs → fill diagnosis (A) + treatment/disposition (P) → save → record now shows "Reviewed" → pending count decrements.
6. **Reports**: PIN unlock → individual lookup with 7-digit employee ID returns history.

- [ ] **Step 2: Stop dev server**

## Task F.5: Confirm clean working tree

- [ ] **Step 1: Status check**

Run: `git status`
Expected: clean.

- [ ] **Step 2: Log review**

Run: `git log --oneline -10`
Expected: 4 new commits (one per phase) on top of the prior history.

---

## Risk Notes

- **No DB migration needed.** `institution_id VARCHAR(9)` accommodates 7-character employee IDs without schema changes.
- **No API contract changes.** Phase 3 reuses `POST /api/triage/update` exactly. Phase 2 only loosens the lookup validator (still rejects garbage).
- **OCR with 7-digit pattern is more permissive.** Two random adjacent 7-digit sequences in noise could cause false positives. Mitigation: the role-preferred ordering means employee scans prefer `\b\d{7}\b` and student scans prefer `\b\d{9}\b`. The user always confirms in manual mode before submit.
- **Vitest is added as a dev dependency only.** Production bundle is unaffected.
- **Body model paths are simple polygons.** They look reasonable but are not anatomically refined; capstone-grade. Visual polish can be a follow-up if needed.
