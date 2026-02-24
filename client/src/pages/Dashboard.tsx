import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { DollarSign, Package, ShoppingBag, AlertTriangle, TrendingUp, Users, ShoppingCart, ArrowRight, ArrowUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface DashboardData {
  todaySales: {
    count: number;
    revenue: number;
    discounts: number;
  };
  lowStock: number;
  pendingOrders: number;
  notifications: number;
  topProducts: Array<{
    id: number;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  recentSales: Array<{
    id: number;
    invoiceNo: string;
    customer: string;
    total: number;
    createdAt: string;
  }>;
}

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

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
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Today's Revenue",
      value: `BDT ${(data?.todaySales.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${data?.todaySales.count || 0} transactions`,
      icon: TrendingUp,
      gradient: 'gradient-success',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: "Today's Discounts",
      value: `BDT ${(data?.todaySales.discounts || 0).toFixed(2)}`,
      subtitle: 'Total discounts given',
      icon: DollarSign,
      gradient: 'gradient-warning',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Low Stock Alerts',
      value: data?.lowStock || 0,
      subtitle: 'Products need restocking',
      icon: AlertTriangle,
      gradient: 'gradient-danger',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      clickable: '/products',
    },
    {
      title: 'Pending Orders',
      value: data?.pendingOrders || 0,
      subtitle: 'Awaiting delivery',
      icon: ShoppingBag,
      gradient: 'gradient-info',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      clickable: '/purchase-orders',
    },
  ];

  const quickActions = [
    {
      label: 'New Sale',
      desc: 'Process a customer purchase',
      path: '/sales',
      color: 'bg-primary-600 hover:bg-primary-700',
      icon: ShoppingCart,
    },
    {
      label: 'Add Product',
      desc: 'Add new items to inventory',
      path: '/products',
      color: 'bg-emerald-600 hover:bg-emerald-700',
      icon: Package,
    },
    {
      label: 'Add Customer',
      desc: 'Register a new customer',
      path: '/customers',
      color: 'bg-blue-600 hover:bg-blue-700',
      icon: Users,
    },
    {
      label: 'View Reports',
      desc: 'Analyze sales & inventory',
      path: '/reports',
      color: 'bg-purple-600 hover:bg-purple-700',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
            <span className="text-primary-600">{user?.fullName?.split(' ')[0]}!</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Here's your business overview for today</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="btn-secondary text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              onClick={stat.clickable ? () => navigate(stat.clickable!) : undefined}
              className={`card p-6 ${stat.clickable ? 'cursor-pointer hover:shadow-card-hover transition-shadow' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={stat.textColor} size={22} />
                </div>
                {stat.clickable && (
                  <ArrowRight size={16} className="text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm font-medium text-gray-700 mt-1">{stat.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions + Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="section-title mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className={`${action.color} text-white rounded-xl p-4 text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-sm`}
                >
                  <Icon size={20} className="mb-2" />
                  <p className="text-sm font-semibold">{action.label}</p>
                  <p className="text-xs text-white/70 mt-0.5">{action.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Recent Sales</h3>
            <button
              onClick={() => navigate('/sales')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>
          {data?.recentSales && data.recentSales.length > 0 ? (
            <div className="space-y-2">
              {data.recentSales.slice(0, 6).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                      <ShoppingCart size={16} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{sale.invoiceNo}</p>
                      <p className="text-xs text-gray-500">{sale.customer || 'Walk-in Customer'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">BDT {sale.total.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(sale.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <ShoppingCart size={40} className="text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No sales today</p>
              <p className="text-gray-400 text-sm mt-1">Start making sales to see them here</p>
              <button onClick={() => navigate('/sales')} className="btn-primary mt-4 text-sm">
                New Sale
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      {data?.topProducts && data.topProducts.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Top Selling Products Today</h3>
            <button
              onClick={() => navigate('/reports')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              Full Report <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.topProducts.slice(0, 6).map((product, index) => (
              <div key={product.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-gray-300'
                }`}>
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-500">{product.quantity} sold</span>
                    <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
                      <ArrowUp size={10} /> BDT {product.revenue.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;