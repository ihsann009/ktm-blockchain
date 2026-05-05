'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/activity?page=${page}&limit=20`);
      setLogs(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 20, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLogs(newPage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadge = (actionType) => {
    switch (actionType) {
      case 'credential_issued': return 'badge-green';
      case 'credential_revoked': return 'badge-red';
      case 'student_created': return 'badge-blue';
      case 'student_updated': return 'badge-yellow';
      case 'user_login': return 'badge-slate';
      default: return 'badge-slate';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Log</h1>
        <p className="text-slate-500 mt-1">Riwayat semua aktivitas pada sistem</p>
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50/50 p-4 flex items-center text-red-700">
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th scope="col" className="table-header">Waktu</th>
                <th scope="col" className="table-header">Tipe</th>
                <th scope="col" className="table-header">Deskripsi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="spinner h-8 w-8 text-primary-600 mb-4"></div>
                      <p className="text-slate-500 text-sm">Memuat activity log...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-slate-900 font-medium mb-1">Belum ada aktivitas</h3>
                      <p className="text-slate-500 text-sm">Aktivitas akan muncul setelah ada interaksi dengan sistem.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="table-cell text-slate-500 whitespace-nowrap text-xs">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="table-cell">
                      <span className={getActionBadge(log.actionType)}>
                        {(log.actionType || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="table-cell text-slate-700">
                      {log.description || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && logs.length > 0 && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <p className="text-sm text-slate-500">
              Halaman <span className="font-medium text-slate-900">{pagination.page}</span> dari <span className="font-medium text-slate-900">{pagination.totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-secondary px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Prev
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="btn-secondary px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                Next
                <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
