'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import QrScanner from '@/components/qr-scanner';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [credentialId, setCredentialId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // Auto-verify if ?id= query param is present
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
      const borderColor = isFullyVerified ? 'border-green-500' : 'border-blue-500';
      const headerBg = isFullyVerified ? 'bg-green-50' : 'bg-blue-50';
      const headerBorder = isFullyVerified ? 'border-green-100' : 'border-blue-100';
      const iconBg = isFullyVerified ? 'bg-green-500' : 'bg-blue-500';
      const titleColor = isFullyVerified ? 'text-green-800' : 'text-blue-800';
      const descColor = isFullyVerified ? 'text-green-600' : 'text-blue-600';

      return (
        <div className={`bg-white border-2 ${borderColor} rounded-xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
          <div className={`${headerBg} px-6 py-4 border-b ${headerBorder} flex items-center gap-3`}>
            <div className={`w-10 h-10 ${iconBg} text-white rounded-full flex items-center justify-center shrink-0 shadow-sm`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className={`text-lg font-bold ${titleColor}`}>
                {isFullyVerified ? 'Valid Credential' : 'Valid Credential (Unanchored)'}
              </h2>
              <p className={`text-sm ${descColor} font-medium`}>
                {isFullyVerified
                  ? 'Digital signature and blockchain integrity verified.'
                  : 'Digital signature verified. Blockchain anchoring pending.'}
              </p>
            </div>
          </div>

          {!isFullyVerified && (
            <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm text-amber-800">
                <p className="font-medium">Blockchain not verified</p>
                <p className="text-amber-700 mt-0.5">This credential has not been anchored to the blockchain yet. Signature is valid but on-chain integrity cannot be confirmed.</p>
              </div>
            </div>
          )}
          
          <div className="p-6">
            <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-4">Student Identity</h3>
            
            {student ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Full Name</p>
                  <p className="font-semibold text-slate-800">{student.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Student ID (NIM)</p>
                  <p className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded inline-block">{student.nim}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Faculty / Department</p>
                  <p className="text-slate-800">{student.faculty} / {student.department}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Status</p>
                  <p className="text-slate-800 capitalize">
                    <span className={`inline-block w-2 h-2 rounded-full ${isFullyVerified ? 'bg-green-500' : 'bg-blue-500'} mr-2`}></span>
                    {student.academicStatus || 'Active'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic">Student details not available.</p>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-6 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isFullyVerified ? 'bg-green-500' : 'bg-green-500'}`}></span>
                  <span className="text-slate-500">Signature: <span className="font-medium text-green-700">Verified</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isFullyVerified ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                  <span className="text-slate-500">Blockchain: <span className={`font-medium ${isFullyVerified ? 'text-green-700' : 'text-amber-700'}`}>{isFullyVerified ? 'Verified' : 'Not Anchored'}</span></span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center">
              <button 
                onClick={resetVerification}
                className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 rounded"
              >
                Scan Another Credential
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
        title: 'Credential Not Found',
        desc: 'The scanned credential does not exist in the database.'
      },
      invalid_signature: {
        color: 'red',
        icon: (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        ),
        title: 'Invalid Signature',
        desc: 'Digital signature verification failed. The credential may have been tampered with.'
      },
      hash_mismatch: {
        color: 'red',
        icon: (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        ),
        title: 'Integrity Check Failed',
        desc: 'Hash mismatch! The credential data does not match the anchor on the blockchain.'
      },
      revoked: {
        color: 'orange',
        icon: (
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        ),
        title: 'Credential Revoked',
        desc: 'This credential has been permanently revoked by the issuer.'
      },
      expired: {
        color: 'yellow',
        icon: (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        ),
        title: 'Credential Expired',
        desc: 'This credential is no longer valid because its expiration date has passed.'
      }
    };

    const config = errorCards[status] || {
      color: 'red',
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      title: 'Verification Failed',
      desc: `Unknown error status: ${status}`
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
      <div className={`bg-white border-2 ${theme.border} rounded-xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        <div className={`${theme.bg} px-6 py-5 border-b ${theme.divider} flex items-start sm:items-center gap-4`}>
          <div className={`w-12 h-12 ${theme.iconBg} text-white rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1 sm:mt-0`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              {config.icon}
            </svg>
          </div>
          <div>
            <h2 className={`text-xl font-bold ${theme.text} mb-1`}>{config.title}</h2>
            <p className={`text-sm ${theme.descText} font-medium leading-snug`}>{config.desc}</p>
          </div>
        </div>
        
        <div className="p-6 bg-white flex flex-col items-center">
          <p className="text-slate-500 text-sm mb-6 text-center max-w-sm">
            Please ensure you are scanning a valid KTM Digital QR code.
          </p>
          <button 
            onClick={resetVerification}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium px-6 py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Verify Student Credential</h2>
        <p className="text-slate-500">
          Scan the QR code on a student's digital card or enter the Credential ID manually to verify its authenticity on the blockchain.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r text-red-700 animate-in fade-in slide-in-from-top-2">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {result ? (
        getResultUI()
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 sm:p-8">
            <QrScanner onScanSuccess={handleScanSuccess} />
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center px-8" aria-hidden="true">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm font-medium text-slate-400 uppercase tracking-widest">
                Or enter manually
              </span>
            </div>
          </div>
          
          <div className="p-6 sm:p-8 bg-slate-50/50">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
                placeholder="Enter Credential ID (e.g. 550e8400-e29b-...)"
                className="flex-grow px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                disabled={isVerifying}
              />
              <button
                type="submit"
                disabled={isVerifying || !credentialId.trim()}
                className="bg-slate-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
              >
                {isVerifying ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Verify'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
