import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  ShoppingBag,
  Receipt,
  UserCog,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['OWNER', 'MANAGER', 'STAFF'] },
    { path: '/products', label: 'Products', icon: Package, roles: ['OWNER', 'MANAGER', 'STAFF'] },
    { path: '/sales', label: 'Sales / POS', icon: ShoppingCart, roles: ['OWNER', 'MANAGER', 'STAFF'] },
    { path: '/customers', label: 'Customers', icon: Users, roles: ['OWNER', 'MANAGER', 'STAFF'] },
    { path: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['OWNER', 'MANAGER'] },
    { path: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingBag, roles: ['OWNER', 'MANAGER'] },
    { path: '/expenses', label: 'Expenses', icon: Receipt, roles: ['OWNER', 'MANAGER'] },
    { path: '/staff', label: 'Staff', icon: UserCog, roles: ['OWNER', 'MANAGER'] },
    { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['OWNER', 'MANAGER'] },
    { path: '/settings', label: 'Settings', icon: Settings, roles: ['OWNER'] },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(user?.role || '')
  );

  const currentPage = filteredMenuItems.find(item => item.path === location.pathname);

  const roleColors: Record<string, string> = {
    OWNER: 'bg-purple-100 text-purple-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    STAFF: 'bg-green-100 text-green-700',
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-[72px]'
        } bg-gray-900 text-white transition-all duration-300 ease-in-out flex flex-col flex-shrink-0 relative`}
      >
        {/* Logo */}
        <div className={`flex items-center ${sidebarOpen ? 'justify-between px-5' : 'justify-center px-2'} py-5 border-b border-white/10`}>
          {sidebarOpen && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Store size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">Taqwa</p>
                <p className="text-xs text-gray-400 leading-tight">Discount Shop</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!sidebarOpen ? item.label : undefined}
                className={`flex items-center ${sidebarOpen ? 'gap-3 px-3' : 'justify-center px-2'} py-2.5 rounded-lg transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium truncate">{item.label}</span>}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-white/5">
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleColors[user?.role || 'STAFF']}`}>
                  {user?.role}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? 'Logout' : undefined}
            className={`flex items-center ${sidebarOpen ? 'gap-3 px-3' : 'justify-center px-2'} py-2.5 rounded-lg w-full text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors`}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {currentPage?.label || 'Dashboard'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="hidden md:flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.fullName}</p>
                <p className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${roleColors[user?.role || 'STAFF']}`}>
                  {user?.role}
                </p>
              </div>
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {user?.fullName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;