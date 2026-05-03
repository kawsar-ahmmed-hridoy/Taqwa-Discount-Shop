import { useState, useEffect, useMemo } from 'react';
import { purchaseOrderAPI, supplierAPI, productAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Truck, XCircle, Search, X, Eye, MoreHorizontal, Package, Receipt } from 'lucide-react';

interface OrderItem { id: number; product: { name: string }; quantity: number; price: number; total: number; }
interface PurchaseOrder {
  id: number; orderNo: string;
  supplier: { id: number; name: string };
  status: 'PENDING' | 'DELIVERED' | 'CANCELLED';
  orderDate: string; deliveryDate?: string;
  total: number; notes?: string; items: OrderItem[];
}

const fmt     = (n: number) => `৳${n.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS = {
  PENDING:   { dot: 'bg-amber-400',   text: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/25'   },
  DELIVERED: { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/25' },
  CANCELLED: { dot: 'bg-red-400',     text: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/25'     },
} as const;

const Badge = ({ status }: { status: keyof typeof STATUS }) => {
  const c = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
};

const Lbl = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#3a404f] mb-1.5">{children}</p>
);

// ── Detail drawer ──────────────────────────────────────────────────────────────

const Drawer = ({ order, onClose }: { order: PurchaseOrder; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
    <div className="flex-1 bg-black/55" onClick={onClose} />
    <div className="w-[400px] bg-[#13161c] border-l border-white/[0.07] flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div>
          <p className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{order.orderNo}</p>
          <p className="text-[11.5px] text-[#3a404f] mt-0.5">{order.supplier.name}</p>
        </div>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-[#3a404f] hover:text-[#c8cdd8] transition-all"><X size={14} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="border border-white/[0.055] rounded-xl bg-white/[0.02] p-4 space-y-2.5">
          <div className="flex items-center justify-between"><span className="text-[12px] text-[#3a404f]">Status</span><Badge status={order.status} /></div>
          <div className="flex items-center justify-between"><span className="text-[12px] text-[#3a404f]">Order Date</span><span className="text-[12px] text-[#c8cdd8]">{fmtDate(order.orderDate)}</span></div>
          {order.deliveryDate && <div className="flex items-center justify-between"><span className="text-[12px] text-[#3a404f]">Delivered</span><span className="text-[12px] text-emerald-400">{fmtDate(order.deliveryDate)}</span></div>}
          {order.notes && <div className="pt-2 border-t border-white/[0.04]"><p className="text-[11px] text-[#3a404f]">Notes</p><p className="text-[12.5px] text-[#c8cdd8] mt-1">{order.notes}</p></div>}
        </div>
        <div>
          <Lbl>Line Items</Lbl>
          <div className="space-y-1.5">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02]">
                <div>
                  <p className="text-[12.5px] font-medium" style={{ color: 'var(--text)' }}>{item.product.name}</p>
                  <p className="text-[11px] text-[#3a404f]">{item.quantity} × {fmt(item.price)}</p>
                </div>
                <span className="text-[12.5px] font-semibold" style={{ color: 'var(--text)' }}>{fmt(item.total)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1f6feb]/10 border border-[#1f6feb]/20">
          <span className="text-[13px] text-[#6ea8fe]">Order Total</span>
          <span className="text-[16px] font-bold text-[#6ea8fe]">{fmt(order.total)}</span>
        </div>
      </div>
    </div>
  </div>
);

// ── Create modal ───────────────────────────────────────────────────────────────

const CreateModal = ({ suppliers, products, onClose, onCreated }: { suppliers: any[]; products: any[]; onClose: () => void; onCreated: () => void }) => {
  const [form, setForm]     = useState({ supplierId: 0, notes: '', items: [{ productId: 0, quantity: 1, price: 0 }] });
  const [saving, setSaving] = useState(false);

  const updateItem = (i: number, k: string, v: number) =>
    setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [k]: v }; return { ...f, items }; });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierId) return toast.error('Select a supplier');
    if (form.items.some(it => !it.productId)) return toast.error('Select a product for every row');
    setSaving(true);
    try { await purchaseOrderAPI.create(form); toast.success('Order created'); onCreated(); }
    catch { toast.error('Failed to create order'); }
    finally { setSaving(false); }
  };

  const subtotal = form.items.reduce((s, it) => s + it.quantity * it.price, 0);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="modal-content w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1f6feb]/15 flex items-center justify-center"><Package size={14} className="text-[#6ea8fe]" /></div>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>New Purchase Order</p>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>Order stock from a supplier</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-[#3a404f] hover:text-[#c8cdd8] transition-all"><X size={14} /></button>
        </div>
        <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <Lbl>Supplier *</Lbl>
            <select required value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: +e.target.value }))} className="input-field appearance-none">
              <option value={0} disabled>Select a supplier…</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Lbl>Order Items *</Lbl>
              <button type="button" onClick={() => setForm(f => ({ ...f, items: [...f.items, { productId: 0, quantity: 1, price: 0 }] }))}
                className="flex items-center gap-1 text-[12px] text-[#6ea8fe] hover:text-[#93c5fd] transition-colors">
                <Plus size={11} /> Add row
              </button>
            </div>
              <div className="grid grid-cols-[1fr_64px_100px_24px] gap-1.5 mb-2 px-0.5">
              {['Product', 'Qty', 'Price (৳)', ''].map(h => <p key={h} className="text-[10px] uppercase tracking-wider text-[#3a404f] font-semibold">{h}</p>)}
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_64px_100px_24px] gap-1.5 items-center">
                  <select required value={item.productId} onChange={e => updateItem(i, 'productId', +e.target.value)} className="input-field appearance-none">
                    <option value={0} disabled>Select…</option>
                    {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="number" required min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', +e.target.value)} className="input-field text-center" />
                  <input type="number" required min="0" step="0.01" value={item.price} onChange={e => updateItem(i, 'price', +e.target.value)} className="input-field" />
                  <button type="button" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))}
                    disabled={form.items.length === 1}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-[#3a404f] hover:text-red-400 hover:bg-red-400/10 disabled:opacity-20 transition-all">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            {subtotal > 0 && (
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/[0.05]">
                <span className="text-[11.5px] text-[#3a404f]">Estimated total</span>
                <span className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{fmt(subtotal)}</span>
              </div>
            )}
          </div>
          <div>
            <Lbl>Notes</Lbl>
            <textarea rows={2} placeholder="Delivery instructions, references…" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2.5 text-[13px] bg-white/[0.04] border border-white/[0.07] rounded-lg text-[#c8cdd8] placeholder:text-[#3a404f] outline-none focus:border-[#1f6feb]/60 resize-none transition-all" />
          </div>
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-9 text-[13px] font-medium text-[#6b7280] border border-white/[0.07] rounded-lg hover:bg-white/[0.04] transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="flex-[2] h-9 text-[13px] font-medium text-white bg-[#1f6feb] rounded-lg hover:bg-[#1a5fd4] disabled:opacity-50 transition-all">
              {saving ? 'Creating…' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────

const PurchaseOrders = () => {
  const [orders, setOrders]       = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [drawer, setDrawer]       = useState<PurchaseOrder | null>(null);
  const [menu, setMenu]           = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [o, s, p] = await Promise.all([purchaseOrderAPI.getAll({}), supplierAPI.getAll(), productAPI.getAll()]);
      setOrders(o.data.data); setSuppliers(s.data.data); setProducts(p.data.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      await purchaseOrderAPI.updateStatus(id, { status, deliveryDate: status === 'DELIVERED' ? new Date().toISOString() : undefined });
      toast.success('Status updated'); setMenu(null); load();
    } catch { toast.error('Failed to update'); }
  };

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return orders
      .filter(o => (filter === 'all' || o.status === filter) && (!q || o.orderNo.toLowerCase().includes(q) || o.supplier.name.toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [orders, filter, search]);

  const stats = useMemo(() => ({
    pending:   orders.filter(o => o.status === 'PENDING').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
    value:     orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0),
  }), [orders]);

  return (
    <div className="min-h-screen bg-[#111318] p-5 space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Purchase Orders</h1>
          <p className="text-[11.5px] text-[#3a404f] mt-0.5">{orders.length} total orders</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 h-8 text-[12.5px] font-medium text-white bg-[#1f6feb] rounded-lg hover:bg-[#1a5fd4] transition-all">
          <Plus size={13} /> Create Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Orders', value: `${orders.length}`,   color: 'text-[#e2e5eb]' },
          { label: 'Pending',      value: `${stats.pending}`,   color: 'text-amber-400'  },
          { label: 'Delivered',    value: `${stats.delivered}`, color: 'text-emerald-400'},
          { label: 'Total Value',  value: fmt(stats.value),     color: 'text-[#6ea8fe]'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="border border-white/[0.055] rounded-xl bg-white/[0.02] px-4 py-3.5 hover:border-white/[0.09] transition-colors">
            <p className="text-[10.5px] font-semibold uppercase tracking-widest text-[#3a404f]">{label}</p>
            <p className={`text-[20px] font-bold mt-1 leading-none ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          {(['all','PENDING','DELIVERED','CANCELLED'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 h-7 text-[12px] font-medium rounded-md transition-all ${filter === s ? 'bg-[#1f6feb] text-white' : 'text-[#3a404f] hover:text-[#c8cdd8]'}`}>
              {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs flex-1">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a404f]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Order no. or supplier…"
            className="w-full h-8 pl-8 pr-8 text-[12.5px] bg-white/[0.04] border border-white/[0.07] rounded-lg text-[#c8cdd8] placeholder:text-[#3a404f] outline-none focus:border-[#1f6feb]/60 transition-all" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#3a404f] hover:text-[#c8cdd8]"><X size={11} /></button>}
        </div>
        <span className="text-[11.5px] text-[#3a404f] ml-auto">{visible.length} order{visible.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 rounded-full border-2 border-white/10 border-t-[#1f6feb] animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 border border-white/[0.055] rounded-xl bg-white/[0.02] gap-3">
          <Receipt size={26} className="text-[#3a404f]" />
          <p className="text-[13px] text-[#3a404f]">{search || filter !== 'all' ? 'No matching orders' : 'No orders yet'}</p>
          {!search && filter === 'all' && <button onClick={() => setShowModal(true)} className="text-[12.5px] text-[#6ea8fe] hover:underline">Create one</button>}
        </div>
      ) : (
        <div className="border border-white/[0.055] rounded-xl overflow-hidden">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {['Order', 'Supplier', 'Date', 'Items', 'Total', 'Status', ''].map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-[10.5px] font-semibold uppercase tracking-widest text-[#3a404f] ${i >= 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((o, i) => (
                <tr key={o.id} className={`border-b border-white/[0.035] hover:bg-white/[0.025] transition-colors ${i % 2 ? 'bg-white/[0.01]' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-[#6ea8fe] font-mono text-[12px]">{o.orderNo}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{o.supplier.name}</td>
                  <td className="px-4 py-3 text-[#6b7280]">{fmtDate(o.orderDate)}</td>
                  <td className="px-4 py-3 text-[#6b7280] text-right">{o.items.length}</td>
                  <td className="px-4 py-3 font-semibold text-right font-mono" style={{ color: 'var(--text)' }}>{fmt(o.total)}</td>
                  <td className="px-4 py-3 text-right"><Badge status={o.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setDrawer(o)} className="w-6 h-6 flex items-center justify-center rounded-md text-[#3a404f] hover:text-[#6ea8fe] hover:bg-[#1f6feb]/10 transition-all">
                        <Eye size={12} />
                      </button>
                      {o.status === 'PENDING' && (
                        <div className="relative">
                          <button onClick={() => setMenu(menu === o.id ? null : o.id)} className="w-6 h-6 flex items-center justify-center rounded-md text-[#3a404f] hover:text-[#c8cdd8] hover:bg-white/[0.06] transition-all">
                            <MoreHorizontal size={12} />
                          </button>
                          {menu === o.id && (
                            <div className="absolute right-0 top-full mt-1 z-30 bg-[#13161c] border border-white/[0.08] rounded-xl shadow-2xl py-1 w-40">
                              <button onClick={() => updateStatus(o.id, 'DELIVERED')} className="w-full flex items-center gap-2 px-3.5 py-2 text-[12.5px] text-emerald-400 hover:bg-white/[0.04] transition-colors">
                                <Truck size={12} /> Mark Delivered
                              </button>
                              <button onClick={() => updateStatus(o.id, 'CANCELLED')} className="w-full flex items-center gap-2 px-3.5 py-2 text-[12.5px] text-red-400 hover:bg-white/[0.04] transition-colors">
                                <XCircle size={12} /> Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 border-t border-white/[0.04] text-[11px] text-[#3a404f]">
            Showing {visible.length} of {orders.length} orders
          </div>
        </div>
      )}

      {menu !== null && <div className="fixed inset-0 z-20" onClick={() => setMenu(null)} />}
      {drawer    && <Drawer order={drawer} onClose={() => setDrawer(null)} />}
      {showModal && <CreateModal suppliers={suppliers} products={products} onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load(); }} />}
    </div>
  );
};

export default PurchaseOrders;