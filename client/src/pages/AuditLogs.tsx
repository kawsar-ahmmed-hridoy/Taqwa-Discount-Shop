import { useEffect, useMemo, useState } from 'react';
import { auditLogAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import {
  Search,
  ShieldAlert,
  Filter,
  Clock3,
  Activity,
  UserCog,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Edit3,
  Trash2,
  BadgeCheck,
  Lock,
} from 'lucide-react';

type AuditLogEntry = {
  id: number;
  userId: number;
  actorRole?: 'OWNER' | 'MANAGER' | 'STAFF' | null;
  action: string;
  entity: string;
  entityId?: number | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    role: 'OWNER' | 'MANAGER' | 'STAFF';
    isActive: boolean;
  };
};

type Summary = {
  total: number;
  todayCount: number;
  criticalCount: number;
  ownerCount: number;
};

const ROLE_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  OWNER: { bg: 'rgba(168,85,247,0.10)', text: '#c084fc', dot: '#a855f7' },
  MANAGER: { bg: 'rgba(59,130,246,0.10)', text: '#6ea8fe', dot: '#3b82f6' },
  STAFF: { bg: 'rgba(16,185,129,0.10)', text: '#34d399', dot: '#10b981' },
};

const ACTION_STYLES: Record<string, { bg: string; text: string; icon: typeof Activity }> = {
  LOGIN: { bg: 'rgba(59,130,246,0.10)', text: '#6ea8fe', icon: ArrowUpRight },
  LOGOUT: { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8', icon: ArrowDownRight },
  SIGNUP: { bg: 'rgba(16,185,129,0.10)', text: '#34d399', icon: BadgeCheck },
  PASSWORD_RESET: { bg: 'rgba(245,158,11,0.10)', text: '#fbbf24', icon: Lock },
  PRODUCT_CREATED: { bg: 'rgba(16,185,129,0.10)', text: '#34d399', icon: BadgeCheck },
  PRODUCT_UPDATED: { bg: 'rgba(59,130,246,0.10)', text: '#6ea8fe', icon: Edit3 },
  PRODUCT_DELETED: { bg: 'rgba(239,68,68,0.10)', text: '#f87171', icon: Trash2 },
  EXPENSE_CREATED: { bg: 'rgba(59,130,246,0.10)', text: '#6ea8fe', icon: Activity },
  EXPENSE_APPROVED: { bg: 'rgba(16,185,129,0.10)', text: '#34d399', icon: BadgeCheck },
  PURCHASE_ORDER_CREATED: { bg: 'rgba(59,130,246,0.10)', text: '#6ea8fe', icon: Activity },
  PURCHASE_ORDER_STATUS_UPDATED: { bg: 'rgba(245,158,11,0.10)', text: '#fbbf24', icon: Edit3 },
  SALE_COMPLETED: { bg: 'rgba(16,185,129,0.10)', text: '#34d399', icon: BadgeCheck },
  REFUND_REQUESTED: { bg: 'rgba(245,158,11,0.10)', text: '#fbbf24', icon: Lock },
  REFUND_APPROVED: { bg: 'rgba(16,185,129,0.10)', text: '#34d399', icon: BadgeCheck },
  REFUND_REJECTED: { bg: 'rgba(239,68,68,0.10)', text: '#f87171', icon: Trash2 },
  REFUND_PROCESSED: { bg: 'rgba(59,130,246,0.10)', text: '#6ea8fe', icon: Activity },
  SETTINGS_UPDATED: { bg: 'rgba(239,68,68,0.10)', text: '#f87171', icon: Edit3 },
  STAFF_DELETED: { bg: 'rgba(239,68,68,0.10)', text: '#f87171', icon: Trash2 },
  STAFF_CREATED: { bg: 'rgba(16,185,129,0.10)', text: '#34d399', icon: BadgeCheck },
  STAFF_UPDATED: { bg: 'rgba(59,130,246,0.10)', text: '#6ea8fe', icon: Edit3 },
  STAFF_DEACTIVATED: { bg: 'rgba(245,158,11,0.10)', text: '#fbbf24', icon: Lock },
};

const defaultActionStyle = { bg: 'rgba(59,130,246,0.08)', text: '#6b7280', icon: Activity };

const statusPill = (label: string, bg: string, text: string, dot?: string) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 999,
      background: bg,
      color: text,
      fontSize: 11,
      fontWeight: 600,
      border: '1px solid rgba(255,255,255,0.06)',
    }}
  >
    {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: dot }} />}
    {label}
  </span>
);

