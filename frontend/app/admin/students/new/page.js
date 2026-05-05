'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function CreateStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/students', formData);
      router.push('/admin/students');
    } catch (err) {
      setError(err.message || 'Failed to create student');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/admin/students" className="mr-4 text-slate-500 hover:text-slate-700 transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Add New Student</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="nim">
                NIM
              </label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="fullName">
                Full Name
              </label>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="faculty">
                Faculty
              </label>
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
            
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="department">
                Department
              </label>
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
            
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="enrollmentYear">
                Enrollment Year
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

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Account Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="input-field"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
                  Initial Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input-field"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Link 
              href="/admin/students"
              className="py-2 px-4 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-auto"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Student'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}