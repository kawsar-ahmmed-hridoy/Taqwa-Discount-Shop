import { useState, useEffect, useMemo } from 'react';
import { supplierAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Phone, Mail, MapPin, Search, X, Building2, User } from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
}

const EMPTY = { name: '', contactPerson: '', phone: '', email: '', address: '' };

const FIELDS = [
  { key: 'name',          label: 'Company Name',   type: 'text',  required: true,  placeholder: 'e.g. Dhaka Traders Ltd.' },
  { key: 'contactPerson', label: 'Contact Person',  type: 'text',  required: true,  placeholder: 'e.g. Karim Hossain' },
  { key: 'phone',         label: 'Phone',           type: 'tel',   required: true,  placeholder: '01XXXXXXXXX' },
  { key: 'email',         label: 'Email',           type: 'email', required: false, placeholder: 'optional' },
  { key: 'address',       label: 'Address',         type: 'text',  required: false, placeholder: 'optional' },
] as const;

// ── Avatar ────────────────────────────────────────────────────────────────────

const Avatar = ({ name }: { name: string }) => {
  const letters = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-bold shrink-0"
      style={{ background: `hsl(${hue},30%,18%)`, color: `hsl(${hue},65%,62%)`, border: `1px solid hsl(${hue},35%,26%)` }}>
      {letters}
    </div>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────

const Modal = ({ supplier, onClose, onSaved }: { supplier: Supplier | null; onClose: () => void; onSaved: () => void }) => {
  const [form, setForm]     = useState(supplier ? { name: supplier.name, contactPerson: supplier.contactPerson, phone: supplier.phone, email: supplier.email ?? '', address: supplier.address ?? '' } : { ...EMPTY });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      supplier ? await supplierAPI.update(supplier.id, form) : await supplierAPI.create(form);
      toast.success(supplier ? 'Supplier updated' : 'Supplier created');
      onSaved();
    } catch { toast.error('Operation failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content w-full max-w-md" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <p className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>{supplier ? `Edit — ${supplier.name}` : 'New Supplier'}</p>
            <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--muted)' }}>{supplier ? 'Update supplier information' : 'Add a new supplier'}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06]" style={{ color: 'var(--muted)' }}><X size={14} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {FIELDS.map(({ key, label, type, required, placeholder }) => (
            <div key={key}>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#3a404f] block mb-1.5">{label}{required && ' *'}</label>
              <input type={type} required={required} placeholder={placeholder} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="input-field h-9 text-[13px]" />
            </div>
          ))}
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-9 text-[13px] font-medium border rounded-lg hover:bg-white/[0.04] transition-all" style={{ color: 'var(--muted)', borderColor: 'var(--border-subtle)' }}>Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 h-9 text-[13px] font-medium text-white bg-[var(--accent)] rounded-lg hover:opacity-95 disabled:opacity-50 transition-all">
              {saving ? 'Saving…' : supplier ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState<Supplier | 'new' | null>(null);
  const [deleting, setDeleting]   = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try { const r = await supplierAPI.getAll(); setSuppliers(r.data.data); }
    catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: number) => {
    if (!confirm('Delete this supplier? This action cannot be undone.')) return;
    setDeleting(id);
    try { await supplierAPI.delete(id); toast.success('Supplier deleted'); setSuppliers(s => s.filter(x => x.id !== id)); }
    catch { toast.error('Failed to delete supplier'); }
    finally { setDeleting(null); }
  };

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return suppliers.filter(s => !q || s.name.toLowerCase().includes(q) || s.contactPerson.toLowerCase().includes(q) || s.phone.includes(q));
  }, [suppliers, search]);

  return (
    <div className="min-h-screen bg-[#111318] p-5 space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Suppliers</h1>
          <p className="text-[11.5px] text-[#3a404f] mt-0.5">{suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModal('new')} className="flex items-center gap-1.5 px-3 h-8 text-[12.5px] font-medium text-white bg-[#1f6feb] rounded-lg hover:bg-[#1a5fd4] transition-all">
          <Plus size={13} /> Add Supplier
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a404f]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, contact, or phone…"
            className="w-full h-8 pl-8 pr-8 text-[12.5px] bg-white/[0.04] border border-white/[0.07] rounded-lg text-[#c8cdd8] placeholder:text-[#3a404f] outline-none focus:border-[#1f6feb]/60 transition-all" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#3a404f] hover:text-[#c8cdd8]"><X size={11} /></button>}
        </div>
        <span className="text-[11.5px] text-[#3a404f] ml-auto">{visible.length} result{visible.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 rounded-full border-2 border-white/10 border-t-[#1f6feb] animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 border border-white/[0.055] rounded-xl bg-white/[0.02] gap-3">
          <Building2 size={26} className="text-[#3a404f]" />
          <p className="text-[13px] text-[#3a404f]">{search ? 'No matching suppliers' : 'No suppliers yet'}</p>
          {!search && <button onClick={() => setModal('new')} className="text-[12.5px] text-white border border-[#1f6feb] bg-[#1f6feb] hover:bg-[#488df5] rounded-md px-3 py-1">Add one</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map(s => (
            <div key={s.id} className="border border-white/[0.055] rounded-xl bg-white/[0.02] p-4 flex flex-col gap-3 hover:border-white/[0.09] hover:bg-white/[0.03] transition-all group">

              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={s.name} />
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold truncate" style={{ color: 'var(--text)' }}>{s.name}</p>
                    <p className="text-[11.5px] text-[#3a404f] flex items-center gap-1 mt-0.5"><User size={10} />{s.contactPerson}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => setModal(s)} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#3a404f] hover:text-[#6ea8fe] hover:bg-[#1f6feb]/10 transition-all">
                    <Edit size={13} />
                  </button>
                  <button onClick={() => remove(s.id)} disabled={deleting === s.id} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#3a404f] hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-40">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-1.5 border-t border-white/[0.04] pt-3">
                <a href={`tel:${s.phone}`} className="flex items-center gap-2 text-[12px] text-[#6b7280] hover:text-[#c8cdd8] transition-colors">
                  <Phone size={11} className="text-[#3a404f] shrink-0" /> {s.phone}
                </a>
                {s.email && (
                  <a href={`mailto:${s.email}`} className="flex items-center gap-2 text-[12px] text-[#6b7280] hover:text-[#c8cdd8] transition-colors truncate">
                    <Mail size={11} className="text-[#3a404f] shrink-0" /> {s.email}
                  </a>
                )}
                {s.address && (
                  <p className="flex items-start gap-2 text-[12px] text-[#6b7280]">
                    <MapPin size={11} className="text-[#3a404f] shrink-0 mt-0.5" /> {s.address}
                  </p>
                )}
              </div>

              {/* Footer */}
              <p className="text-[10.5px] text-[#3a404f] border-t border-white/[0.04] pt-2.5 mt-auto">
                Added {new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          supplier={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
};

export default Suppliers;