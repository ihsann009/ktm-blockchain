'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function StudentDetailPage() {
  const params = useParams();
  const id = params.id;

  const [student, setStudent] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [studentRes, credentialsRes] = await Promise.all([
        api.get(`/students/${id}`),
        api.get(`/credentials/student/${id}`)
      ]);

      setStudent(studentRes.data);
      setCredentials(credentialsRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleIssueCredential = async () => {
    if (!window.confirm('Are you sure you want to issue a new credential for this student?')) {
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);
      await api.post(`/credentials/issue/${id}`);
      await fetchData();
    } catch (err) {
      setActionError(err.message || 'Failed to issue credential');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeCredential = async (credentialId) => {
    if (!window.confirm('Are you sure you want to revoke this credential? This action will be recorded on the blockchain and cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);
      await api.post(`/credentials/revoke/${credentialId}`);
      await fetchData();
    } catch (err) {
      setActionError(err.message || 'Failed to revoke credential');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-slate-200 rounded-full animate-pulse"></div>
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="card p-6 min-h-[300px] flex items-center justify-center">
          <div className="spinner h-8 w-8 text-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card border-red-200 bg-red-50/50 p-6 flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">Error Loading Data</h3>
          <p className="text-slate-500 mb-4">{error || 'Student not found'}</p>
          <Link href="/admin/students" className="btn-secondary">
            Back to Students
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/students" 
          className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Detail Mahasiswa</h1>
          <p className="text-slate-500 text-sm mt-0.5">{student.nim} • {student.fullName}</p>
        </div>
      </div>

      {actionError && (
        <div className="card border-red-200 bg-red-50/80 p-4 flex justify-between items-center text-red-800 shadow-sm shadow-red-100/50">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{actionError}</span>
          </div>
          <button 
            onClick={() => setActionError(null)} 
            className="p-1 rounded-md text-red-500 hover:bg-red-100 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Informasi Pribadi
          </h3>
          <div className="flex items-center gap-2">
            <span className={student.academicStatus === 'active' ? 'badge-green' : 'badge-red'}>
              {student.academicStatus || 'Unknown'}
            </span>
            <Link href={`/admin/students/${id}/edit`} className="btn-secondary text-xs px-3 py-1.5">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
          </div>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-1">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Lengkap</dt>
              <dd className="text-sm font-medium text-slate-900">{student.fullName}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">NIM</dt>
              <dd className="text-sm font-medium text-slate-900">{student.nim}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fakultas</dt>
              <dd className="text-sm font-medium text-slate-900">{student.faculty}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Program Studi</dt>
              <dd className="text-sm font-medium text-slate-900">{student.department}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tahun Masuk</dt>
              <dd className="text-sm font-medium text-slate-900">{student.enrollmentYear}</dd>
            </div>
            {student.photoPath && (
              <div className="space-y-1">
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Foto</dt>
                <dd className="text-sm font-medium text-slate-900 truncate" title={student.photoPath}>
                  {student.photoPath}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Credentials</h3>
            <p className="text-slate-500 text-sm mt-0.5">Riwayat KTM digital untuk mahasiswa ini</p>
          </div>
          <button
            onClick={handleIssueCredential}
            disabled={actionLoading}
            className="btn-primary w-full sm:w-auto"
          >
            {actionLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Issue New Credential
              </>
            )}
          </button>
        </div>

        {credentials.length === 0 ? (
          <div className="card p-12 flex flex-col items-center justify-center text-center bg-slate-50/50 border-dashed">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-slate-900 font-medium mb-1">Belum ada credential</h4>
            <p className="text-slate-500 text-sm">Klik tombol di atas untuk menerbitkan KTM digital pertama.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {credentials.map((cred) => (
              <div key={cred.id || cred.credentialId} className="card p-5 hover:border-slate-300 transition-colors">
                <div className="flex flex-col sm:flex-row gap-6">
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Credential ID</span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm text-slate-700 bg-slate-50 px-2 py-1 rounded inline-block">
                          {cred.credentialId}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(cred.credentialId);
                            setCopiedId(cred.credentialId);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          title="Copy Credential ID"
                        >
                          {copiedId === cred.credentialId ? (
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm">
                      <div className="flex items-center text-slate-600">
                        <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium mr-1">Issued:</span>
                        {new Date(cred.issuanceDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-slate-600">
                        <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium mr-1">Expires:</span>
                        {new Date(cred.expirationDate).toLocaleDateString()}
                      </div>
                    </div>

                    {cred.blockchainTxHash && (
                      <div className="flex items-center text-sm text-slate-600 bg-blue-50/50 px-3 py-2 rounded-md border border-blue-100">
                        <svg className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span className="font-medium mr-2">Tx:</span>
                        <span className="font-mono text-xs truncate" title={cred.blockchainTxHash}>
                          {cred.blockchainTxHash}
                        </span>
                      </div>
                    )}
                  </div>

                  
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6 min-w-[140px]">
                    <div className="flex flex-col gap-2 items-start sm:items-end">
                      <span className={
                        cred.status === 'active' ? 'badge-green' : 
                        cred.status === 'revoked' ? 'badge-red' : 'badge-yellow'
                      }>
                        {cred.status}
                      </span>

                      {cred.blockchainTxHash ? (
                        <span className="badge-blue flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          On-Chain
                        </span>
                      ) : (
                        <span className="badge-yellow flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Pending
                        </span>
                      )}
                    </div>
                    
                    {cred.status === 'active' && (
                      <button
                        onClick={() => handleRevokeCredential(cred.credentialId)}
                        disabled={actionLoading}
                        className="btn-danger w-full sm:w-auto mt-auto"
                      >
                        {actionLoading ? 'Memproses...' : 'Revoke'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

