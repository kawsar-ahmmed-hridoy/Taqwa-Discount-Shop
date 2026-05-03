import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  ShoppingBag,
  Receipt,
  UserCog,
  BarChart3,
  ShieldAlert,
  Settings,
  LogOut,
  ChevronLeft,
  Store,
  RotateCcw,
} from 'lucide-react';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
  onProfileClick: () => void;
}

const menuSections = [
  {
    label: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['OWNER', 'MANAGER', 'STAFF'] },
      { path: '/customers', label: 'Customers', icon: Users, roles: ['OWNER', 'MANAGER', 'STAFF'] },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { path: '/sales', label: 'Sales / POS', icon: ShoppingCart, roles: ['OWNER', 'MANAGER', 'STAFF'] },
      { path: '/refunds', label: 'Refunds', icon: RotateCcw, roles: ['OWNER', 'MANAGER'] },
      { path: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingBag, roles: ['OWNER', 'MANAGER'] },
      { path: '/products', label: 'Products', icon: Package, roles: ['OWNER', 'MANAGER', 'STAFF'] },
      { path: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['OWNER', 'MANAGER'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { path: '/expenses', label: 'Expenses', icon: Receipt, roles: ['OWNER', 'MANAGER'] },
      { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['OWNER', 'MANAGER'] },
    ],
  },
  {
    label: 'Admin',
    items: [
      { path: '/staff', label: 'Staff', icon: UserCog, roles: ['OWNER', 'MANAGER'] },
      { path: '/audit-logs', label: 'Audit Logs', icon: ShieldAlert, roles: ['OWNER', 'MANAGER'] },
      { path: '/settings', label: 'Settings', icon: Settings, roles: ['OWNER'] },
    ],
  },
];

const rolePillStyle: Record<string, string> = {
  OWNER: 'bg-violet-500/10 text-violet-400',
  MANAGER: 'bg-blue-500/10 text-blue-400',
  STAFF: 'bg-emerald-500/10 text-emerald-400',
};

const Sidebar = ({ sidebarOpen, setSidebarOpen, onLogout, onProfileClick }: SidebarProps) => {
  const { user } = useAuthStore();
  const location = useLocation();

  const userRole = user?.role ?? '';

  return (
    <aside
      className={`${
        sidebarOpen ? 'w-[228px]' : 'w-[60px]'
      } flex flex-col flex-shrink-0 transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]`}
      style={{ fontFamily: "'DM Sans', sans-serif", background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-subtle)' }}
    >
      {/* Logo */}
      <div
        className={`flex items-center gap-2.5 border-b border-white/[0.055] ${
          sidebarOpen ? 'px-4 py-[18px]' : 'justify-center px-2 py-[18px]'
        }`}
      >
        {/* Logo + Brand (ONLY expands) */}
        <div
          onClick={() => {
            if (!sidebarOpen) setSidebarOpen(true);
          }}
          className="flex items-center gap-2.5 cursor-pointer w-full"
          title={!sidebarOpen ? 'Expand' : ''}
        >
          {/* Icon */}
          <div className="relative w-[34px] h-[34px] rounded-[9px] bg-[var(--accent)] flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${'var(--accent)'} 0%, ${'var(--accent)'} 100%)` }}>
            <div className="absolute inset-0 rounded-[9px] bg-gradient-to-br from-white/15 to-transparent" />
            <Store size={15} className="text-white relative z-10" />
          </div>

          {/* Brand text */}
          {sidebarOpen && (
            <div className="flex-1 overflow-hidden">
              <p className="text-[13.5px] font-semibold leading-tight tracking-tight" style={{ color: 'var(--text)' }}>
                Taqwa
              </p>
              <p className="text-[11px] mt-px" style={{ color: 'var(--text)' }}>
                Discount Shop
              </p>
            </div>
          )}
        </div>

        {/* Collapse button (ONLY when open) */}
        {sidebarOpen && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(false);
            }}
            title="Collapse"
            className="w-[26px] h-[26px] rounded-[7px] border bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/[0.13] flex items-center justify-center hover:text-[#a0a8b8] transition-all duration-150 flex-shrink-0 ml-auto"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text)' }}
          >
            <ChevronLeft size={12} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-1.5 overflow-y-auto scrollbar-none space-y-0.5">
        {menuSections.map((section) => {
          const visibleItems = section.items.filter((item) => item.roles.includes(userRole));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label}>
              {/* Section label */}
              {sidebarOpen && (
                <p className="px-2 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text)' }}>
                  {section.label}
                </p>
              )}
              {!sidebarOpen && <div className="h-3" />}

              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={!sidebarOpen ? item.label : undefined}
                    className={`relative flex items-center h-9 rounded-lg overflow-hidden transition-all duration-[120ms] mb-px group
                      ${sidebarOpen ? 'gap-2.5 px-2.5' : 'justify-center px-0'}
                      ${
                        isActive
                          ? 'bg-[var(--accent)]/[0.12] text-[var(--info)]'
                          : 'hover:text-[#a0a8b8] hover:bg-white/[0.04]'
                      }`}
                  >
                    {/* Active bar */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-r-sm" style={{ background: 'var(--accent)' }} />
                    )}

                    <Icon
                      size={15}
                      strokeWidth={1.8}
                      className={`flex-shrink-0 transition-colors duration-[120ms] ${
                        isActive ? '' : 'group-hover:text-[#a0a8b8]'
                      }`}
                      style={{ color: isActive ? 'var(--info)' : 'var(--text)' }}
                    />

                    {sidebarOpen && (
                      <span className="text-[13px] font-medium tracking-[-0.005em] truncate flex-1">
                        {item.label}
                      </span>
                    )}

                    {/* Tooltip when collapsed */}
                    {!sidebarOpen && (
                      <div className="absolute left-full ml-2.5 px-2.5 py-1.5 border text-[12px] font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl"
                        style={{ background: 'var(--card-bg)', borderColor: 'var(--border-subtle)', color: 'var(--muted-2)' }}>
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-2 pt-2 pb-3 border-t border-white/[0.055] space-y-1">
        {/* User card */}
        <button
          onClick={onProfileClick}
          className={`flex items-center rounded-[9px] bg-white/[0.03] border border-white/[0.055] hover:bg-white/[0.055] transition-colors duration-[120ms] cursor-pointer w-full
            ${sidebarOpen ? 'gap-2.5 px-2.5 py-2' : 'justify-center py-2 px-0'}`}
        >
          <div className="w-[30px] h-[30px] rounded-[8px] bg-gradient-to-br from-[#1f4ded] to-[#1f6feb] flex items-center justify-center text-[12px] font-semibold text-white flex-shrink-0">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          {sidebarOpen && (
            <div className="flex-1 overflow-hidden">
              <p className="text-[12.5px] font-semibold text-[#c8cdd8] truncate">{user?.fullName}</p>
              <span
                className={`flex text-[10px] font-semibold tracking-[0.04em] px-1.5 rounded mt-0.5 ${
                  rolePillStyle[userRole] ?? rolePillStyle.STAFF
                }`}
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {userRole}
              </span>
            </div>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          title={!sidebarOpen ? 'Log out' : undefined}
          className={`flex items-center h-[34px] w-full rounded-lg text-[#3a404f] hover:text-[#e06c75] hover:bg-[#e06c75]/[0.08] transition-all duration-[120ms]
            ${sidebarOpen ? 'gap-2.5 px-2.5' : 'justify-center px-0'}`}
        >
          <LogOut size={14} strokeWidth={1.8} className="flex-shrink-0" />
          {sidebarOpen && (
            <span className="text-[12.5px] font-medium">Log out</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;