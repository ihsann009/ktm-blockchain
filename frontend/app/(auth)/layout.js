export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-bgbase flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}