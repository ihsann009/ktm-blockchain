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
        <div className={`card border-2 ${borderColor} overflow-hidden animate-in fade-in zoom-in-95 duration-300`}>
          <div className={`${headerBg} px-6 md:px-8 py-5 border-b ${headerBorder} flex items-center gap-4`}>
            <div className={`w-12 h-12 ${iconBg} text-white rounded-full flex items-center justify-center shrink-0 shadow-sm`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className={`text-xl font-bold tracking-tight ${titleColor}`}>
                {isFullyVerified ? 'Credential Valid' : 'Valid (Belum Ter-anchor)'}
              </h2>
              <p className={`text-sm ${descColor} font-medium mt-0.5`}>
                {isFullyVerified
                  ? 'Digital signature dan integritas blockchain terverifikasi.'
                  : 'Digital signature terverifikasi. Proses anchoring blockchain sedang pending.'}
              </p>
            </div>
          </div>

          {!isFullyVerified && (
            <div className="mx-6 md:mx-8 mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 shadow-sm">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm text-amber-800">
                <p className="font-bold">Blockchain belum diverifikasi</p>
                <p className="text-amber-700 mt-1 leading-relaxed">Credential ini belum di-anchor ke blockchain. Signature valid, namun integritas on-chain belum dapat dipastikan saat ini.</p>
              </div>
            </div>
          )}
          
          <div className="p-6 md:p-8">
            <h3 className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-5 flex items-center gap-2">
              <span className="h-px bg-slate-200 flex-1"></span>
              Identitas Mahasiswa
              <span className="h-px bg-slate-200 flex-1"></span>
            </h3>
            
            {student ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5">Nama Lengkap</p>
                  <p className="font-bold text-slate-900 text-lg">{student.fullName}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5">Nomor Induk Mahasiswa</p>
                  <p className="font-mono font-semibold text-primary-700">{student.nim}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5">Fakultas / Program Studi</p>
                  <p className="font-semibold text-slate-800">{student.faculty} / {student.department}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5">Status</p>
                  <p className="font-semibold text-slate-800 capitalize flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isFullyVerified ? 'bg-emerald-500' : 'bg-blue-500'} shadow-sm`}></span>
                    {student.academicStatus || 'Aktif'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic text-center py-4">Detail mahasiswa tidak tersedia.</p>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isFullyVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-600 font-medium">Signature: <span className="font-bold text-emerald-700">Verified</span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isFullyVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {isFullyVerified ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-slate-600 font-medium">Blockchain: <span className={`font-bold ${isFullyVerified ? 'text-emerald-700' : 'text-amber-700'}`}>{isFullyVerified ? 'Verified' : 'Not Anchored'}</span></span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <button 
                onClick={resetVerification}
                className="btn-secondary"
              >
                Scan Lagi
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
      },
      orange: {
        border: 'border-orange-500',
        bg: 'bg-orange-50',
        iconBg: 'bg-orange-500',
        text: 'text-orange-800',
        descText: 'text-orange-600',
        divider: 'border-orange-100',
      },
      yellow: {
        border: 'border-yellow-500',
        bg: 'bg-yellow-50',
        iconBg: 'bg-yellow-500',
        text: 'text-yellow-800',
        descText: 'text-yellow-700',
        divider: 'border-yellow-200',
      }
    };

    const theme = colorMap[config.color];

    return (
      <div className={`card border-2 ${theme.border} overflow-hidden animate-in fade-in zoom-in-95 duration-300`}>
        <div className={`${theme.bg} px-6 md:px-8 py-6 border-b ${theme.divider} flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5`}>
          <div className={`w-14 h-14 ${theme.iconBg} text-white rounded-full flex items-center justify-center shrink-0 shadow-md ring-4 ring-white/50`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              {config.icon}
            </svg>
          </div>
          <div className="pt-1">
            <h2 className={`text-2xl font-extrabold ${theme.text} mb-1.5 tracking-tight`}>{config.title}</h2>
            <p className={`text-[15px] ${theme.descText} font-medium leading-relaxed max-w-md`}>{config.desc}</p>
          </div>
        </div>
        
        <div className="p-8 bg-white flex flex-col items-center">
          <p className="text-slate-500 text-sm mb-6 text-center max-w-sm">
            Pastikan Anda melakukan scan pada QR Code KTM Digital yang valid dan resmi.
          </p>
          <button 
            onClick={resetVerification}
            className="btn-secondary"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-8 md:gap-10">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Verifikasi Credential</h2>
        <p className="text-slate-500 max-w-lg mx-auto text-[15px] leading-relaxed">
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
        <div className="card overflow-hidden">
          <div className="p-6 sm:p-8 md:p-10 bg-slate-50/50">
            <div className="max-w-xs mx-auto">
                <QrScanner onScanSuccess={handleScanSuccess} />
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center px-8" aria-hidden="true">
              <div className="w-full border-t border-slate-200 border-dashed"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-xs font-bold text-slate-400 uppercase tracking-widest">
                Atau masukkan manual
              </span>
            </div>
          </div>
          
          <div className="p-6 sm:p-8 md:p-10 bg-white">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
                placeholder="Masukkan Credential ID (e.g. 550e8400-e29b-...)"
                className="flex-grow px-5 py-3.5 rounded-xl border-2 border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-mono text-sm bg-slate-50 focus:bg-white text-slate-800 placeholder:text-slate-400"
                disabled={isVerifying}
              />
              <button
                type="submit"
                disabled={isVerifying || !credentialId.trim()}
                className="btn-primary flex items-center justify-center min-w-[140px] shadow-md shadow-primary-600/20"
              >
                {isVerifying ? (
                  <span className="spinner w-5 h-5 border-white"></span>
                ) : (
                  'Verifikasi'
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
