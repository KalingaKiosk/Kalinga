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

export interface BodyRegion {
  id: string;
  label: string;
  symptoms?: string[];
  subRegions?: BodyRegion[];
}

export const bodyRegions: BodyRegion[] = [
  {
    id: 'head',
    label: 'Head',
    subRegions: [
      {
        id: 'eyes',
        label: 'Eyes',
        symptoms: ['Eye Irritation', 'Eye Redness', 'Eye Sore'],
      },
      {
        id: 'nose',
        label: 'Nose',
        symptoms: ['Nose Bleed', 'Colds'],
      },
      {
        id: 'mouth',
        label: 'Mouth',
        symptoms: ['Sore Throat'],
      },
      {
        id: 'ears',
        label: 'Ears',
        symptoms: ['Ear Pain'],
      },
      {
        id: 'face',
        label: 'Face',
        symptoms: ['Headache', 'Fever', 'Concussion'],
      },
    ],
  },
  {
    id: 'throat',
    label: 'Throat',
    symptoms: ['Sore Throat', 'Coughs', 'Colds', 'Respiratory Issues'],
  },
  {
    id: 'chest',
    label: 'Chest',
    symptoms: ['Respiratory Issues', 'BP Monitoring'],
  },
  {
    id: 'abdomen',
    label: 'Abdomen',
    symptoms: [
      'Abdominal Pain',
      'Nausea',
      'Vomiting',
      'Loss of Appetite',
      'Dysmenorrhea',
    ],
  },
  {
    id: 'arms',
    label: 'Arms',
    subRegions: [
      {
        id: 'leftArm',
        label: 'Left Arm',
        symptoms: ['Muscle Sprain', 'Muscle Strain', 'Dislocation', 'Wounds'],
      },
      {
        id: 'rightArm',
        label: 'Right Arm',
        symptoms: ['Muscle Sprain', 'Muscle Strain', 'Dislocation', 'Wounds'],
      },
    ],
  },
  {
    id: 'legs',
    label: 'Legs',
    subRegions: [
      {
        id: 'leg',
        label: 'Leg',
        symptoms: [
          'Muscle Sprain',
          'Muscle Strain',
          'Dislocation',
          'Wounds',
          'Body Malaise',
        ],
      },
      {
        id: 'knee',
        label: 'Knee',
        symptoms: ['Muscle Sprain', 'Dislocation', 'Wounds'],
      },
      {
        id: 'ankle',
        label: 'Ankle',
        symptoms: ['Muscle Sprain', 'Dislocation', 'Wounds'],
      },
    ],
  },
  {
    id: 'skin',
    label: 'Skin',
    symptoms: [
      'Rashes',
      'Wounds',
      'Physical Examination',
      'Body Malaise',
    ],
  },
];

export function findRegionById(
  regions: BodyRegion[],
  id: string
): BodyRegion | null {
  for (const region of regions) {
    if (region.id === id) return region;

    if (region.subRegions) {
      const found = findRegionById(region.subRegions, id);
      if (found) return found;
    }
  }
  return null;
}

export function getAllSymptoms(): string[] {
  return [...new Set(symptomCategories.flatMap((c) => c.symptoms))];
}