const AuditLogs = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, todayCount: 0, criticalCount: 0, ownerCount: 0 });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [entity, setEntity] = useState('all');
  const [role, setRole] = useState('all');

  const canView = useMemo(() => ['OWNER', 'MANAGER'].includes(user?.role ?? ''), [user?.role]);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await auditLogAPI.getAll({
          page,
          limit: 15,
          search: search.trim() || undefined,
          action: action === 'all' ? undefined : action,
          entity: entity === 'all' ? undefined : entity,
          role: role === 'all' ? undefined : role,
        });

        setRows(response.data.data);
        setPages(response.data.pagination.pages || 1);
        setSummary(response.data.summary ?? { total: 0, todayCount: 0, criticalCount: 0, ownerCount: 0 });
      } catch {
        toast.error('Failed to fetch audit logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [canView, page, search, action, entity, role]);

  const pageMetrics = [
    { label: 'Total events', value: summary.total, icon: Activity, tone: 'text-[#6ea8fe]' },
    { label: 'Today', value: summary.todayCount, icon: Clock3, tone: 'text-[#34d399]' },
    { label: 'Critical changes', value: summary.criticalCount, icon: ShieldAlert, tone: 'text-[#f87171]' },
    { label: 'Owner actions', value: summary.ownerCount, icon: UserCog, tone: 'text-[#fbbf24]' },
  ];

  const filters = [
    { value: action, onChange: setAction, options: ['all', 'LOGIN', 'LOGOUT', 'SIGNUP', 'PASSWORD_RESET', 'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED', 'STAFF_CREATED', 'STAFF_UPDATED', 'STAFF_DELETED', 'STAFF_DEACTIVATED', 'EXPENSE_CREATED', 'EXPENSE_APPROVED', 'PURCHASE_ORDER_CREATED', 'PURCHASE_ORDER_STATUS_UPDATED', 'SALE_COMPLETED', 'REFUND_REQUESTED', 'REFUND_APPROVED', 'REFUND_REJECTED', 'REFUND_PROCESSED', 'SETTINGS_UPDATED'] },
    { value: entity, onChange: setEntity, options: ['all', 'USER', 'PRODUCT', 'SALE', 'REFUND', 'EXPENSE', 'PURCHASE_ORDER', 'SETTINGS'] },
    { value: role, onChange: setRole, options: ['all', 'OWNER', 'MANAGER', 'STAFF'] },
  ] as const;

  if (!canView && !loading) {
    return (
      <div className="min-h-screen bg-[#111318] p-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-2xl mx-auto border border-white/[0.06] rounded-2xl bg-white/[0.03] p-8">
          <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <ShieldAlert size={18} className="text-red-400" />
          </div>
          <h1 className="text-[20px] font-semibold text-[#c8cdd8]">Access restricted</h1>
          <p className="text-[12px] text-[#3a404f] mt-2">
            Audit logs are available to owners and managers only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111318] p-5 space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#333844] mb-1">Security</p>
          <h1 className="text-[20px] font-semibold text-[#c8cdd8] tracking-tight leading-none">Audit Logs</h1>
          <p className="text-[12px] text-[#3a404f] mt-2 max-w-2xl">
            Track sensitive changes across staff, inventory, sales, refunds, expenses, and settings.
          </p>
        </div>
        {statusPill(user?.role ?? 'STAFF', ROLE_BADGE[user?.role ?? 'STAFF'].bg, ROLE_BADGE[user?.role ?? 'STAFF'].text, ROLE_BADGE[user?.role ?? 'STAFF'].dot)}
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {pageMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-[#111318] border border-white/[0.055] rounded-[10px] p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-[8px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <Icon size={14} className={metric.tone} />
                </div>
                <span className="text-[10px] uppercase tracking-[0.08em] text-[#3a404f]">Live</span>
              </div>
              <p className="text-[22px] font-semibold text-[#c8cdd8] tracking-tight leading-none" style={{ fontFamily: "'DM Mono', monospace" }}>
                {metric.value}
              </p>
              <p className="text-[11px] font-medium text-[#505668] mt-2">{metric.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-[#111318] border border-white/[0.055] rounded-[12px] p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5060]" />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search by user, action, entity, or details..."
              className="w-full h-10 pl-9 pr-3 rounded-[8px] bg-white/[0.03] border border-white/[0.07] text-[13px] text-[#c8cdd8] outline-none"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={13} className="text-[#4a5060]" />
            {filters.map((filter, index) => (
              <select
                key={index}
                value={filter.value}
                onChange={(e) => {
                  setPage(1);
                  filter.onChange(e.target.value);
                }}
                className="h-10 px-3 rounded-[8px] bg-white/[0.03] border border-white/[0.07] text-[12px] text-[#c8cdd8] outline-none"
              >
                {filter.options.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All' : option.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#111318] border border-white/[0.055] rounded-[12px] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner w-10 h-10" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-11 h-11 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <ShieldAlert size={18} className="text-[#3a404f]" />
            </div>
            <p className="text-[13px] font-medium text-[#3a404f]">No audit activity found</p>
            <p className="text-[11px] text-[#3a404f]">Try clearing filters or wait for new changes to appear.</p>
          </div>
        ) : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                  {['Time', 'Actor', 'Action', 'Entity', 'Details', 'IP'].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[#3a404f]">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const actionStyle = ACTION_STYLES[row.action] ?? defaultActionStyle;
                  const roleStyle = ROLE_BADGE[row.actorRole ?? row.user.role] ?? ROLE_BADGE.STAFF;
                  const ActionIcon = actionStyle.icon;

                  return (
                    <tr key={row.id} className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors">
                      <td className="px-4 py-3 text-[12px] text-[#3a404f] whitespace-nowrap">
                        {new Date(row.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#1f4ded] to-[#1f6feb] flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0">
                            {row.user.fullName.split(' ').map((name) => name[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-semibold text-[#c8cdd8] truncate">{row.user.fullName}</p>
                            <p className="text-[11px] text-[#3a404f] truncate">{row.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: actionStyle.bg, color: actionStyle.text, fontSize: 11, fontWeight: 600, border: '1px solid rgba(255,255,255,0.06)' }}>
                          <ActionIcon size={12} />
                          {row.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[12px] font-semibold text-[#c8cdd8]">{row.entity.replace(/_/g, ' ')}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: roleStyle.bg, color: roleStyle.text, fontSize: 11, fontWeight: 600, width: 'fit-content' }}>
                            <span style={{ width: 6, height: 6, borderRadius: 999, background: roleStyle.dot }} />
                            {row.actorRole ?? row.user.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#3a404f] max-w-[380px]">
                        <span className="block truncate" title={row.details ?? undefined}>
                          {row.details ?? 'No details provided'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#3a404f] whitespace-nowrap">
                        {row.ipAddress ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.05] bg-white/[0.015]">
              <p className="text-[11.5px] text-[#3a404f]">
                Page {page} of {pages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="h-8 px-3 rounded-[8px] border border-white/[0.07] text-[12px] text-[#4a5060] hover:text-[#c8cdd8] hover:bg-white/[0.04] disabled:opacity-40"
                >
                  <ChevronLeft size={13} className="inline-block mr-1" />
                  Previous
                </button>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage((current) => Math.min(pages, current + 1))}
                  className="h-8 px-3 rounded-[8px] border border-white/[0.07] text-[12px] text-[#4a5060] hover:text-[#c8cdd8] hover:bg-white/[0.04] disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={13} className="inline-block ml-1" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;