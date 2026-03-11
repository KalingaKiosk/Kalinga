export interface VitalFlag {
  type: 'critical' | 'warning';
  label: string;
  message: string;
}

export function evaluateVitalSigns(vitals: {
  temperature?: string;
  spo2?: string;
  heartRate?: string;
  bloodPressureSystolic?: string;
  bloodPressureDiastolic?: string;
  respiratoryRate?: string;
}): VitalFlag[] {
  const flags: VitalFlag[] = [];

  // Temperature
  const temp = parseFloat(vitals.temperature || '');
  if (!isNaN(temp)) {
    if (temp >= 39.0) {
      flags.push({ type: 'critical', label: 'High Fever', message: `Temperature: ${temp}°C (≥39°C)` });
    } else if (temp >= 37.5) {
      flags.push({ type: 'warning', label: 'Fever', message: `Temperature: ${temp}°C (≥37.5°C)` });
    } else if (temp < 35.0) {
      flags.push({ type: 'critical', label: 'Hypothermia', message: `Temperature: ${temp}°C (<35°C)` });
    }
  }

  // SpO2
  const spo2 = parseFloat(vitals.spo2 || '');
  if (!isNaN(spo2)) {
    if (spo2 < 90) {
      flags.push({ type: 'critical', label: 'Severe Hypoxia', message: `SpO2: ${spo2}% (<90%)` });
    } else if (spo2 < 95) {
      flags.push({ type: 'warning', label: 'Hypoxia', message: `SpO2: ${spo2}% (<95%)` });
    }
  }

  // Heart Rate
  const hr = parseInt(vitals.heartRate || '');
  if (!isNaN(hr)) {
    if (hr > 120) {
      flags.push({ type: 'critical', label: 'Severe Tachycardia', message: `Heart Rate: ${hr} bpm (>120)` });
    } else if (hr > 100) {
      flags.push({ type: 'warning', label: 'Tachycardia', message: `Heart Rate: ${hr} bpm (>100)` });
    } else if (hr < 50) {
      flags.push({ type: 'critical', label: 'Severe Bradycardia', message: `Heart Rate: ${hr} bpm (<50)` });
    } else if (hr < 60) {
      flags.push({ type: 'warning', label: 'Bradycardia', message: `Heart Rate: ${hr} bpm (<60)` });
    }
  }

  // Blood Pressure
  const sys = parseInt(vitals.bloodPressureSystolic || '');
  const dia = parseInt(vitals.bloodPressureDiastolic || '');
  if (!isNaN(sys)) {
    if (sys > 180) {
      flags.push({ type: 'critical', label: 'Hypertensive Crisis', message: `BP Systolic: ${sys} mmHg (>180)` });
    } else if (sys > 140) {
      flags.push({ type: 'warning', label: 'Hypertension', message: `BP Systolic: ${sys} mmHg (>140)` });
    } else if (sys < 90) {
      flags.push({ type: 'warning', label: 'Hypotension', message: `BP Systolic: ${sys} mmHg (<90)` });
    }
  }
  if (!isNaN(dia)) {
    if (dia > 120) {
      flags.push({ type: 'critical', label: 'Hypertensive Crisis (Diastolic)', message: `BP Diastolic: ${dia} mmHg (>120)` });
    } else if (dia > 90) {
      flags.push({ type: 'warning', label: 'Hypertension (Diastolic)', message: `BP Diastolic: ${dia} mmHg (>90)` });
    } else if (dia < 60) {
      flags.push({ type: 'warning', label: 'Hypotension (Diastolic)', message: `BP Diastolic: ${dia} mmHg (<60)` });
    }
  }

  // Respiratory Rate
  const rr = parseInt(vitals.respiratoryRate || '');
  if (!isNaN(rr)) {
    if (rr > 30) {
      flags.push({ type: 'critical', label: 'Severe Tachypnea', message: `RR: ${rr} breaths/min (>30)` });
    } else if (rr > 20) {
      flags.push({ type: 'warning', label: 'Tachypnea', message: `RR: ${rr} breaths/min (>20)` });
    } else if (rr < 10) {
      flags.push({ type: 'critical', label: 'Bradypnea', message: `RR: ${rr} breaths/min (<10)` });
    }
  }

  return flags;
}

export function flagsToString(flags: VitalFlag[]): string {
  return flags.map((f) => `[${f.type.toUpperCase()}] ${f.label}`).join('; ');
}
