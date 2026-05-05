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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
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
    <div className="min-h-screen bg-background">
      <header className="bg-surface shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">KTM</span>
                </div>
                <span className="font-display font-semibold text-lg text-slate-900 hidden sm:block">
                  KTM Digital
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-slate-900">
                  {user.student?.fullName || user.email}
                </span>
                <span className="text-xs text-slate-500">
                  {user.student?.nim || 'Student'}
                </span>
              </div>
              
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200 sm:hidden">
                {user.student?.fullName?.charAt(0) || user.email?.charAt(0) || 'S'}
              </div>

              <button
                onClick={handleLogout}
                className="text-sm font-medium text-slate-600 hover:text-red-600 transition-colors border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
