'use client';

interface RoleSelectionProps {
  onSelect: (role: 'student' | 'employee') => void;
  onBack: () => void;
}

export default function RoleSelection({ onSelect, onBack }: RoleSelectionProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #1a1a4e, #2d2d6b)' }}>
        <button onClick={onBack} className="mb-2 flex items-center gap-1 text-sm text-blue-300/70 hover:text-white">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-white">Select Your Role</h1>
        <p className="mt-1 text-sm text-blue-200/70">Are you a student or an employee?</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-md space-y-4">
          <button
            onClick={() => onSelect('student')}
            className="flex w-full items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: '#eef0ff' }}>
              <svg className="h-7 w-7" style={{ color: '#6c63ff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">Student</div>
              <div className="text-sm text-gray-500">I am a student of this institution</div>
            </div>
          </button>

          <button
            onClick={() => onSelect('employee')}
            className="flex w-full items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: '#f0fdf4' }}>
              <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">Employee</div>
              <div className="text-sm text-gray-500">I am a faculty or staff member</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
