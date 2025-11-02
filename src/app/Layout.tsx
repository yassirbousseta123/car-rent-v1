import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Car, Calendar } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
import { t } from '../lib/i18n';

const navigation = [
  { name: 'dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'vehicles', icon: Car, path: '/vehicles' },
  { name: 'reservations', icon: Calendar, path: '/bookings' },
];

export function Layout() {
  const location = useLocation();
  const { locale, setLocale } = useUIStore();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold">RentalFlow</h1>
        </div>
        <nav className="mt-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-800 text-white border-l-4 border-blue-500'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {t(item.name as any, locale)}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-64 p-6 border-t border-gray-800">
          <button
            onClick={() => setLocale(locale === 'en' ? 'fr' : 'en')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {locale === 'en' ? '🇫🇷 Français' : '🇬🇧 English'}
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-gray-50">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
