'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import QRCodeComponent from '@/components/qr-code';

export default function StudentCardPage() {
  const { user } = useAuth();
  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.student?.id) return;

    const fetchCredentials = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/credentials/student/${user.student.id}`);
        
        const activeCreds = response.data?.filter(c => c.status === 'active') || [];
        if (activeCreds.length > 0) {
          activeCreds.sort((a, b) => new Date(b.issuanceDate) - new Date(a.issuanceDate));
          setCredential(activeCreds[0]);
        } else if (response.data && response.data.length > 0) {
          response.data.sort((a, b) => new Date(b.issuanceDate) - new Date(a.issuanceDate));
          setCredential(response.data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch credentials:', err);
        setError('Failed to load your digital credential. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCredentials();
  }, [user]);

  if (!user || !user.student) {
    return null;
  }

  const { student } = user;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Active</span>;
      case 'revoked':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">Revoked</span>;
      case 'expired':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">Expired</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">{status}</span>;
    }
  };

  const truncateHash = (hash) => {
    if (!hash) return 'Pending...';
    if (hash.length <= 14) return hash;
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 font-display">My Digital Card</h1>
        <p className="text-slate-500">View your active student credential and verification QR code.</p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-medium text-red-800">Error loading credential</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 rounded-2xl h-[400px] bg-slate-200 animate-pulse"></div>
          <div className="w-full md:w-80 rounded-2xl h-[400px] bg-slate-200 animate-pulse"></div>
        </div>
      ) : !credential ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Credential Found</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            You do not have an active digital credential yet. Please contact the academic administration to request your digital student card.
          </p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 w-full relative overflow-hidden bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200">
            <div className="h-32 bg-primary-600 relative">
              <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMiIgZmlsbD0iI2ZmZmZmZiI+PC9jaXJjbGU+Cjwvc3ZnPg==')]"></div>
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
              <div className="absolute top-6 left-6 text-white font-display font-bold text-xl drop-shadow-md">
                KTM Digital
              </div>
            </div>

            <div className="px-6 pb-6 pt-0 relative">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="-mt-16 z-10 flex-shrink-0">
                  <div className="w-32 h-32 bg-white p-1.5 rounded-2xl shadow-md border border-slate-100 rotate-[-2deg] transition-transform hover:rotate-0">
                    <div className="w-full h-full bg-slate-200 rounded-xl overflow-hidden relative flex items-center justify-center">
                      <span className="text-4xl font-bold text-slate-400">
                        {student.fullName?.charAt(0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 pt-2 sm:pt-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                      {student.fullName}
                    </h2>
                    <p className="text-lg font-medium text-primary-600">
                      NIM. {student.nim}
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div>
                      <span className="block text-slate-400 font-medium mb-1 text-xs uppercase tracking-wider">Faculty</span>
                      <span className="text-slate-800 font-medium">{student.faculty}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-medium mb-1 text-xs uppercase tracking-wider">Department</span>
                      <span className="text-slate-800 font-medium">{student.department}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-medium mb-1 text-xs uppercase tracking-wider">Enrolled</span>
                      <span className="text-slate-800 font-medium">{student.enrollmentYear}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-medium mb-1 text-xs uppercase tracking-wider">Status</span>
                      <span className="text-slate-800 font-medium capitalize">{student.academicStatus}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 border-dashed">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <span className="block text-slate-400 font-medium mb-1 uppercase">Issued Date</span>
                    <span className="text-slate-700 font-medium">{formatDate(credential.issuanceDate)}</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <span className="block text-slate-400 font-medium mb-1 uppercase">Valid Until</span>
                    <span className="text-slate-700 font-medium">{formatDate(credential.expirationDate)}</span>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between bg-slate-900 text-slate-300 px-4 py-2.5 rounded-lg text-xs font-mono">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="truncate">{truncateHash(credential.blockchainTxHash)}</span>
                  </div>
                  <div className="shrink-0 ml-4">
                    {getStatusBadge(credential.status)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-80 flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center text-center">
              <h3 className="font-medium text-slate-900 mb-1">Verification QR Code</h3>
              <p className="text-xs text-slate-500 mb-6">Scan this code to verify the authenticity of this digital credential.</p>
              
              <div className={`p-4 rounded-xl ${credential.status !== 'active' ? 'opacity-50 grayscale' : 'bg-primary-50'}`}>
                <QRCodeComponent 
                  text={credential.credentialId} 
                  size={200}
                />
              </div>

              {credential.status !== 'active' && (
                <div className="mt-4 text-sm text-red-600 font-medium bg-red-50 py-1.5 px-3 rounded-md border border-red-100">
                  QR Code inactive: Credential {credential.status}
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-slate-100 w-full text-xs text-slate-400 font-mono break-all">
                {credential.credentialId}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
