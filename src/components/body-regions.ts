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
