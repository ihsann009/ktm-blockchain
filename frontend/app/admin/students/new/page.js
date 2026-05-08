'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function CreateStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [autoIssue, setAutoIssue] = useState(true);
  const [formData, setFormData] = useState({
    nim: '',
    fullName: '',
    faculty: '',
    department: '',
    enrollmentYear: new Date().getFullYear(),
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'enrollmentYear' ? parseInt(value, 10) : value,
    }));
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('File terlalu besar. Maksimal 2MB.');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await api.post('/students', { ...formData, autoIssueCredential: autoIssue });

      if (photoFile && result.data?.id) {
        const fd = new FormData();
        fd.append('photo', photoFile);
        await api.upload(`/students/${result.data.id}/photo`, fd);
      }

      router.push('/admin/students');
    } catch (err) {
      setError(err.message || 'Failed to create student');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tambah Mahasiswa Baru</h1>
          <p className="text-slate-500 text-sm mt-0.5">Daftarkan mahasiswa untuk diterbitkan KTM Digital</p>
        </div>
      </div>

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
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Foto Mahasiswa</h3>
              <div className="flex items-center gap-6">
                <div className="w-24 h-32 rounded-lg border-2 border-dashed border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center flex-shrink-0">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary text-sm"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {photoPreview ? 'Ganti Foto' : 'Pilih Foto'}
                  </button>
                  <p className="text-xs text-slate-400">JPG, PNG, WebP. Maks 2MB. (Opsional)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Data Mahasiswa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label" htmlFor="nim">
                    NIM
                  </label>
                  <input
                    id="nim"
                    name="nim"
                    type="text"
                    required
                    className="input-field"
                    placeholder="Contoh: 20240001"
                    value={formData.nim}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label className="input-label" htmlFor="fullName">
                    Nama Lengkap
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    className="input-field"
                    placeholder="Sesuai kartu identitas"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="input-label" htmlFor="faculty">
                  Fakultas
                </label>
                <input
                  id="faculty"
                  name="faculty"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Ilmu Komputer"
                  value={formData.faculty}
                  onChange={handleChange}
                />
              </div>
              
              <div className="md:col-span-1">
                <label className="input-label" htmlFor="department">
                  Program Studi
                </label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Teknik Informatika"
                  value={formData.department}
                  onChange={handleChange}
                />
              </div>
              
              <div className="md:col-span-1">
                <label className="input-label" htmlFor="enrollmentYear">
                  Tahun Masuk
                </label>
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
          </div>

          
          <div className="p-6 bg-slate-50/50 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Informasi Akun</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label" htmlFor="email">
                    Email Mahasiswa
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="input-field bg-white"
                    placeholder="mhs@kampus.ac.id"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label className="input-label" htmlFor="password">
                    Password Awal
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="input-field bg-white"
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={autoIssue}
                onChange={(e) => setAutoIssue(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="text-sm font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Langsung terbitkan credential setelah data tersimpan
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  KTM Digital (JWT-VC) akan otomatis diterbitkan dan di-anchor ke blockchain
                </p>
              </div>
            </label>
          </div>

          
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link 
              href="/admin/students"
              className="btn-secondary"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary min-w-[120px]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </>
              ) : (
                'Simpan Data'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

