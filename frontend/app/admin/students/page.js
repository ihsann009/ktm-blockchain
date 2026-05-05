'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchStudents = async (page = 1, query = search) => {
    try {
      setLoading(true);
      const searchParam = query ? `&search=${encodeURIComponent(query)}` : '';
      const res = await api.get(`/students?page=${page}&limit=${pagination.limit}${searchParam}`);
      setStudents(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(1, '');
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => {
      fetchStudents(1, value);
    }, 400));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchStudents(newPage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mahasiswa</h1>
          <p className="text-slate-500 mt-1">Kelola data dan credential mahasiswa</p>
        </div>
        <Link 
          href="/admin/students/new" 
          className="btn-primary inline-flex items-center w-full sm:w-auto"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Mahasiswa
        </Link>
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50/50 p-4 flex items-center text-red-700">
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="card p-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="input-field pl-10"
            placeholder="Cari NIM atau Nama..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        {search && (
          <button
            onClick={() => { setSearch(''); fetchStudents(1, ''); }}
            className="text-sm text-slate-500 hover:text-slate-700 font-medium"
          >
            Reset
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th scope="col" className="table-header">NIM</th>
                <th scope="col" className="table-header">Nama</th>
                <th scope="col" className="table-header">Fakultas</th>
                <th scope="col" className="table-header">Program Studi</th>
                <th scope="col" className="table-header">Status</th>
                <th scope="col" className="table-header">Credential</th>
                <th scope="col" className="table-header text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="spinner h-8 w-8 text-primary-600 mb-4"></div>
                      <p className="text-slate-500 text-sm">Memuat data mahasiswa...</p>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <h3 className="text-slate-900 font-medium mb-1">Belum ada data</h3>
                      <p className="text-slate-500 text-sm mb-4">Mulai dengan menambahkan mahasiswa baru.</p>
                      <Link href="/admin/students/new" className="btn-secondary text-sm">
                        Tambah Mahasiswa
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="table-cell font-medium text-slate-900">{student.nim}</td>
                    <td className="table-cell text-slate-700">{student.fullName}</td>
                    <td className="table-cell text-slate-600">{student.faculty}</td>
                    <td className="table-cell text-slate-600">{student.department}</td>
                    <td className="table-cell">
                      <span className={student.academicStatus === 'active' ? 'badge-green' : 'badge-red'}>
                        {student.academicStatus || 'Unknown'}
                      </span>
                    </td>
                    <td className="table-cell">
                      {student.credential ? (
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={
                            student.credential.status === 'active' ? 'badge-green' :
                            student.credential.status === 'revoked' ? 'badge-red' : 'badge-yellow'
                          }>
                            {student.credential.status}
                          </span>
                          {student.credential.blockchainTxHash ? (
                            <span className="badge-blue flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
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
                      ) : (
                        <span className="text-sm text-slate-400 italic">Belum ada</span>
                      )}
                    </td>
                    <td className="table-cell text-right">
                      <Link 
                        href={`/admin/students/${student.id}`} 
                        className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        Detail
                        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && students.length > 0 && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <p className="text-sm text-slate-500">
              Menampilkan halaman <span className="font-medium text-slate-900">{pagination.page}</span> dari <span className="font-medium text-slate-900">{pagination.totalPages}</span>
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
