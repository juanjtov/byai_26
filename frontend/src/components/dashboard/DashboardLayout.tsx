import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'home' },
  { label: 'Company Profile', href: '/dashboard/profile', icon: 'building' },
  { label: 'Documents', href: '/dashboard/documents', icon: 'file' },
  { label: 'Pricing', href: '/dashboard/pricing', icon: 'dollar' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, organization, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-obsidian">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-obsidian/80 backdrop-blur-lg border-b border-ivory/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="relative h-8 w-8 transition-all duration-300 group-hover:glow-signal">
                <div className="absolute inset-0 rotate-45 border border-copper transition-colors group-hover:border-signal" />
                <div className="absolute inset-2 rotate-45 border border-copper/50 transition-colors group-hover:border-signal/50" />
              </div>
              <span className="font-display text-xl tracking-widest text-ivory">REMODLY</span>
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-sm text-body">{organization?.name || user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-ivory/60 hover:text-ivory transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="fixed left-0 top-16 bottom-0 w-64 border-r border-ivory/5 bg-obsidian/50 p-6">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-copper/10 text-copper'
                      : 'text-ivory/60 hover:text-ivory hover:bg-ivory/5'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-copper' : 'bg-current opacity-50'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
