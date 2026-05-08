'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import QRCodeComponent from '@/components/qr-code';

export default function StudentCardPage() {
  const { user } = useAuth();
  const [credential, setCredential] = useState(null);
  const [allCredentials, setAllCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.student?.id) return;

    const fetchCredentials = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/credentials/student/${user.student.id}`);
        const creds = response.data || [];
        creds.sort((a, b) => new Date(b.issuanceDate) - new Date(a.issuanceDate));
        setAllCredentials(creds);

        const activeCreds = creds.filter(c => c.status === 'active');
        if (activeCreds.length > 0) {
          setCredential(activeCreds[0]);
        } else if (creds.length > 0) {
          setCredential(creds[0]);
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
        return <span className="badge-green">Active</span>;
      case 'revoked':
        return <span className="badge-red">Revoked</span>;
      case 'expired':
        return <span className="badge-yellow">Expired</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 shadow-sm">{status}</span>;
    }
  };

  const truncateHash = (hash) => {
    if (!hash) return 'Pending...';
    if (hash.length <= 14) return hash;
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  const downloadProof = () => {
    if (!credential) return;
    const proof = {
      _description: "Bukti Credential KTM Digital - Simpan file ini sebagai bukti independen",
      credentialId: credential.credentialId,
      jwtToken: credential.jwtToken,
      credentialHash: credential.credentialHash,
      blockchainTxHash: credential.blockchainTxHash || null,
      status: credential.status,
      issuanceDate: credential.issuanceDate,
      expirationDate: credential.expirationDate,
      student: {
        nim: user?.student?.nim,
        fullName: user?.student?.fullName,
        faculty: user?.student?.faculty,
        department: user?.student?.department,
      },
      downloadedAt: new Date().toISOString(),
      verifyInstructions: {
        step1: "Hitung SHA-256 dari field 'jwtToken' di atas",
        step2: "Bandingkan hasilnya dengan field 'credentialHash'",
        step3: "Cek blockchain Polygon Amoy: query contract getCredential(credentialId)",
        step4: "Hash on-chain harus cocok dengan credentialHash",
        polygonScan: credential.blockchainTxHash 
          ? `https://amoy.polygonscan.com/tx/${credential.blockchainTxHash}`
          : null,
      }
    };
    const blob = new Blob([JSON.stringify(proof, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credential-proof-${credential.credentialId.substring(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
    <div className="w-full">
      <div className="mb-8 md:mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Kartu Digital Saya</h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base">Akses credential identitas mahasiswa dan QR Code verifikasi Anda.</p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start gap-3 shadow-sm animate-in fade-in">
          <svg className="w-5 h-5 mt-0.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-red-800">Gagal memuat credential</h3>
            <p className="text-sm mt-1 text-red-600">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          <div className="flex-1 rounded-2xl h-[420px] bg-slate-200/50 animate-pulse border border-slate-100"></div>
          <div className="w-full lg:w-80 rounded-2xl h-[420px] bg-slate-200/50 animate-pulse border border-slate-100"></div>
        </div>
      ) : !credential ? (
        <div className="card p-10 text-center flex flex-col items-center justify-center min-h-[400px] border-dashed border-2 border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-5 shadow-sm border border-slate-100">
            <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">Belum Ada Credential</h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
            Anda belum memiliki credential digital yang aktif. Silakan hubungi administrasi akademik untuk penerbitan KTM Digital Anda.
          </p>
        </div>
      ) : (
        <>
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start">
          <div className="flex-1 w-full relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-200 group">
            <div className="h-36 bg-gradient-to-br from-primary-600 to-primary-700 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGwyMCAyME0yMCAwbC0yMCAyMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')", backgroundSize: '40px 40px' }}></div>
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
              
              <div className="absolute top-6 left-6 flex items-center gap-2 drop-shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="text-white font-bold text-lg tracking-wide">
                  KTM Digital
                </span>
              </div>
            </div>

            <div className="px-6 md:px-8 pb-8 pt-0 relative">
              <div className="flex flex-col sm:flex-row gap-6 md:gap-8">
                <div className="-mt-16 z-10 flex-shrink-0 self-start sm:self-auto">
                  <div className="w-32 h-32 md:w-36 md:h-36 bg-white p-2 rounded-full shadow-sm border border-slate-100 group-hover:-translate-y-1 transition-transform duration-300">
                    <div className="w-full h-full bg-slate-100 rounded-full overflow-hidden relative flex items-center justify-center border border-slate-200 shadow-inner">
                      <span className="text-5xl font-bold text-slate-300">
                        {student.fullName?.charAt(0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 pt-2 sm:pt-4">
                  <div className="flex flex-col gap-1.5">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
                      {student.fullName}
                    </h2>
                    <p className="text-lg font-mono font-semibold text-primary-600 bg-primary-50 self-start px-2.5 py-0.5 rounded-md border border-primary-100">
                      {student.nim}
                    </p>
                  </div>

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm">
                    <div>
                      <span className="block text-slate-400 font-semibold mb-1 text-[11px] uppercase tracking-wider">Fakultas</span>
                      <span className="text-slate-800 font-medium">{student.faculty}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-semibold mb-1 text-[11px] uppercase tracking-wider">Program Studi</span>
                      <span className="text-slate-800 font-medium">{student.department}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-semibold mb-1 text-[11px] uppercase tracking-wider">Tahun Masuk</span>
                      <span className="text-slate-800 font-medium">{student.enrollmentYear}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-semibold mb-1 text-[11px] uppercase tracking-wider">Status Akademik</span>
                      <span className="text-slate-800 font-medium capitalize">{student.academicStatus}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 border-dashed">
                <div className="grid grid-cols-2 gap-4 text-xs mb-5">
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 shadow-sm">
                    <span className="block text-slate-400 font-bold mb-1.5 text-[10px] uppercase tracking-widest">Diterbitkan</span>
                    <span className="text-slate-700 font-semibold">{formatDate(credential.issuanceDate)}</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 shadow-sm">
                    <span className="block text-slate-400 font-bold mb-1.5 text-[10px] uppercase tracking-widest">Berlaku Hingga</span>
                    <span className="text-slate-700 font-semibold">{formatDate(credential.expirationDate)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between bg-slate-800 text-slate-300 px-4 py-3 rounded-xl text-xs font-mono shadow-inner border border-slate-700">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {credential.blockchainTxHash ? (
                      <>
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="truncate opacity-90">{truncateHash(credential.blockchainTxHash)}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-amber-300 font-medium">Pending Anchor</span>
                      </>
                    )}
                  </div>
                  <div className="shrink-0 ml-4">
                    {getStatusBadge(credential.status)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-80 flex flex-col gap-4">
            <div className="card p-6 md:p-8 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1 tracking-tight">QR Code Verifikasi</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">Scan untuk memverifikasi keaslian credential ini secara on-chain.</p>
              
              <div className={`p-5 rounded-2xl border ${credential.status !== 'active' ? 'border-slate-200 bg-slate-50 opacity-50 grayscale' : 'border-primary-100 bg-white shadow-sm'}`}>
                <QRCodeComponent 
                  text={`${process.env.NEXT_PUBLIC_VERIFY_URL || 'http://localhost:3002'}/verify?id=${credential.credentialId}`} 
                  size={200}
                />
              </div>

              {credential.status !== 'active' && (
                <div className="mt-5 w-full text-xs text-red-700 font-semibold bg-red-50 py-2.5 px-3 rounded-lg border border-red-100 flex items-center justify-center gap-1.5">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  QR Inaktif: {credential.status}
                </div>
              )}
              
               <div className="mt-6 pt-5 border-t border-slate-100 w-full flex flex-col gap-1.5">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Credential ID</span>
                 <div className="flex items-center gap-2">
                   <span className="text-xs text-slate-600 font-mono break-all bg-slate-50 px-2 py-1.5 rounded-md border border-slate-100 flex-1">{credential.credentialId}</span>
                   <button
                     onClick={() => {
                       navigator.clipboard.writeText(credential.credentialId);
                       setCopied(true);
                       setTimeout(() => setCopied(false), 2000);
                     }}
                     className="shrink-0 p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                     title="Copy Credential ID"
                   >
                     {copied ? (
                       <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     ) : (
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                     )}
                   </button>
                 </div>
               </div>

               <div className="mt-4 w-full">
                 <button
                   onClick={downloadProof}
                   className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium text-sm rounded-lg border border-primary-200 transition-colors"
                 >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                   </svg>
                   Download Bukti Credential
                 </button>
                 <p className="text-[10px] text-slate-400 mt-1.5 text-center">Simpan sebagai bukti independen (JWT + hash + blockchain proof)</p>
               </div>
            </div>
          </div>
        </div>

        {allCredentials.length > 1 && (
          <div className="w-full mt-8">
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Riwayat Credential</h3>
                <p className="text-xs text-slate-500 mt-0.5">Semua credential yang pernah diterbitkan untuk Anda</p>
              </div>
              <div className="divide-y divide-slate-50">
                {allCredentials.map((cred, idx) => (
                  <div key={cred.id} className={`px-6 py-4 flex items-center gap-4 ${cred.credentialId === credential?.credentialId ? 'bg-primary-50/30' : 'hover:bg-slate-50/50'} transition-colors`}>
                    <div className="relative">
                      <div className={`w-3 h-3 rounded-full ${cred.status === 'active' ? 'bg-green-500' : cred.status === 'revoked' ? 'bg-red-500' : 'bg-yellow-500'} ring-4 ring-white`}></div>
                      {idx < allCredentials.length - 1 && (
                        <div className="absolute top-4 left-1.5 w-px h-8 bg-slate-200"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800 truncate font-mono">
                          {cred.credentialId.substring(0, 8)}...
                        </span>
                        <span className={cred.status === 'active' ? 'badge-green' : cred.status === 'revoked' ? 'badge-red' : 'badge-yellow'}>
                          {cred.status}
                        </span>
                        {cred.credentialId === credential?.credentialId && (
                          <span className="badge-blue">Current</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Diterbitkan {formatDate(cred.issuanceDate)}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {cred.blockchainTxHash ? (
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          On-Chain
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600 font-medium">Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
}
