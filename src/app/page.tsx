'use client';

import { useState } from 'react';
import SplashScreen from '@/components/SplashScreen';
import PrivacyNotice from '@/components/PrivacyNotice';
import RoleSelection from '@/components/RoleSelection';
import InstitutionIDCapture from '@/components/InstitutionIDCapture';
import VitalSigns, { type VitalSignsData } from '@/components/VitalSigns';
import SymptomsSelection from '@/components/SymptomsSelection';
import AllergyConfirmation from '@/components/AllergyConfirmation';
import SubmissionSuccess from '@/components/SubmissionSuccess';
import { type VitalFlag } from '@/lib/vital-flags';
import type { MemberRole } from '@/types';

type Step = 'splash' | 'privacy' | 'role' | 'id' | 'vitals' | 'symptoms' | 'allergies' | 'submitting' | 'success';

interface MemberSubmitData {
  id: string;
  name: string;
  sex: string;
  age: string;
  allergies: string;
  grade_level: string;
  section: string;
  department: string;
  address: string;
  contact_number: string;
  guardian_name: string;
  guardian_contact: string;
}

interface KioskData {
  role: MemberRole;
  institutionId: string;
  memberName: string;
  sex: string;
  age: string;
  allergies: string;
  grade_level: string;
  section: string;
  department: string;
  address: string;
  contact_number: string;
  guardian_name: string;
  guardian_contact: string;
  symptoms: string[];
  vitalSigns: VitalSignsData | null;
  triageId: string;
  flags: VitalFlag[];
}

const initialData: KioskData = {
  role: 'student',
  institutionId: '',
  memberName: '',
  sex: '',
  age: '',
  allergies: '',
  grade_level: '',
  section: '',
  department: '',
  address: '',
  contact_number: '',
  guardian_name: '',
  guardian_contact: '',
  symptoms: [],
  vitalSigns: null,
  triageId: '',
  flags: [],
};

export default function Home() {
  const [step, setStep] = useState<Step>('splash');
  const [data, setData] = useState<KioskData>(initialData);
  const [submitError, setSubmitError] = useState('');

  const handleRestart = () => {
    setStep('splash');
    setData(initialData);
    setSubmitError('');
  };

  const handleRoleSelect = (role: MemberRole) => {
    setData((prev) => ({ ...prev, role }));
    setStep('id');
  };

  const handleMemberSubmit = (member: MemberSubmitData) => {
    setData((prev) => ({
      ...prev,
      institutionId: member.id,
      memberName: member.name,
      sex: member.sex,
      age: member.age,
      allergies: member.allergies,
      grade_level: member.grade_level,
      section: member.section,
      department: member.department,
      address: member.address,
      contact_number: member.contact_number,
      guardian_name: member.guardian_name,
      guardian_contact: member.guardian_contact,
    }));
    setStep('vitals');
  };

  const handleVitalsSubmit = (vitalSigns: VitalSignsData) => {
    setData((prev) => ({ ...prev, vitalSigns }));
    setStep('symptoms');
  };

  const handleSymptomsSubmit = (symptoms: string[]) => {
    setData((prev) => ({ ...prev, symptoms }));
    setStep('allergies');
  };

  const handleAllergyConfirm = async (updatedAllergies: string) => {
    setData((prev) => ({ ...prev, allergies: updatedAllergies }));
    setStep('submitting');
    setSubmitError('');

    try {
      const res = await fetch('/api/triage/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId: data.institutionId,
          role: data.role,
          name: data.memberName,
          sex: data.sex,
          age: data.age,
          allergies: updatedAllergies,
          grade_level: data.grade_level,
          section: data.section,
          department: data.department,
          address: data.address,
          contact_number: data.contact_number,
          guardian_name: data.guardian_name,
          guardian_contact: data.guardian_contact,
          symptoms: data.symptoms,
          vitalSigns: data.vitalSigns,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setData((prev) => ({
          ...prev,
          triageId: result.triageId,
          flags: result.flags || [],
        }));
        setStep('success');
      } else {
        setSubmitError(result.error || 'Submission failed');
        setStep('allergies');
      }
    } catch {
      setSubmitError('Network error. Please try again.');
      setStep('allergies');
    }
  };

  return (
    <>
      {step === 'splash' && <SplashScreen onStart={() => setStep('privacy')} />}
      {step === 'privacy' && <PrivacyNotice onAgree={() => setStep('role')} onBack={() => setStep('splash')} />}
      {step === 'role' && <RoleSelection onSelect={handleRoleSelect} onBack={() => setStep('privacy')} />}
      {step === 'id' && <InstitutionIDCapture role={data.role} onSubmit={handleMemberSubmit} onBack={() => setStep('role')} />}
      {step === 'vitals' && <VitalSigns onSubmit={handleVitalsSubmit} onBack={() => setStep('id')} allergies={data.allergies} />}
      {step === 'symptoms' && <SymptomsSelection onSubmit={handleSymptomsSubmit} onBack={() => setStep('vitals')} />}
      {step === 'allergies' && (
        <AllergyConfirmation
          allergies={data.allergies}
          onConfirm={handleAllergyConfirm}
          onBack={() => setStep('symptoms')}
        />
      )}

      {step === 'submitting' && (
        <div className="flex min-h-screen flex-col items-center justify-center text-white" style={{ background: '#1a1a4e' }}>
          <svg className="h-12 w-12 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-4 text-lg font-semibold">Submitting...</p>
          <p className="mt-1 text-sm text-blue-200/70">Recording your health information</p>
        </div>
      )}

      {step === 'success' && (
        <SubmissionSuccess
          triageId={data.triageId}
          memberName={data.memberName}
          flags={data.flags}
          onRestart={handleRestart}
        />
      )}

      {submitError && (step === 'allergies' || step === 'symptoms') && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-red-600 px-6 py-3 text-sm font-medium text-white shadow-lg">
          {submitError}
        </div>
      )}
    </>
  );
}
