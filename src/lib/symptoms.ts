export interface SymptomCategory {
  id: string;
  label: string;
  symptoms: string[];
}

// Matches Figure 5: Pre-Triage Process diagram
export const symptomCategories: SymptomCategory[] = [
  {
    id: 'flu',
    label: 'Flu-like Symptoms',
    symptoms: [
      'Coughs',
      'Colds',
      'Sore Throat',
      'Fever',
      'Respiratory Issues',
      'Headache',
    ],
  },
  {
    id: 'musculoskeletal',
    label: 'Musculoskeletal Pain or Injuries',
    symptoms: [
      'Muscle Sprain',
      'Muscle Strain',
      'Dislocation',
      'Wounds',
      'Concussion',
      'Abdominal Pain',
      'Dysmenorrhea',
      'Body Malaise',
    ],
  },
  {
    id: 'derma_ent',
    label: 'Dermatologic/Eye/ENT',
    symptoms: [
      'Rashes',
      'Eye Irritation',
      'Eye Redness',
      'Eye Sore',
      'Ear Pain',
      'Nose Bleed',
    ],
  },
  {
    id: 'general',
    label: 'General Check-Up',
    symptoms: [
      'Physical Examination',
      'BP Monitoring',
      'Other Concerns',
    ],
  },
  {
    id: 'gastrointestinal',
    label: 'Gastrointestinal',
    symptoms: [
      'Nausea',
      'Vomiting',
      'Loss of Appetite',
    ],
  },
];

// Body region mapping for body view (maps to clickable areas on anatomy figure)
export const bodyRegionMap: Record<string, string[]> = {
  head: ['Headache', 'Concussion', 'Eye Irritation', 'Eye Redness', 'Sore Eyes', 'Fever', 'Ear Pain', 'Nose Bleed'],
  throat: ['Sore Throat', 'Coughs', 'Colds', 'Respiratory Issues'],
  chest: ['Respiratory Issues', 'BP Monitoring'],
  abdomen: ['Abdominal Pain', 'Nausea', 'Vomiting', 'Loss of Appetite', 'Dysmenorrhea'],
  leftArm: ['Muscle Sprain', 'Muscle Strain', 'Dislocation', 'Wounds'],
  rightArm: ['Muscle Sprain', 'Muscle Strain', 'Dislocation', 'Wounds'],
  leftLeg: ['Muscle Sprain', 'Muscle Strain', 'Dislocation', 'Wounds'],
  rightLeg: ['Muscle Sprain', 'Muscle Strain', 'Dislocation', 'Wounds'],
  skin: ['Rashes', 'Wounds', 'Physical Examination', 'Body Malaise'],
};

export function getAllSymptoms(): string[] {
  return [...new Set(symptomCategories.flatMap((c) => c.symptoms))];
}
