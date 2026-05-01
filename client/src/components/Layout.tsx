import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Sidebar from './Sidebar';
import Header from './Header';

const menuItems = [
  { path: '/', label: 'Dashboard', roles: ['OWNER', 'MANAGER', 'STAFF'] },
  { path: '/sales', label: 'Sales / POS', roles: ['OWNER', 'MANAGER', 'STAFF'] },
  { path: '/products', label: 'Products', roles: ['OWNER', 'MANAGER', 'STAFF'] },
  { path: '/customers', label: 'Customers', roles: ['OWNER', 'MANAGER', 'STAFF'] },
  { path: '/suppliers', label: 'Suppliers', roles: ['OWNER', 'MANAGER'] },
  { path: '/purchase-orders', label: 'Purchase Orders', roles: ['OWNER', 'MANAGER'] },
  { path: '/expenses', label: 'Expenses', roles: ['OWNER', 'MANAGER'] },
  { path: '/staff', label: 'Staff', roles: ['OWNER', 'MANAGER'] },
  { path: '/reports', label: 'Reports', roles: ['OWNER', 'MANAGER'] },
  { path: '/profile', label: 'Profile', roles: ['OWNER', 'MANAGER', 'STAFF'] },
  { path: '/settings', label: 'Settings', roles: ['OWNER'] },
];

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role ?? '')
  );

  const currentPage = filteredMenuItems.find(
    (item) =>
      item.path === location.pathname ||
      (item.path !== '/' && location.pathname.startsWith(item.path))
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif" }}
    >
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
        onProfileClick={() => navigate('/profile')}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header currentPage={currentPage} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;