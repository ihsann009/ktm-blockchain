'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasActiveCredential, setHasActiveCredential] = useState(false);
  const [formData, setFormData] = useState({
    nim: '',
    fullName: '',
    faculty: '',
    department: '',
    enrollmentYear: new Date().getFullYear(),
    academicStatus: 'active',
  });
  const [originalData, setOriginalData] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchStudent = async () => {
      try {
        setLoading(true);
        const [studentRes, credentialsRes] = await Promise.all([
          api.get(`/students/${id}`),
          api.get(`/credentials/student/${id}`)
        ]);

        const s = studentRes.data;
        const data = {
          nim: s.nim,
          fullName: s.fullName,
          faculty: s.faculty,
          department: s.department,
          enrollmentYear: s.enrollmentYear,
          academicStatus: s.academicStatus || 'active',
        };
        setFormData(data);
        setOriginalData(data);

        const activeCredentials = (credentialsRes.data || []).filter(c => c.status === 'active');
        setHasActiveCredential(activeCredentials.length > 0);
      } catch (err) {
        setError(err.message || 'Failed to load student');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'enrollmentYear' ? parseInt(value, 10) : value,
    }));
  };

  const getCriticalChanges = () => {
    if (!originalData) return [];
    const critical = [];
    if (formData.nim !== originalData.nim) critical.push('NIM');
    if (formData.fullName !== originalData.fullName) critical.push('Nama');
    if (formData.faculty !== originalData.faculty) critical.push('Fakultas');
    if (formData.department !== originalData.department) critical.push('Program Studi');
    if (formData.enrollmentYear !== originalData.enrollmentYear) critical.push('Tahun Masuk');
    return critical;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const criticalChanges = getCriticalChanges();
    if (hasActiveCredential && criticalChanges.length > 0) {
      const confirmed = window.confirm(
        `PERINGATAN: Anda mengubah field kritis (${criticalChanges.join(', ')}) sementara mahasiswa ini memiliki credential aktif.\n\nCredential yang sudah diterbitkan akan berisi data LAMA. Anda perlu menerbitkan ulang credential setelah perubahan ini.\n\nLanjutkan?`
      );
      if (!confirmed) return;
    }

    try {
      setSaving(true);
      await api.put(`/students/${id}`, formData);
      router.push(`/admin/students/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to update student');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
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

  if (error && !formData.nim) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card border-red-200 bg-red-50/50 p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-medium text-slate-900 mb-1">Error</h3>
          <p className="text-slate-500 mb-4">{error}</p>
          <Link href="/admin/students" className="btn-secondary">Back to Students</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/students/${id}`}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Mahasiswa</h1>
          <p className="text-slate-500 text-sm mt-0.5">{formData.nim} • {formData.fullName}</p>
        </div>
      </div>

      {hasActiveCredential && (
        <div className="card border-amber-200 bg-amber-50/80 p-4 flex items-start gap-3 text-amber-800">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-sm">
            <p className="font-medium">Mahasiswa ini memiliki credential aktif</p>
            <p className="mt-1 text-amber-700">Mengubah data kritis (NIM, Nama, Fakultas, Prodi, Tahun Masuk) akan membuat credential saat ini berisi data lama. Anda perlu menerbitkan ulang credential setelah perubahan.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="card border-red-200 bg-red-50/80 p-4 flex items-center text-red-800 shadow-sm shadow-red-100/50">
          <svg className="w-5 h-5 mr-3 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="card overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Data Mahasiswa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label" htmlFor="nim">NIM</label>
                  <input
                    id="nim"
                    name="nim"
                    type="text"
                    required
                    className="input-field"
                    value={formData.nim}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="input-label" htmlFor="fullName">Nama Lengkap</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    className="input-field"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="input-label" htmlFor="faculty">Fakultas</label>
                <input
                  id="faculty"
                  name="faculty"
                  type="text"
                  required
                  className="input-field"
                  value={formData.faculty}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="input-label" htmlFor="department">Program Studi</label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  required
                  className="input-field"
                  value={formData.department}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="input-label" htmlFor="enrollmentYear">Tahun Masuk</label>
                <input
                  id="enrollmentYear"
                  name="enrollmentYear"
                  type="number"
                  min="2000"
                  max="2100"
                  required
                  className="input-field"
                  value={formData.enrollmentYear}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="input-label" htmlFor="academicStatus">Status Akademik</label>
              <select
                id="academicStatus"
                name="academicStatus"
                className="input-field"
                value={formData.academicStatus}
                onChange={handleChange}
              >
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
                <option value="graduated">Lulus</option>
                <option value="dropped">Drop Out</option>
              </select>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link href={`/admin/students/${id}`} className="btn-secondary">
              Batal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary min-w-[120px]"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
