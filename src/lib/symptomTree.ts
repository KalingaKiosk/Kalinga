export interface SymptomNode {
  id: string;
  label: string;
  children?: SymptomNode[];
}

export const symptomTree: SymptomNode[] = [
  {
    id: 'head',
    label: 'Head',
    children: [
      {
        id: 'eye',
        label: 'Eye',
        children: [
          { id: 'eye_pain', label: 'Eye Pain' },
          { id: 'eye_irritation', label: 'Eye Irritation' },
          { id: 'eye_redness', label: 'Eye Redness' },
          { id: 'eye_discharge', label: 'Eye Discharge' },
        ],
      },
      {
        id: 'ear',
        label: 'Ear',
        children: [
          { id: 'ear_pain', label: 'Ear Pain' },
          { id: 'ear_discharge', label: 'Ear Discharge' },
          { id: 'ear_ringing', label: 'Ear Ringing' },
        ],
      },
      {
        id: 'nose',
        label: 'Nose',
        children: [
          { id: 'nosebleed', label: 'Nosebleed' },
          { id: 'colds', label: 'Colds' },
          { id: 'runny_nose', label: 'Runny Nose' },
        ],
      },
      {
        id: 'mouth',
        label: 'Mouth/Throat',
        children: [
          { id: 'sore_throat', label: 'Sore Throat' },
        ],
      },
      {
        id: 'forehead',
        label: 'Forehead',
        children: [
          { id: 'migraine', label: 'Migraine' },
          { id: 'headache', label: 'Headache' },
          { id: 'fever', label: 'Fever' },
        ],
      },
    ],
  },

  {
    id: 'torso',
    label: 'Torso',
    children: [
      {
        id: 'chest',
        label: 'Chest',
        children: [
          { id: 'breathing', label: 'Difficulty of Breathing' },
          { id: 'chest_pain', label: 'Chest Pain' },
          { id: 'chest_tightness', label: 'Chest Tightness' },
        ],
      },
      {
        id: 'shoulder',
        label: 'Shoulder',
        children: [
          { id: 'dislocation', label: 'Dislocation' },
          { id: 'shoulder_pain', label: 'Shoulder Pain' },
        ],
      },
      {
        id: 'abdomen',
        label: 'Abdomen',
        children: [
          { id: 'abdominal_pain', label: 'Abdominal Pain' },
          { id: 'vomiting', label: 'Vomiting' },
          { id: 'nausea', label: 'Nausea' },
          { id: 'diarrhea', label: 'Diarrhea' },
          { id: 'dysmenorrhea', label: 'Dysmenorrhea' },
        ],
      },
      {
        id: 'back',
        label: 'Back',
        children: [
          { id: 'upper_back', label: 'Upper Back Pain' },
          { id: 'lower_back', label: 'Lower Back Pain' },
        ],
      },
    ],
  },

  {
    id: 'limbs',
    label: 'Limbs',
    children: [
      {
        id: 'hand',
        label: 'Hand',
        children: [
          { id: 'hand_sprain', label: 'Sprain' },
          { id: 'hand_injury', label: 'Injury' },
        ],
      },
      {
        id: 'ankle',
        label: 'Ankle',
        children: [
          { id: 'ankle_sprain', label: 'Sprain' },
          { id: 'ankle_injury', label: 'Injury' },
        ],
      },
    ],
  },

  {
    id: 'genitourinary',
    label: 'Genitourinary',
    children: [
      { id: 'painful_urination', label: 'Painful Urination' },
      { id: 'blood_urine', label: 'Blood in Urine' },
    ],
  },
];
