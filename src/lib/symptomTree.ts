// File: @/lib/symptomTree.ts

// Define the node structure for a symptom
export interface SymptomNode {
  name: string;                 // Symptom name
  children?: SymptomNode[];     // Sub-symptoms (optional)
}

// Example hierarchical symptom tree
export const symptomTree: SymptomNode[] = [
  {
    name: 'Head',
    children: [
      { name: 'Headache' },
      { name: 'Dizziness' },
      { name: 'Fainting' },
    ],
  },
  {
    name: 'Chest',
    children: [
      { name: 'Chest Pain' },
      { name: 'Shortness of Breath' },
      { name: 'Palpitations' },
    ],
  },
  {
    name: 'Abdomen',
    children: [
      { name: 'Nausea' },
      { name: 'Vomiting' },
      { name: 'Diarrhea' },
      { name: 'Abdominal Pain' },
    ],
  },
  {
    name: 'Limbs',
    children: [
      { name: 'Numbness' },
      { name: 'Tingling' },
      { name: 'Swelling' },
      { name: 'Weakness' },
    ],
  },
  {
    name: 'Skin',
    children: [
      { name: 'Rash' },
      { name: 'Itching' },
      { name: 'Bruising' },
    ],
  },
];
