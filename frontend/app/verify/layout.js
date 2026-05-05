import Link from 'next/link';

export const metadata = {
  title: 'KTM Digital - Verification',
  description: 'Public Verification Page for KTM Digital',
};

export default function VerifyLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10 transition-shadow">
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center shadow-inner group-hover:bg-primary-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-tight">
                KTM Digital
              </h1>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold leading-tight">Verification Portal</span>
            </div>
          </div>
          <Link
            href="/login"
            className="btn-ghost text-sm font-semibold"
          >
            Portal Login &rarr;
          </Link>
        </div>
      </header>

      <main className="flex-grow w-full max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-12">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center text-sm font-medium text-slate-400">
          &copy; {new Date().getFullYear()} KTM Digital. Research Prototype.
        </div>
      </footer>
    </div>
  );
}
