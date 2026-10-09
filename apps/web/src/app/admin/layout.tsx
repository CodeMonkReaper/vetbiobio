'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin';

interface OverviewStats {
  pendingSubmissions: number;
  openReports: number;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [stats, setStats] = useState<OverviewStats | null>(null);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;

    adminApi('/admin/overview')
      .then((data) => {
        setStats({
          pendingSubmissions: data.pendingSubmissions,
          openReports: data.openReports,
        });
      })
      .catch((err) => {
        if (err.message === 'UNAUTHORIZED') {
          router.push('/admin/login');
        }
      });
  }, [pathname, isLoginPage, router]);

  async function handleLogout() {
    try {
      await adminApi('/admin/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    router.push('/admin/login');
  }

  if (isLoginPage) {
    return <div className="min-h-screen bg-slate-100">{children}</div>;
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    {
      href: '/admin/aportes',
      label: 'Aportes Ciudadanos',
      icon: '📥',
      badge: stats?.pendingSubmissions && stats.pendingSubmissions > 0 ? stats.pendingSubmissions : null,
      badgeColor: 'bg-emerald-500 text-white',
    },
    { href: '/admin/clinics', label: 'Clínicas', icon: '🏥' },
    {
      href: '/admin/reportes',
      label: 'Reportes',
      icon: '🚨',
      badge: stats?.openReports && stats.openReports > 0 ? stats.openReports : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    { href: '/admin/precios', label: 'Precios', icon: '💰' },
    { href: '/admin/horarios', label: 'Horarios', icon: '🕒' },
    { href: '/admin/fotos', label: 'Fotos', icon: '📸' },
    { href: '/admin/verificar', label: 'Verificaciones', icon: '🛡️' },
    { href: '/admin/calidad', label: 'Calidad de Datos', icon: '🎯' },
    { href: '/admin/importar', label: 'Importación Masiva', icon: '📦' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-200 flex flex-col justify-between p-4 shadow-xl z-10">
        <div>
          <div className="flex items-center space-x-3 px-3 py-4 mb-4 border-b border-slate-800">
            <span className="text-2xl">🐾</span>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block">VetBiobío</span>
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">Panel de Control</span>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 mt-6">
          <div className="px-3 py-2 mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>Sesión Activa</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition"
          >
            <span>🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-emerald-600 transition flex items-center gap-1">
              <span>🌐</span> Ver Sitio Público
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-700 capitalize">
              {pathname?.replace('/admin', '') || 'Dashboard'}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/aportar"
              target="_blank"
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md font-medium border border-slate-300 transition"
            >
              + Probar Formulario Público
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
