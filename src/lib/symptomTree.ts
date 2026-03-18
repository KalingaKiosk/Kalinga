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

  // ✅ SEPARATED ARMS AND LEGS
  {
    id: 'arms',
    label: 'Arms',
    children: [
      {
        id: 'upper_arm',
        label: 'Upper Arm',
        children: [
          { id: 'arm_pain', label: 'Arm Pain' },
          { id: 'arm_swelling', label: 'Arm Swelling' },
          { id: 'arm_numbness', label: 'Numbness/Tingling' },
        ],
      },
      {
        id: 'elbow',
        label: 'Elbow',
        children: [
          { id: 'elbow_pain', label: 'Elbow Pain' },
          { id: 'tennis_elbow', label: 'Tennis Elbow' },
        ],
      },
      {
        id: 'forearm',
        label: 'Forearm/Wrist',
        children: [
          { id: 'wrist_sprain', label: 'Wrist Sprain' },
          { id: 'carpal_tunnel', label: 'Carpal Tunnel Symptoms' },
        ],
      },
      {
        id: 'hand',
        label: 'Hand/Fingers',
        children: [
          { id: 'hand_sprain', label: 'Hand Sprain' },
          { id: 'hand_injury', label: 'Hand Injury' },
          { id: 'finger_pain', label: 'Finger Pain/Swelling' },
        ],
      },
    ],
  },

  {
    id: 'legs',
    label: 'Legs',
    children: [
      {
        id: 'hip',
        label: 'Hip',
        children: [
          { id: 'hip_pain', label: 'Hip Pain' },
          { id: 'hip_injury', label: 'Hip Injury' },
        ],
      },
      {
        id: 'thigh',
        label: 'Thigh',
        children: [
          { id: 'thigh_pain', label: 'Thigh Pain' },
          { id: 'thigh_swelling', label: 'Thigh Swelling' },
        ],
      },
      {
        id: 'knee',
        label: 'Knee',
        children: [
          { id: 'knee_pain', label: 'Knee Pain' },
          { id: 'knee_swelling', label: 'Knee Swelling' },
          { id: 'knee_instability', label: 'Knee Instability' },
        ],
      },
      {
        id: 'shin_calf',
        label: 'Shin/Calf',
        children: [
          { id: 'shin_splints', label: 'Shin Splints' },
          { id: 'calf_pain', label: 'Calf Pain/Cramps' },
        ],
      },
      {
        id: 'ankle_foot',
        label: 'Ankle/Foot',
        children: [
          { id: 'ankle_sprain', label: 'Ankle Sprain' },
          { id: 'ankle_injury', label: 'Ankle Injury' },
          { id: 'foot_pain', label: 'Foot Pain' },
          { id: 'plantar_fasciitis', label: 'Plantar Fasciitis' },
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
      { id: 'urinary_frequency', label: 'Frequent Urination' },
      { id: 'urinary_incontinence', label: 'Urinary Incontinence' },
    ],
  },
];
