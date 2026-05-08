'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const statsRes = await api.get('/dashboard/stats');
        setStats(statsRes);
      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-72 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-28 animate-pulse flex items-center p-6">
              <div className="h-12 w-12 rounded-full bg-slate-200 mr-4"></div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                <div className="h-6 w-16 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-200 bg-red-50/50 p-6">
        <div className="flex items-center text-red-700">
          <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      </div>
    );
  }

  const credentialTotal = stats?.credentials?.total || 0;
  const credentialActive = stats?.credentials?.active || 0;
  const credentialRevoked = stats?.credentials?.revoked || 0;
  const credentialAnchored = stats?.credentials?.anchored || 0;
  const credentialPending = stats?.credentials?.pendingAnchor || 0;

  const statCards = [
    {
      title: 'Total Mahasiswa',
      value: stats?.students?.total || 0,
      icon: <UsersIcon className="h-6 w-6" />,
      color: 'bg-primary-50 text-primary-600 ring-primary-100',
      iconColor: 'text-primary-600',
    },
    {
      title: 'Credential Aktif',
      value: credentialActive,
      icon: <CheckBadgeIcon className="h-6 w-6" />,
      color: 'bg-green-50 text-green-600 ring-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'On-Chain Anchored',
      value: credentialAnchored,
      icon: <ChainIcon className="h-6 w-6" />,
      color: 'bg-purple-50 text-purple-600 ring-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Total Verifikasi',
      value: stats?.verifications?.total || 0,
      icon: <ShieldCheckIcon className="h-6 w-6" />,
      color: 'bg-blue-50 text-blue-600 ring-blue-100',
      iconColor: 'text-blue-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview sistem manajemen credential KTM Digital</p>
        </div>
        <Link href="/admin/students/new" className="btn-primary flex items-center gap-2 shadow-md shadow-primary-600/20">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tambah Mahasiswa
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.title} className="card card-hover p-6 flex items-center transition-all duration-200">
            <div className={`p-3 rounded-xl ring-1 ring-inset ${card.color} mr-5`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{card.title}</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              Credential Status Distribution
            </h2>
            <CredentialChart
              active={credentialActive}
              revoked={credentialRevoked}
              expired={stats?.credentials?.expired || 0}
              total={credentialTotal}
            />
          </div>

          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Verification Results
            </h2>
            <VerificationChart results={stats?.verifications?.byResult || []} total={stats?.verifications?.total || 0} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Blockchain Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Network</span>
                <span className="text-sm font-semibold text-slate-800">{stats?.blockchain?.network || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Status</span>
                {stats?.blockchain?.configured ? (
                  <span className="badge-green">Connected</span>
                ) : (
                  <span className="badge-yellow">Not Configured</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Anchored</span>
                <span className="text-sm font-bold text-purple-700">{credentialAnchored}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Pending</span>
                <span className="text-sm font-bold text-amber-700">{credentialPending}</span>
              </div>
              {stats?.blockchain?.contractAddress && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Contract</span>
                  <span className="text-xs font-mono text-slate-600 break-all bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 block">
                    {stats.blockchain.contractAddress}
                  </span>
                </div>
              )}
              {stats?.blockchain?.issuerAddress && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Issuer Wallet</span>
                  <span className="text-xs font-mono text-slate-600 break-all bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 block">
                    {stats.blockchain.issuerAddress}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
              Distribusi Fakultas
            </h2>
            <FacultyList faculties={stats?.facultyDistribution || []} total={stats?.students?.total || 0} />
          </div>

          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-4">Credential Terbaru</h2>
            <div className="space-y-3">
              {(stats?.recentCredentials || []).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Belum ada credential</p>
              ) : (
                stats.recentCredentials.map((cred) => (
                  <div key={cred.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cred.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {cred.status === 'active' ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{cred.studentName}</p>
                      <p className="text-xs text-slate-400">{cred.studentNim}</p>
                    </div>
                    {cred.anchored && (
                      <div className="shrink-0" title="On-chain">
                        <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CredentialChart({ active, revoked, expired, total }) {
  if (total === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
        Belum ada credential yang diterbitkan
      </div>
    );
  }

  const segments = [
    { label: 'Aktif', value: active, color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
    { label: 'Dicabut', value: revoked, color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' },
    { label: 'Kedaluwarsa', value: expired, color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex h-4 rounded-full overflow-hidden bg-slate-100">
        {segments.map((seg) => {
          const pct = total > 0 ? (seg.value / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={seg.label}
              className={`${seg.color} transition-all duration-700 ease-out`}
              style={{ width: `${pct}%` }}
              title={`${seg.label}: ${seg.value} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {segments.map((seg) => {
          const pct = total > 0 ? ((seg.value / total) * 100).toFixed(0) : 0;
          return (
            <div key={seg.label} className={`${seg.bgColor} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${seg.textColor}`}>{seg.value}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">{seg.label} ({pct}%)</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VerificationChart({ results, total }) {
  if (total === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
        Belum ada verifikasi dilakukan
      </div>
    );
  }

  const resultConfig = {
    valid: { label: 'Valid', color: 'bg-emerald-500', textColor: 'text-emerald-700' },
    valid_unanchored: { label: 'Valid (Unanchored)', color: 'bg-blue-500', textColor: 'text-blue-700' },
    not_found: { label: 'Not Found', color: 'bg-slate-400', textColor: 'text-slate-700' },
    invalid_signature: { label: 'Invalid Signature', color: 'bg-red-500', textColor: 'text-red-700' },
    hash_mismatch: { label: 'Hash Mismatch', color: 'bg-red-600', textColor: 'text-red-700' },
    revoked: { label: 'Revoked', color: 'bg-orange-500', textColor: 'text-orange-700' },
    expired: { label: 'Expired', color: 'bg-amber-500', textColor: 'text-amber-700' },
  };

  const sorted = [...results].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-3">
      {sorted.map((item) => {
        const config = resultConfig[item.result] || { label: item.result, color: 'bg-slate-400', textColor: 'text-slate-700' };
        const pct = total > 0 ? (item.count / total) * 100 : 0;
        return (
          <div key={item.result} className="flex items-center gap-4">
            <div className="w-32 text-sm font-medium text-slate-600 truncate shrink-0">{config.label}</div>
            <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
              <div
                className={`h-full ${config.color} rounded-full transition-all duration-700 ease-out`}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
            <div className="w-12 text-right text-sm font-bold text-slate-700 shrink-0">{item.count}</div>
          </div>
        );
      })}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-sm text-slate-500">Total Verifikasi</span>
        <span className="text-lg font-bold text-slate-900">{total}</span>
      </div>
    </div>
  );
}

function FacultyList({ faculties, total }) {
  if (faculties.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-4">Belum ada data</p>;
  }

  const colors = ['bg-primary-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];

  return (
    <div className="space-y-3">
      {faculties.slice(0, 5).map((f, i) => {
        const pct = total > 0 ? (f.count / total) * 100 : 0;
        return (
          <div key={f.faculty} className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${colors[i % colors.length]} shrink-0`}></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-700 font-medium truncate">{f.faculty}</span>
                <span className="text-xs font-bold text-slate-500 shrink-0 ml-2">{f.count}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function CheckBadgeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  );
}

function ChainIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function ShieldCheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}
