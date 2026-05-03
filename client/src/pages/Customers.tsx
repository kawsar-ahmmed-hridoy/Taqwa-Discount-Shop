import { useState, useEffect, useMemo, useCallback } from 'react';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Award, X, User, Phone, Mail, MapPin, ShoppingBag, TrendingUp } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  loyaltyPoints: number;
  createdAt: string;
}

const EMPTY_FORM = { name: '', phone: '', email: '', address: '' };

const fmt = (n: number) => `৳${n.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

const Avatar = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) => {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const dim = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-[12px]';
  return (
    <div className={`${dim} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{ background: `hsl(${hue},35%,22%)`, color: `hsl(${hue},70%,65%)`, border: `1px solid hsl(${hue},40%,30%)` }}>
      {initials}
    </div>
  );
};


// ── Customer drawer (edit / view) ─────────────────────────────────────────────

const CustomerDrawer = ({ customer, onClose, onSaved }: { customer: Customer | 'new'; onClose: () => void; onSaved: () => void }) => {
  const isEdit = customer !== 'new';
  const [form, setForm]   = useState(isEdit ? { name: customer.name, phone: customer.phone, email: customer.email ?? '', address: customer.address ?? '' } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      isEdit ? await customerAPI.update(customer.id, form) : await customerAPI.create(form);
      toast.success(isEdit ? 'Customer updated' : 'Customer created');
      onSaved();
    } catch { toast.error('Operation failed'); }
    finally { setSaving(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <div className="w-screen max-w-md">
        <ModalHeader title={isEdit ? `Edit — ${customer.name}` : 'New Customer'} onClose={onClose} />
        <form onSubmit={submit} className="p-6 space-y-4">
          {[
            { key: 'name',    label: 'Full Name',  type: 'text',  required: true,  placeholder: 'e.g. Hridoy' },
            { key: 'phone',   label: 'Phone',      type: 'tel',   required: true,  placeholder: '01XXXXXXXXX' },
            { key: 'email',   label: 'Email',      type: 'email', required: false, placeholder: 'optional' },
            { key: 'address', label: 'Address',    type: 'text',  required: false, placeholder: 'optional' },
          ].map(({ key, label, type, required, placeholder }) => (
            <div key={key}>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#3a404f] block mb-1.5">{label}{required && ' *'}</label>
              <input type={type} required={required} placeholder={placeholder} value={(form as any)[key]}
                onChange={e => set(key, e.target.value)}
                className="w-full h-9 px-4 text-[13px] bg-white/[0.04] border border-white/[0.07] rounded-lg text-[#c8cdd8] outline-none focus:border-[#1f6feb]/60 transition-all" />
            </div>
          ))}
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-9 text-[13px] font-medium text-[#6b7280] border border-white/[0.07] rounded-lg hover:bg-white/[0.04] transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 h-9 text-[13px] font-medium text-white bg-[#1f6feb] rounded-lg hover:bg-[#1a5fd4] disabled:opacity-50 transition-all">
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
};

// ── Purchase history modal ────────────────────────────────────────────────────

const HistoryModal = ({ customer, onClose }: { customer: Customer; onClose: () => void }) => {
  const [history, setHistory]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    customerAPI.getHistory(customer.id)
      .then(r => setHistory(r.data.data))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, [customer.id]);

  const total = history.reduce((s, h) => s + h.total, 0);

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-lg">
        <ModalHeader title={`History — ${customer.name}`} onClose={onClose} />
        <div className="px-6 pb-2 pt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Orders',          value: `${history.length}` },
            { label: 'Total Spent',     value: loading ? '…' : fmt(total) },
            { label: 'Loyalty Points',  value: `${customer.loyaltyPoints} pts` },
          ].map(({ label, value }) => (
            <div key={label} className="border border-white/[0.055] rounded-xl bg-white/[0.02] px-3 py-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-[#3a404f] font-semibold">{label}</p>
              <p className="text-[14px] font-bold leading-none" style={{ color: 'var(--text)', marginTop: '0.25rem' }}>{value}</p>
            </div>
          ))}
        </div>
        <div className="p-6 pt-3 space-y-1.5 max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#1f6feb] animate-spin" /></div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-[13px] text-[#3a404f]">No purchases yet</div>
          ) : history.map(sale => (
            <div key={sale.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
              <div>
                <p className="text-[12.5px] font-medium" style={{ color: 'var(--text)' }}>{sale.invoiceNo}</p>
                <p className="text-[11px] text-[#3a404f]">{new Date(sale.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · {sale.items.length} items</p>
              </div>
              <span className="text-[12.5px] font-semibold text-emerald-400">{fmt(sale.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </Overlay>
  );
};

// ── Shared primitives ─────────────────────────────────────────────────────────

const Overlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="modal-content w-full" style={{ maxWidth: 'fit-content', fontFamily: "'DM Sans', sans-serif" }}>
      {children}
    </div>
  </div>
);

const ModalHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
    <p className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>{title}</p>
    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-[#3a404f] hover:text-[#c8cdd8] transition-all"><X size={14} /></button>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────

const Customers = () => {
  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [sort, setSort]             = useState<'name' | 'points' | 'date'>('date');
  const [modal, setModal]           = useState<null | 'new' | Customer>(null);
  const [historyFor, setHistoryFor] = useState<Customer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await customerAPI.getAll({ search });
      setCustomers(r.data.data);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return [...customers]
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email?.toLowerCase().includes(q))
      .sort((a, b) =>
        sort === 'points' ? b.loyaltyPoints - a.loyaltyPoints :
        sort === 'name'   ? a.name.localeCompare(b.name) :
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [customers, search, sort]);

  const topSpender = useMemo(() => customers.reduce((t, c) => c.loyaltyPoints > (t?.loyaltyPoints ?? -1) ? c : t, null as Customer | null), [customers]);

  return (
    <div className="min-h-screen bg-[#111318] p-5 space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Customers</h1>
          <p className="text-[11.5px] text-[#3a404f] mt-0.5">{customers.length} registered customers</p>
        </div>
        <button onClick={() => setModal('new')} className="flex items-center gap-1.5 px-3 h-8 text-[12.5px] font-medium text-white bg-[#1f6feb] rounded-lg hover:bg-[#1a5fd4] transition-all">
          <Plus size={13} /> Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Customers',  value: `${customers.length}`,                                               icon: User,        color: 'text-[#6ea8fe] bg-[#1f6feb]/10' },
          { label: 'Total Loyalty Pts',value: `${customers.reduce((s, c) => s + c.loyaltyPoints, 0).toLocaleString()}`, icon: Award,  color: 'text-amber-400 bg-amber-400/10' },
          { label: 'New This Month',   value: `${customers.filter(c => { const d = new Date(c.createdAt), n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length}`, icon: TrendingUp, color: 'text-emerald-400 bg-emerald-400/10' },
          { label: 'Top Loyalty',      value: topSpender ? `${topSpender.loyaltyPoints} pts` : '—',                icon: Award,       color: 'text-amber-400 bg-amber-400/10', sub: topSpender?.name },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="border border-white/[0.055] rounded-xl bg-white/[0.02] px-4 py-3.5 flex items-start justify-between hover:border-white/[0.09] transition-colors">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-widest text-[#3a404f]">{label}</p>
              <p className="text-[19px] font-bold leading-none" style={{ color: 'var(--text)', marginTop: '0.25rem' }}>{value}</p>
              {sub && <p className="text-[11px] text-[#3a404f] mt-1 truncate max-w-[100px]">{sub}</p>}
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}><Icon size={14} /></div>
          </div>
        ))}
      </div>

      {/* Search + sort */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a404f]" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
            placeholder="Name, phone, or email…"
            className="w-full h-8 pl-8 pr-8 text-[12.5px] bg-white/[0.04] border border-white/[0.07] rounded-lg text-[#c8cdd8] placeholder:text-[#3a404f] outline-none focus:border-[#1f6feb]/60 transition-all" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#3a404f] hover:text-[#c8cdd8]"><X size={11} /></button>}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          {([['date', 'Newest'], ['name', 'Name'], ['points', 'Points']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setSort(key)}
              className={`px-3 h-7 text-[12px] font-medium rounded-md transition-all ${sort === key ? 'bg-[#1f6feb] text-white' : 'text-[#3a404f] hover:text-[#c8cdd8]'}`}>
              {label}
            </button>
          ))}
        </div>

        <span className="text-[11.5px] text-[#3a404f] ml-auto">{visible.length} customer{visible.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 rounded-full border-2 border-white/10 border-t-[#1f6feb] animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 border border-white/[0.055] rounded-xl bg-white/[0.02] gap-3">
          <User size={26} className="text-[#3a404f]" />
          <p className="text-[13px] text-[#3a404f]">{search ? 'No matching customers' : 'No customers yet'}</p>
          {!search && <button onClick={() => setModal('new')} className="text-[12.5px] text-[#6ea8fe] hover:underline">Add one</button>}
        </div>
      ) : (
        <div className="border border-white/[0.055] rounded-xl overflow-hidden">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {['Customer', 'Contact', 'Address', 'Loyalty', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10.5px] font-semibold uppercase tracking-widest text-[#3a404f]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((c, i) => (
                <tr key={c.id} className={`border-b border-white/[0.035] hover:bg-white/[0.025] transition-colors ${i % 2 ? 'bg-white/[0.01]' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.name} />
                      <div>
                        <p className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{c.name}</p>
                        <p className="text-[11px] text-[#3a404f]">Joined {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[12.5px] text-[#c8cdd8] flex items-center gap-1.5"><Phone size={10} className="text-[#3a404f]" />{c.phone}</p>
                    {c.email && <p className="text-[11.5px] text-[#3a404f] flex items-center gap-1.5 mt-0.5"><Mail size={10} />{c.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-[#6b7280] max-w-[160px] truncate">
                    {c.address ? <span className="flex items-center gap-1.5"><MapPin size={10} className="text-[#3a404f] shrink-0" />{c.address}</span> : <span className="text-[#3a404f]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11.5px] font-semibold border
                      ${c.loyaltyPoints >= 100 ? 'text-amber-400 bg-amber-400/10 border-amber-400/25' : 'text-[#6b7280] bg-white/[0.03] border-white/[0.06]'}`}>
                      <Award size={11} /> {c.loyaltyPoints.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setHistoryFor(c)} title="Purchase history"
                        className="flex items-center gap-1 px-2 py-1 text-[11.5px] font-medium text-[#6ea8fe] border border-[#1f6feb]/25 bg-[#1f6feb]/10 rounded-md hover:bg-[#1f6feb]/20 transition-all">
                        <ShoppingBag size={10} /> History
                      </button>
                      <button onClick={() => setModal(c)} title="Edit"
                        className="w-6 h-6 flex items-center justify-center rounded-md text-[#3a404f] hover:text-[#c8cdd8] hover:bg-white/[0.06] transition-all">
                        <Edit size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <CustomerDrawer customer={modal === 'new' ? 'new' : modal as Customer} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {historyFor && <HistoryModal customer={historyFor} onClose={() => setHistoryFor(null)} />}
    </div>
  );
};

export default Customers;