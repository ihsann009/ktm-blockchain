'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import QrScanner from '@/components/qr-scanner';

function VerifyContent() {
  const searchParams = useSearchParams();
  const [credentialId, setCredentialId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      setCredentialId(idFromUrl);
      verifyCredential(idFromUrl);
    }
  }, [searchParams]);

  const verifyCredential = async (idToVerify) => {
    if (!idToVerify || !idToVerify.trim()) {
      setError('Please enter a credential ID');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credentialId: idToVerify.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Verification failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred during verification');
    } finally {
      setIsVerifying(false);
    }
  };

  const extractCredentialId = (text) => {
    try {
      const url = new URL(text);
      const idParam = url.searchParams.get('id');
      if (idParam) return idParam;
    } catch {}
    return text;
  };

  const handleScanSuccess = (decodedText) => {
    const id = extractCredentialId(decodedText);
    setCredentialId(id);
    verifyCredential(id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    verifyCredential(credentialId);
  };

  const resetVerification = () => {
    setResult(null);
    setError(null);
    setCredentialId('');
  };

  const getResultUI = () => {
    if (!result) return null;

    const { result: status, student } = result;

    if (status === 'valid' || status === 'valid_unanchored') {
      const isFullyVerified = status === 'valid';
      const borderColor = isFullyVerified ? 'border-emerald-500' : 'border-blue-500';
      const headerBg = isFullyVerified ? 'bg-emerald-50' : 'bg-blue-50';
      const headerBorder = isFullyVerified ? 'border-emerald-100' : 'border-blue-100';
      const iconBg = isFullyVerified ? 'bg-emerald-500' : 'bg-blue-500';
      const titleColor = isFullyVerified ? 'text-emerald-800' : 'text-blue-800';
      const descColor = isFullyVerified ? 'text-emerald-600' : 'text-blue-600';

      return (
        <div className={`card border-2 ${borderColor} overflow-hidden shadow-xl ${isFullyVerified ? 'shadow-emerald-500/10' : 'shadow-blue-500/10'} animate-in fade-in zoom-in-95 duration-500 relative`}>
          {isFullyVerified && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+CjxwYXRoIGQ9Ik00MCAwTDgwIDQwbC00MCA0MEwwIDQwbDQwLTQweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDE2LCAxODUsIDEyOSwgMC4wMikiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-50 pointer-events-none z-0 transform rotate-12"></div>
          )}
          <div className={`${headerBg} px-6 md:px-8 py-6 border-b ${headerBorder} flex items-center gap-5 relative z-10`}>
            <div className={`relative w-14 h-14 ${iconBg} text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-${isFullyVerified ? 'emerald' : 'blue'}-500/30 transform -rotate-3`}>
              <div className="absolute inset-0 bg-white opacity-20 rounded-2xl blur"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className={`text-2xl font-extrabold tracking-tight ${titleColor}`}>
                {isFullyVerified ? 'Credential Valid' : 'Valid (Belum Ter-anchor)'}
              </h2>
              <p className={`text-sm ${descColor} font-medium mt-1 opacity-90`}>
                {isFullyVerified
                  ? 'Digital signature dan integritas blockchain terverifikasi.'
                  : 'Digital signature terverifikasi. Proses anchoring blockchain sedang pending.'}
              </p>
            </div>
            {isFullyVerified && (
               <div className="ml-auto opacity-20 hidden sm:block">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-emerald-600 transform rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                 </svg>
               </div>
            )}
          </div>

          {!isFullyVerified && (
            <div className="mx-6 md:mx-8 mt-5 p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-3 shadow-sm relative z-10">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm text-amber-900">
                <p className="font-bold">Blockchain belum diverifikasi</p>
                <p className="text-amber-700/90 mt-1 leading-relaxed">Credential ini belum di-anchor ke blockchain. Signature valid, namun integritas on-chain belum dapat dipastikan saat ini.</p>
              </div>
            </div>
          )}
          
          <div className="p-6 md:p-8 bg-white relative z-10">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-6 flex items-center gap-4">
              <span className="h-px bg-slate-100 flex-1"></span>
              Identitas Mahasiswa
              <span className="h-px bg-slate-100 flex-1"></span>
            </h3>
            
            {student ? (
              <div className="flex flex-col sm:flex-row gap-8">
                <div className="flex-shrink-0 flex justify-center sm:justify-start">
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-br from-slate-200 to-slate-100 rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition duration-500"></div>
                    <div className="w-32 h-40 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shadow-md relative z-10">
                      {student.photoPath ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'}/${student.photoPath}`}
                          alt={student.fullName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                      {isFullyVerified && (
                        <div className="absolute bottom-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-lg border-2 border-white transform rotate-12">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50 shadow-sm transition-colors hover:bg-slate-50/50">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Nama Lengkap</p>
                    <p className="font-bold text-slate-900 text-lg leading-tight">{student.fullName}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50 shadow-sm transition-colors hover:bg-slate-50/50">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Nomor Induk Mahasiswa</p>
                    <p className="font-mono font-bold text-primary-700 text-lg leading-tight">{student.nim}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50 shadow-sm transition-colors hover:bg-slate-50/50">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Fakultas / Program Studi</p>
                    <p className="font-semibold text-slate-800">{student.faculty} <br/><span className="text-slate-500 font-medium text-sm">{student.department}</span></p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50 shadow-sm transition-colors hover:bg-slate-50/50">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Status</p>
                    <p className="font-semibold text-slate-800 capitalize flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isFullyVerified ? 'bg-emerald-400' : 'bg-blue-400'} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isFullyVerified ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                      </span>
                      {student.academicStatus || 'Aktif'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic text-center py-4">Detail mahasiswa tidak tersedia.</p>
            )}

            <div className="mt-10 pt-6 border-t border-slate-100/80">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 w-full">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isFullyVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Digital Signature</span>
                      <span className="text-sm font-bold text-emerald-700">Verified & Valid</span>
                    </div>
                  </div>
                  
                  <div className="hidden sm:block h-8 w-px bg-slate-200"></div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isFullyVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      {isFullyVerified ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Blockchain Anchor</span>
                      <span className={`text-sm font-bold ${isFullyVerified ? 'text-emerald-700' : 'text-amber-700'}`}>{isFullyVerified ? 'Verified & Intact' : 'Pending Anchoring'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <button 
                onClick={resetVerification}
                className="btn-secondary min-w-[160px]"
              >
                Scan Credentials Lain
              </button>
            </div>
          </div>
        </div>
      );
    }

    const errorCards = {
      not_found: {
        color: 'red',
        icon: (
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        ),
        title: 'Credential Tidak Ditemukan',
        desc: 'Credential yang discan tidak terdaftar di dalam database sistem.'
      },
      invalid_signature: {
        color: 'red',
        icon: (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        ),
        title: 'Signature Tidak Valid',
        desc: 'Verifikasi digital signature gagal. Data credential kemungkinan telah dimanipulasi.'
      },
      hash_mismatch: {
        color: 'red',
        icon: (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        ),
        title: 'Integritas Gagal',
        desc: 'Hash mismatch! Data credential tidak cocok dengan data yang di-anchor pada blockchain.'
      },
      revoked: {
        color: 'orange',
        icon: (
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        ),
        title: 'Credential Dicabut',
        desc: 'Credential ini telah dicabut secara permanen oleh pihak institusi penerbit.'
      },
      expired: {
        color: 'yellow',
        icon: (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        ),
        title: 'Credential Kedaluwarsa',
        desc: 'Masa berlaku credential ini telah habis dan tidak lagi valid.'
      }
    };

    const config = errorCards[status] || {
      color: 'red',
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      title: 'Verifikasi Gagal',
      desc: `Status error tidak diketahui: ${status}`
    };

    const colorMap = {
      red: {
        border: 'border-red-500',
        bg: 'bg-red-50',
        iconBg: 'bg-red-500',
        text: 'text-red-800',
        descText: 'text-red-600',
        divider: 'border-red-100',
        shadowColor: 'shadow-red-500/10'
      },
      orange: {
        border: 'border-orange-500',
        bg: 'bg-orange-50',
        iconBg: 'bg-orange-500',
        text: 'text-orange-800',
        descText: 'text-orange-600',
        divider: 'border-orange-100',
        shadowColor: 'shadow-orange-500/10'
      },
      yellow: {
        border: 'border-yellow-500',
        bg: 'bg-yellow-50',
        iconBg: 'bg-yellow-500',
        text: 'text-yellow-800',
        descText: 'text-yellow-700',
        divider: 'border-yellow-200',
        shadowColor: 'shadow-yellow-500/10'
      }
    };

    const theme = colorMap[config.color];

    return (
      <div className={`card border-2 ${theme.border} overflow-hidden shadow-2xl ${theme.shadowColor} animate-in fade-in zoom-in-95 duration-500 relative`}>
        <div className={`${theme.bg} px-6 md:px-10 py-8 border-b ${theme.divider} flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 relative overflow-hidden`}>
          <div className={`absolute -right-8 -top-8 w-32 h-32 ${theme.iconBg} opacity-5 rounded-full blur-2xl`}></div>
          <div className={`w-16 h-16 ${theme.iconBg} text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-${config.color}-500/30 ring-4 ring-white/60 transform -rotate-3 relative z-10`}>
            <div className="absolute inset-0 bg-white opacity-20 rounded-2xl blur-sm"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              {config.icon}
            </svg>
          </div>
          <div className="pt-2 relative z-10">
            <h2 className={`text-2xl font-extrabold ${theme.text} mb-2 tracking-tight`}>{config.title}</h2>
            <p className={`text-[15px] ${theme.descText} font-medium leading-relaxed max-w-md`}>{config.desc}</p>
          </div>
        </div>
        
        <div className="p-8 md:p-10 bg-white flex flex-col items-center relative">
          <div className="w-16 h-1 bg-slate-100 rounded-full mb-8"></div>
          <p className="text-slate-500 text-[15px] mb-8 text-center max-w-sm leading-relaxed">
            Pastikan Anda melakukan scan pada QR Code KTM Digital yang valid dan resmi.
          </p>
          <button 
            onClick={resetVerification}
            className="btn-secondary min-w-[160px] shadow-sm hover:shadow"
          >
            Coba Scan Lagi
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-8 md:gap-10">
      <div className="text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 w-24 h-24 bg-primary-100 rounded-full blur-2xl opacity-50 z-0"></div>
        <div className="relative z-10 flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500 rounded-full blur-md opacity-30 animate-pulse"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-xl rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white -rotate-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-2 border-slate-50 flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight relative z-10">Verifikasi Credential</h2>
        <p className="text-slate-500 max-w-lg mx-auto text-[15px] leading-relaxed relative z-10">
          Scan QR code pada KTM Digital mahasiswa atau masukkan Credential ID secara manual untuk memverifikasi keasliannya pada blockchain.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl text-red-800 shadow-sm animate-in fade-in slide-in-from-top-2 flex items-start gap-3">
           <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {result ? (
        getResultUI()
      ) : (
        <div className="card overflow-hidden shadow-xl shadow-slate-200/50 border-slate-200/60">
          <div className="p-6 sm:p-8 md:p-10 bg-slate-50 relative">
            <div className="absolute top-4 right-4 flex gap-2">
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md shadow-sm border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                256-bit Encrypted
              </div>
            </div>
            
            <div className="max-w-[280px] mx-auto">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-400 to-emerald-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-xl -translate-x-1 -translate-y-1 z-10"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-xl translate-x-1 -translate-y-1 z-10"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-xl -translate-x-1 translate-y-1 z-10"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-xl translate-x-1 translate-y-1 z-10"></div>
                  <div className="rounded-xl overflow-hidden bg-slate-900 relative">
                    <QrScanner onScanSuccess={handleScanSuccess} />
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="w-full h-0.5 bg-primary-400 shadow-[0_0_8px_2px_rgba(16,185,129,0.5)] animate-[scan_2.5s_ease-in-out_infinite]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative bg-white">
            <div className="absolute inset-0 flex items-center px-8" aria-hidden="true">
              <div className="w-full border-t border-slate-200 border-dashed"></div>
            </div>
            <div className="relative flex justify-center -translate-y-1/2">
              <span className="px-4 bg-white text-[11px] font-bold text-slate-400 uppercase tracking-widest border border-slate-200 rounded-full py-1 shadow-sm">
                Atau masukkan manual
              </span>
            </div>
          </div>
          
          <div className="p-6 sm:p-8 md:p-10 bg-white pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={credentialId}
                  onChange={(e) => setCredentialId(e.target.value)}
                  placeholder="Masukkan Credential ID (e.g. 550e8400-...)"
                  className="w-full pl-11 pr-5 py-3.5 rounded-xl border-2 border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-mono text-sm bg-slate-50 focus:bg-white text-slate-800 placeholder:text-slate-400"
                  disabled={isVerifying}
                />
              </div>
              <button
                type="submit"
                disabled={isVerifying || !credentialId.trim()}
                className="btn-primary flex items-center justify-center min-w-[140px] shadow-md shadow-primary-600/20 h-[52px]"
              >
                {isVerifying ? (
                  <span className="spinner w-5 h-5 border-white"></span>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verifikasi
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyPageWithSuspense() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><div className="spinner w-8 h-8 border-primary-600"></div></div>}>
      <VerifyContent />
    </Suspense>
  )
}
