'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function StudentLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-primary-200 rounded-full mb-4 spinner"></div>
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10 transition-shadow">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center shadow-inner group-hover:bg-primary-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="font-semibold text-lg text-slate-800 tracking-tight hidden sm:block">
                KTM Digital
              </span>
            </div>
            
            <div className="flex items-center gap-5">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-800">
                  {user.student?.fullName || user.email}
                </span>
                <span className="badge-blue text-xs mt-0.5">
                  NIM: {user.student?.nim || 'Student'}
                </span>
              </div>
              
              <div className="h-9 w-9 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-bold border border-primary-100 sm:hidden shadow-sm">
                {user.student?.fullName?.charAt(0) || user.email?.charAt(0) || 'S'}
              </div>

              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

              <button
                onClick={handleLogout}
                className="btn-ghost text-sm flex items-center gap-2"
                aria-label="Logout"
              >
                <span className="hidden sm:inline">Logout</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {children}
      </main>
    </div>
  );
}
