import { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { RoleBadge } from './RoleBadge';

function Icon({ path }: { path: string }) {
  return (
    <svg
      className="w-5 h-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

const SECTIONS: { to: string; label: string; icon: ReactNode }[] = [
  {
    to: '/',
    label: 'Tablero',
    icon: <Icon path="M4 5h4v14H4zM10 5h4v9h-4zM16 5h4v6h-4z" />,
  },
  {
    to: '/mercado',
    label: 'Mercado',
    icon: <Icon path="M3 17l5-5 4 4 8-9M21 21H3V3" />,
  },
  {
    to: '/clima',
    label: 'Clima',
    icon: <Icon path="M17.5 19a4.5 4.5 0 100-9 6 6 0 10-11.6 2.1A3.5 3.5 0 007 19h10.5z" />,
  },
];

function navItemClass(isActive: boolean, mobile = false): string {
  const base = mobile
    ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors'
    : 'flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold uppercase tracking-wider transition-colors';
  return `${base} ${
    isActive ? 'bg-white/20 text-white shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'
  }`;
}

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#f4f3f8]">
      {/* Sidebar (escritorio) */}
      <aside className="hidden md:flex md:flex-col fixed inset-y-0 left-0 w-60 p-4 text-white bg-gradient-to-b from-purple-700 via-purple-600 to-fuchsia-500 shadow-xl">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <span className="w-9 h-9 rounded-full bg-white/20 ring-1 ring-white/30 grid place-items-center font-bold">
            T
          </span>
          <div className="leading-tight">
            <p className="font-bold tracking-wide">TaskFlow</p>
            <p className="text-[11px] text-white/70 uppercase tracking-wider">Panel del equipo</p>
          </div>
        </div>

        <div className="border-t border-white/20 my-4" />

        <nav className="flex flex-col gap-1">
          {SECTIONS.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              end={s.to === '/'}
              className={({ isActive }) => navItemClass(isActive)}
            >
              {s.icon}
              {s.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="mt-auto border-t border-white/20 pt-4 px-2">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <div className="flex items-center justify-between mt-1.5">
              <RoleBadge role={user.role} />
              <button
                onClick={logout}
                className="text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/10 px-2.5 py-1 rounded-lg transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Barra superior (móvil) */}
      <header className="md:hidden sticky top-0 z-10 text-white bg-gradient-to-r from-purple-700 to-fuchsia-500 shadow-lg px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-white/20 grid place-items-center font-bold text-sm">
              T
            </span>
            <span className="font-bold">TaskFlow</span>
          </div>
          <button
            onClick={logout}
            className="text-xs font-semibold uppercase tracking-wider text-white/80 hover:text-white"
          >
            Salir
          </button>
        </div>
        <nav className="flex gap-1.5">
          {SECTIONS.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              end={s.to === '/'}
              className={({ isActive }) => navItemClass(isActive, true)}
            >
              {s.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="md:pl-60">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
