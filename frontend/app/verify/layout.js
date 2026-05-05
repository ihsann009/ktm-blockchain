import Link from 'next/link';

export const metadata = {
  title: 'KTM Digital - Verification',
  description: 'Public Verification Page for KTM Digital',
};

export default function VerifyLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center font-bold text-lg">
              K
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              KTM Verification
            </h1>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors py-2 px-3 rounded-md hover:bg-blue-50"
          >
            Portal Login &rarr;
          </Link>
        </div>
      </header>

      <main className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} KTM Digital. Research Prototype.
        </div>
      </footer>
    </div>
  );
}
