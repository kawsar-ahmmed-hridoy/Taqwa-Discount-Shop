import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  ShoppingBag,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  RefreshCw,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface DashboardData {
  todaySales: { count: number; revenue: number; discounts: number };
  lowStock: number;
  pendingOrders: number;
  notifications: number;
  topProducts: Array<{ id: number; name: string; quantity: number; revenue: number }>;
  recentSales: Array<{ id: number; invoiceNo: string; customer: string; total: number; createdAt: string }>;
}

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const rankClass: Record<number, string> = {
  0: 'bg-yellow-500/10 text-yellow-600',
  1: 'bg-slate-400/10 text-slate-500',
  2: 'bg-orange-500/10 text-orange-600',
};

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await dashboardAPI.get();
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-5 h-5 border-2 border-[#1f6feb] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#3c4252] text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Today's Revenue",
      value: `৳ ${fmt(data?.todaySales.revenue ?? 0)}`,
      sub: `${data?.todaySales.count ?? 0} transactions`,
      icon: TrendingUp,
      iconColor: 'text-[#4ade80]',
      iconBg: 'bg-green-500/10',
      valueColor: 'text-[#c8cdd8]',
    },
    {
      label: 'Discounts Given',
      value: `৳ ${fmt(data?.todaySales.discounts ?? 0)}`,
      sub: 'Total today',
      icon: Clock,
      iconColor: 'text-[#fbbf24]',
      iconBg: 'bg-amber-500/10',
      valueColor: 'text-[#c8cdd8]',
    },
    {
      label: 'Low Stock Alerts',
      value: String(data?.lowStock ?? 0),
      sub: 'Need restocking',
      icon: AlertTriangle,
      iconColor: 'text-[#f87171]',
      iconBg: 'bg-red-500/10',
      valueColor: 'text-[#f87171]',
      link: '/products',
    },
    {
      label: 'Pending Orders',
      value: String(data?.pendingOrders ?? 0),
      sub: 'Awaiting delivery',
      icon: ShoppingBag,
      iconColor: 'text-[#6ea8fe]',
      iconBg: 'bg-blue-500/10',
      valueColor: 'text-[#6ea8fe]',
      link: '/purchase-orders',
    },
  ];

  const quickActions = [
    { label: 'New Sale', desc: 'Process purchase', path: '/sales', iconColor: '#6ea8fe', iconBg: 'rgba(31,111,235,0.12)', Icon: ShoppingCart },
    { label: 'Add Product', desc: 'Update inventory', path: '/products', iconColor: '#4ade80', iconBg: 'rgba(22,163,74,0.10)', Icon: Package },
    { label: 'Add Customer', desc: 'Register new', path: '/customers', iconColor: '#a5b4fc', iconBg: 'rgba(99,102,241,0.10)', Icon: Users },
    { label: 'Reports', desc: 'View analytics', path: '/reports', iconColor: '#fbbf24', iconBg: 'rgba(234,179,8,0.08)', Icon: BarChart3 },
  ];

  return (
    <div
      className="flex flex-col gap-3.5 p-5 min-h-full"
      style={{ fontFamily: "'DM Sans', sans-serif", background: 'var(--bg)' }}
    >
      {/* Top row */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#333844] mb-1">
            Overview
          </p>
          <h1 className="text-[17px] font-semibold text-[#c8cdd8] tracking-tight leading-none">
            {greeting()},{' '}
            <span className="text-[#6ea8fe]">{user?.fullName?.split(' ')[0]}</span>
          </h1>
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 h-[30px] px-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.13] rounded-[7px] text-[#4a5060] hover:text-[#8892a4] text-[11.5px] font-medium transition-all duration-[120ms] disabled:opacity-50"
        >
          <RefreshCw size={11} strokeWidth={2} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-2.5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              onClick={s.link ? () => navigate(s.link!) : undefined}
              className={`bg-[#111318] border border-white/[0.055] rounded-[10px] p-3.5 flex flex-col gap-2.5 transition-all duration-[120ms] ${
                s.link ? 'cursor-pointer hover:border-white/[0.12]' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-7 h-7 rounded-[7px] ${s.iconBg} flex items-center justify-center`}>
                  <Icon size={14} strokeWidth={1.8} className={s.iconColor} />
                </div>
                {s.link && <ArrowRight size={12} strokeWidth={1.8} className="text-[#2a2f3a]" />}
              </div>
              <div>
                <p
                  className={`text-[18px] font-semibold ${s.valueColor} tracking-tight leading-none`}
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {s.value}
                </p>
                <p className="text-[11.5px] font-medium text-[#505668] mt-1.5">{s.label}</p>
                <p className="text-[10.5px] text-[#333844] mt-px">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mid row: quick actions + recent sales */}
      <div className="grid gap-2.5" style={{ gridTemplateColumns: '220px 1fr' }}>
        {/* Quick actions */}
        <div className="bg-[#111318] border border-white/[0.055] rounded-[10px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#333844]">
              Quick Actions
            </span>
          </div>
          <div className="p-2.5 grid grid-cols-2 gap-1.5">
            {quickActions.map((a) => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.12] rounded-[8px] p-2.5 text-left transition-all duration-[120ms]"
              >
                <div
                  className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center mb-2"
                  style={{ background: a.iconBg }}
                >
                  <a.Icon size={12} strokeWidth={1.8} style={{ color: a.iconColor }} />
                </div>
                <p className="text-[12px] font-semibold text-[#c8cdd8] leading-none">{a.label}</p>
                <p className="text-[10.5px] text-[#3c4252] mt-[3px]">{a.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent sales */}
        <div className="bg-[#111318] border border-white/[0.055] rounded-[10px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#333844]">
              Recent Sales
            </span>
            <button
              onClick={() => navigate('/sales')}
              className="flex items-center gap-1 text-[11px] font-medium text-[#3a4255] hover:text-[#6ea8fe] transition-colors duration-[120ms]"
            >
              View all <ArrowRight size={10} strokeWidth={1.8} />
            </button>
          </div>
          {data?.recentSales && data.recentSales.length > 0 ? (
            <div>
              {data.recentSales.slice(0, 5).map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.035] last:border-0 hover:bg-white/[0.025] transition-colors duration-[100ms]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-[26px] h-[26px] rounded-[7px] bg-[#1f6feb]/10 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart size={11} strokeWidth={1.8} className="text-[#6ea8fe]" />
                    </div>
                    <div>
                      <p
                        className="text-[12px] font-semibold text-[#8892a4] leading-none"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        {sale.invoiceNo}
                      </p>
                      <p className="text-[11px] text-[#3c4252] mt-[3px]">
                        {sale.customer || 'Walk-in Customer'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-[12.5px] font-semibold text-[#c8cdd8] leading-none"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      ৳ {fmt(sale.total)}
                    </p>
                    <p className="text-[10.5px] text-[#333844] mt-[3px]">
                      {new Date(sale.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <ShoppingCart size={24} strokeWidth={1.5} className="text-[#2a2f3a]" />
              <p className="text-[12px] text-[#3c4252]">No sales yet today</p>
              <button
                onClick={() => navigate('/sales')}
                className="mt-1 flex items-center gap-1.5 text-[11.5px] font-medium text-[#6ea8fe] hover:text-[#93c5fd] transition-colors"
              >
                Start a new sale <ArrowUpRight size={11} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top products */}
      {data?.topProducts && data.topProducts.length > 0 && (
        <div className="bg-[#111318] border border-white/[0.055] rounded-[10px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#333844]">
              Top Selling Products
            </span>
            <button
              onClick={() => navigate('/reports')}
              className="flex items-center gap-1 text-[11px] font-medium text-[#3a4255] hover:text-[#6ea8fe] transition-colors duration-[120ms]"
            >
              Full report <ArrowRight size={10} strokeWidth={1.8} />
            </button>
          </div>
          <div
            className="grid"
            style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
          >
            {[0, 1, 2].map((col) => (
              <div
                key={col}
                className={col > 0 ? 'border-l border-white/[0.04]' : ''}
              >
                {data.topProducts.slice(col * 2, col * 2 + 2).map((p, i) => {
                  const rank = col * 2 + i;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-2.5 px-4 py-2.5 border-b border-white/[0.035] last:border-0 hover:bg-white/[0.025] transition-colors duration-[100ms]"
                    >
                      <span
                        className={`w-5 h-5 rounded-[5px] flex items-center justify-center text-[9.5px] font-bold flex-shrink-0 ${
                          rankClass[rank] ?? 'bg-white/[0.05] text-[#3c4252]'
                        }`}
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        #{rank + 1}
                      </span>
                      <span className="flex-1 text-[12px] font-medium text-[#8892a4] truncate">
                        {p.name}
                      </span>
                      <div className="text-right">
                        <p
                          className="text-[11.5px] font-semibold text-[#4ade80] leading-none"
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          ৳ {fmt(p.revenue)}
                        </p>
                        <p className="text-[10.5px] text-[#333844] mt-[3px]">{p.quantity} sold</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;