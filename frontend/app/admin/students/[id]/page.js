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
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error || 'Student not found'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/admin/students" className="mr-4 text-slate-500 hover:text-slate-700 transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Student Details</h1>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex justify-between items-center">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg leading-6 font-medium text-slate-900">Personal Information</h3>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            student.academicStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {student.academicStatus || 'Unknown'}
          </span>
        </div>
        <div className="px-6 py-5">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">Full Name</dt>
              <dd className="mt-1 text-sm text-slate-900">{student.fullName}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">NIM</dt>
              <dd className="mt-1 text-sm text-slate-900">{student.nim}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">Faculty</dt>
              <dd className="mt-1 text-sm text-slate-900">{student.faculty}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">Department</dt>
              <dd className="mt-1 text-sm text-slate-900">{student.department}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500">Enrollment Year</dt>
              <dd className="mt-1 text-sm text-slate-900">{student.enrollmentYear}</dd>
            </div>
            {student.photoPath && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500">Photo</dt>
                <dd className="mt-1 text-sm text-slate-900 truncate" title={student.photoPath}>
                  {student.photoPath}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-900">Credentials</h3>
        <button
          onClick={handleIssueCredential}
          disabled={actionLoading}
          className="btn-primary w-auto py-2 px-4 inline-flex items-center"
        >
          {actionLoading ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          Issue New Credential
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
        {credentials.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            No credentials found for this student.
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {credentials.map((cred) => (
              <li key={cred.id || cred.credentialId} className="px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      ID: {cred.credentialId}
                    </p>
                    <div className="mt-2 flex items-center text-sm text-slate-500">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="mr-4">
                        Issued: {new Date(cred.issuanceDate).toLocaleDateString()}
                      </span>
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        Expires: {new Date(cred.expirationDate).toLocaleDateString()}
                      </span>
                    </div>
                    {cred.blockchainTxHash && (
                      <div className="mt-2 text-sm text-slate-500 flex items-center">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span className="truncate" title={cred.blockchainTxHash}>
                          Tx: {cred.blockchainTxHash}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col items-end">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mb-3 ${
                      cred.status === 'active' ? 'bg-green-100 text-green-800' : 
                      cred.status === 'revoked' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {cred.status}
                    </span>
                    
                    {cred.status === 'active' && (
                      <button
                        onClick={() => handleRevokeCredential(cred.credentialId)}
                        disabled={actionLoading}
                        className="text-sm font-medium text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}