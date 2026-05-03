import { useState, useEffect, useMemo } from 'react';
import { expenseAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Plus, DollarSign, CheckCircle, XCircle, Clock, Search, TrendingUp, TrendingDown, X } from 'lucide-react';

interface Expense {
  id: number;
  category: string;
  amount: number;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  expenseDate: string;
  user: { fullName: string };
}

const CATEGORIES = ['Rent','Utilities','Salaries','Maintenance','Marketing','Transportation','Office Supplies','Insurance','Other'];

const STATUS_CFG = {
  PENDING:  { icon: Clock,        color: 'text-amber-400',  bg: 'bg-amber-400/10 border-amber-400/25',  dot: 'bg-amber-400'  },
  APPROVED: { icon: CheckCircle,  color: 'text-emerald-400',bg: 'bg-emerald-400/10 border-emerald-400/25',dot: 'bg-emerald-400'},
  REJECTED: { icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/25',       dot: 'bg-red-400'    },
} as const;

const fmt = (n: number) => `৳${n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Stat card ──────────────────────────────────────────────────────────────────

const Stat = ({ label, value, sub, icon: Icon, iconColor }: { label: string; value: string; sub?: string; icon: typeof DollarSign; iconColor: string }) => (
  <div className="border border-white/[0.055] rounded-xl bg-white/[0.02] px-4 py-4 flex items-start justify-between hover:border-white/[0.09] transition-colors">
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-widest text-[#3a404f]">{label}</p>
      <p className="text-[21px] font-bold text-[#e2e5eb] mt-1.5 leading-none">{value}</p>
      {sub && <p className="text-[11px] text-[#3a404f] mt-1.5">{sub}</p>}
    </div>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
      <Icon size={15} />
    </div>
  </div>
);

// ── Add modal ──────────────────────────────────────────────────────────────────

const AddModal = ({ onClose, onSave }: { onClose: () => void; onSave: () => void }) => {
  const [form, setForm] = useState({ category: '', amount: '', description: '', expenseDate: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.amount) return;
    setSaving(true);
    try {
      await expenseAPI.create({ ...form, amount: Number(form.amount) });
      toast.success('Expense submitted');
      onSave();
    } catch { toast.error('Failed to create expense'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-[#13161c] border border-white/[0.08] rounded-2xl shadow-2xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-[15px] font-semibold text-[#f0f2f5]">New Expense</h2>
            <p className="text-[11.5px] text-[#3a404f] mt-0.5">Submit for approval</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-[#3a404f] hover:text-[#c8cdd8] transition-all">
            <X size={14} />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#3a404f] block mb-1.5">Category</label>
              <select required value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full h-9 px-3 text-[13px] bg-white/[0.04] border border-white/[0.07] rounded-lg text-[#c8cdd8] outline-none focus:border-[#1f6feb]/60 transition-all appearance-none">
                <option value="">Select a category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#3a404f] block mb-1.5">Amount (BDT)</label>
              <input required type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)}
                className="w-full h-9 px-3 text-[13px] bg-white/[0.04] border border-white/[0.07] rounded-lg text-[#c8cdd8] outline-none focus:border-[#1f6feb]/60 transition-all" />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#3a404f] block mb-1.5">Date</label>
              <input required type="date" value={form.expenseDate} onChange={e => set('expenseDate', e.target.value)}
                className="w-full h-9 px-3 text-[13px] bg-white/[0.04] border border-white/[0.07] rounded-lg text-[#c8cdd8] outline-none focus:border-[#1f6feb]/60 transition-all" />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#3a404f] block mb-1.5">Description</label>
              <textarea required rows={3} placeholder="What was this expense for?" value={form.description} onChange={e => set('description', e.target.value)}
                className="w-full px-3 py-2.5 text-[13px] bg-white/[0.04] border border-white/[0.07] rounded-lg text-[#c8cdd8] outline-none focus:border-[#1f6feb]/60 transition-all resize-none" />
            </div>
          </div>
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-9 text-[13px] font-medium text-[#6b7280] border border-white/[0.07] rounded-lg hover:bg-white/[0.04] transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 h-9 text-[13px] font-medium text-white bg-[#1f6feb] rounded-lg hover:bg-[#1a5fd4] disabled:opacity-50 transition-all">
              {saving ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────

const Expenses = () => {
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<string>('all');
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuthStore();

  const fetch = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await expenseAPI.getAll(params);
      setExpenses(res.data.data);
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [filter]);

  const approve = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await expenseAPI.approve(id, status);
      toast.success(`Expense ${status === 'APPROVED' ? 'approved' : 'rejected'}`);
      fetch();
    } catch { toast.error('Failed to update status'); }
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return expenses.filter(e =>
      !q || e.category.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.user.fullName.toLowerCase().includes(q)
    );
  }, [expenses, search]);

  const stats = useMemo(() => {
    const approved = expenses.filter(e => e.status === 'APPROVED').reduce((s, e) => s + e.amount, 0);
    const pending  = expenses.filter(e => e.status === 'PENDING');
    const now = new Date();
    const thisMonth = expenses.filter(e => {
      const d = new Date(e.expenseDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = expenses.filter(e => {
      const d = new Date(e.expenseDate);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    });
    const trend = lastMonth.length ? ((thisMonth.length - lastMonth.length) / lastMonth.length) * 100 : null;
    return { approved, pending: pending.length, thisMonth: thisMonth.length, trend };
  }, [expenses]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#111318] p-5 space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-[#f0f2f5] tracking-tight">Expenses</h1>
          <p className="text-[11.5px] text-[#3a404f] mt-0.5">Track and manage business expenses</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 h-8 text-[12.5px] font-medium text-white bg-[#1f6feb] rounded-lg hover:bg-[#1a5fd4] transition-all">
          <Plus size={13} /> Add Expense
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Total Approved" value={fmt(stats.approved)} icon={DollarSign} iconColor="bg-emerald-400/10 text-emerald-400" sub="approved expenses" />
        <Stat label="Pending Review" value={`${stats.pending}`} icon={Clock} iconColor="bg-amber-400/10 text-amber-400" sub={stats.pending === 1 ? 'awaiting decision' : 'awaiting decisions'} />
        <Stat label="This Month" value={`${stats.thisMonth}`}
          sub={stats.trend != null ? `${stats.trend >= 0 ? '+' : ''}${stats.trend.toFixed(0)}% vs last month` : 'no prior data'}
          icon={stats.trend != null && stats.trend < 0 ? TrendingDown : TrendingUp}
          iconColor="bg-[#1f6feb]/10 text-[#6ea8fe]" />
      </div>

      {/* Filters + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          {(['all', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 h-7 text-[12px] font-medium rounded-md transition-all ${filter === s ? 'bg-[#1f6feb] text-white' : 'text-[#3a404f] hover:text-[#c8cdd8]'}`}>
              {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a404f]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses…"
            className="w-full h-8 pl-8 pr-3 text-[12.5px] bg-white/[0.04] border border-white/[0.07] rounded-lg text-[#c8cdd8] placeholder:text-[#3a404f] outline-none focus:border-[#1f6feb]/60 transition-all" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#3a404f] hover:text-[#c8cdd8]">
              <X size={11} />
            </button>
          )}
        </div>
        <span className="text-[11.5px] text-[#3a404f] ml-auto">{visible.length} result{visible.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 rounded-full border-2 border-white/10 border-t-[#1f6feb] animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 border border-white/[0.055] rounded-xl bg-white/[0.02] gap-3">
          <DollarSign size={28} className="text-[#3a404f]" />
          <p className="text-[13px] text-[#3a404f]">{search ? 'No matching expenses' : 'No expenses yet'}</p>
          {!search && (
            <button onClick={() => setShowModal(true)} className="text-[12.5px] text-white bg-[#1f6feb] rounded-md px-3 py-1 hover:bg-[#1f6feb]/80 hover:text-white">Add one</button>
          )}
        </div>
      ) : (
        <div className="border border-white/[0.055] rounded-xl overflow-hidden">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {['Date', 'Category', 'Description', 'Amount', 'Submitted By', 'Status', ...(user?.role === 'OWNER' ? ['Actions'] : [])].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-widest text-[#3a404f]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((exp, i) => {
                const cfg = STATUS_CFG[exp.status];
                return (
                  <tr key={exp.id} className={`border-b border-white/[0.035] hover:bg-white/[0.025] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                    <td className="px-4 py-3 text-[#6b7280] whitespace-nowrap">
                      {new Date(exp.expenseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-[11.5px] font-medium text-[#6ea8fe] bg-[#1f6feb]/10 border border-[#1f6feb]/20">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#c8cdd8] max-w-[200px] truncate" title={exp.description}>{exp.description}</td>
                    <td className="px-4 py-3 font-semibold text-[#e2e5eb] whitespace-nowrap">{fmt(exp.amount)}</td>
                    <td className="px-4 py-3 text-[#6b7280]">{exp.user.fullName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11.5px] font-medium border ${cfg.bg} ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {exp.status.charAt(0) + exp.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    {user?.role === 'OWNER' && (
                      <td className="px-4 py-3">
                        {exp.status === 'PENDING' ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => approve(exp.id, 'APPROVED')}
                              className="flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-400 border border-emerald-400/25 bg-emerald-400/10 rounded-md hover:bg-emerald-400/20 transition-all">
                              <CheckCircle size={11} /> Approve
                            </button>
                            <button onClick={() => approve(exp.id, 'REJECTED')}
                              className="flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-semibold text-red-400 border border-red-400/25 bg-red-400/10 rounded-md hover:bg-red-400/20 transition-all">
                              <XCircle size={11} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#3a404f]">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <AddModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetch(); }} />}
    </div>
  );
};

export default Expenses;