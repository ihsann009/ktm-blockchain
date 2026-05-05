export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans selection:bg-primary-500/30 selection:text-primary-900">
      {children}
    </div>
  );
}