import { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/api';
import { DollarSign, Package, ShoppingBag, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface DashboardData {
  todaySales: {
    count: number;
    revenue: number;
  };
  lowStock: number;
  pendingOrders: number;
  notifications: number;
}

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.get();
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = [
    {
      title: "Today's Sales",
      value: data?.todaySales.count || 0,
      subtitle: `BDT ${(data?.todaySales.revenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Low Stock Items',
      value: data?.lowStock || 0,
      subtitle: 'Requires attention',
      icon: Package,
      color: 'bg-yellow-500',
    },
    {
      title: 'Pending Orders',
      value: data?.pendingOrders || 0,
      subtitle: 'Awaiting delivery',
      icon: ShoppingBag,
      color: 'bg-blue-500',
    },
    {
      title: 'Notifications',
      value: data?.notifications || 0,
      subtitle: 'Unread alerts',
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-gray-600 mt-1">Here's what's happening today</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</h3>
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors">
              <p className="font-medium text-primary-900">Create New Sale</p>
              <p className="text-sm text-primary-600">Process customer purchases</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <p className="font-medium text-gray-900">Add Product</p>
              <p className="text-sm text-gray-600">Add new items to inventory</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <p className="font-medium text-gray-900">View Reports</p>
              <p className="text-sm text-gray-600">Check sales analytics</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>System initialized successfully</p>
            <p>Ready to process transactions</p>
            <p>All systems operational</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;