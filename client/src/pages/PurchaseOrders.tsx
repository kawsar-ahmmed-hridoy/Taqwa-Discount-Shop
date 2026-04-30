import { useState, useEffect, useMemo } from 'react';
import { purchaseOrderAPI, supplierAPI, productAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Plus, Package, Truck, XCircle,
  Search, CalendarDays,
  ArrowUpDown, Eye, MoreHorizontal, TrendingUp,
} from 'lucide-react';

interface OrderItem {
  id: number;
  product: { name: string };
  quantity: number;
  price: number;
  total: number;
}
interface PurchaseOrder {
  id: number;
  orderNo: string;
  supplier: { id: number; name: string };
  status: 'PENDING' | 'DELIVERED' | 'CANCELLED';
  orderDate: string;
  deliveryDate?: string;
  total: number;
  items: OrderItem[];
}

type SortField = 'orderDate' | 'total' | 'orderNo';
type SortDir = 'asc' | 'desc';

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   dot: 'var(--status-pending)', text: 'var(--status-pending-text)', bg: 'var(--status-pending-bg)' },
  DELIVERED: { label: 'Delivered', dot: 'var(--status-delivered)', text: 'var(--status-delivered-text)', bg: 'var(--status-delivered-bg)' },
  CANCELLED: { label: 'Cancelled', dot: 'var(--status-cancelled)', text: 'var(--status-cancelled-text)', bg: 'var(--status-cancelled-bg)'  },
};

const fmt = (n: number) => `BDT ${n.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/* ─── Tiny styled primitives ──────────────────────────────────────────────── */
const Badge = ({ status }: { status: keyof typeof STATUS_CONFIG }) => {
  const c = STATUS_CONFIG[status];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600,
      letterSpacing:'0.04em', padding:'3px 9px', borderRadius:20,
      background: c.bg, color: c.text, border:`1px solid ${c.dot}30` }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background: c.dot, flexShrink:0 }} />
      {c.label}
    </span>
  );
};

const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div style={{ background:'var(--card-bg)', border:'1px solid var(--border-subtle)',
    borderRadius:10, padding:'14px 18px' }}>
    <p style={{ fontSize:11, color:'var(--muted)', marginBottom:4, letterSpacing:'0.05em', textTransform:'uppercase' }}>{label}</p>
    <p style={{ fontSize:22, fontWeight:700, color:'var(--text)', lineHeight:1 }}>{value}</p>
    {sub && <p style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{sub}</p>}
  </div>
);

/* ─── Detail drawer ───────────────────────────────────────────────────────── */
const DetailDrawer = ({ order, onClose }: { order: PurchaseOrder; onClose: () => void }) => (
  <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex' }}>
    <div onClick={onClose} style={{ flex:1, background:'rgba(0,0,0,0.55)' }} />
    <div style={{ width:420, background:'var(--panel-bg)', borderLeft:'1px solid var(--border-subtle)',
      display:'flex', flexDirection:'column', fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(255,255,255,0.06)',
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <p style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>{order.orderNo}</p>
          <p style={{ fontSize:12, color:'var(--muted)', marginTop:1 }}>{order.supplier.name}</p>
        </div>
        <button onClick={onClose}
          style={{ width:28, height:28, borderRadius:7, border:'1px solid var(--border-subtle)',
            background:'var(--hover-overlay)', color:'var(--muted-2)', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
          <XCircle size={14} />
        </button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>
        {/* Status + dates */}
        <div style={{ background:'var(--card-bg)', borderRadius:10, padding:'14px 16px', marginBottom:16,
          border:'1px solid var(--border-subtle)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
            <span style={{ fontSize:12, color:'var(--muted)' }}>Status</span>
            <Badge status={order.status} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:12, color:'var(--muted)' }}>Order Date</span>
            <span style={{ fontSize:12, color:'var(--muted-2)' }}>{fmtDate(order.orderDate)}</span>
          </div>
          {order.deliveryDate && (
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:12, color:'var(--muted)' }}>Delivered</span>
              <span style={{ fontSize:12, color:'var(--status-delivered-text)' }}>{fmtDate(order.deliveryDate)}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <p style={{ fontSize:11, color:'var(--muted)', letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:8 }}>Line Items</p>
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
          {order.items.map((item) => (
            <div key={item.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              background:'var(--card-bg)', borderRadius:8, padding:'10px 14px',
              border:'1px solid var(--border-subtle)' }}>
              <div>
                <p style={{ fontSize:13, color:'var(--text)', fontWeight:500 }}>{item.product.name}</p>
                <p style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>Qty {item.quantity} × BDT {item.price.toLocaleString()}</p>
              </div>
              <p style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>BDT {item.total.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ display:'flex', justifyContent:'space-between', padding:'14px 16px',
          background:'var(--accent-100)', borderRadius:10, border:'1px solid var(--accent-200)' }}>
          <span style={{ fontSize:13, color:'var(--info)' }}>Total</span>
          <span style={{ fontSize:17, fontWeight:700, color:'var(--info)' }}>{fmt(order.total)}</span>
        </div>
      </div>
    </div>
  </div>
);

/* ─── Main Component ──────────────────────────────────────────────────────── */
const PurchaseOrders = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'orderDate', dir: 'desc' });
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    supplierId: 0, notes: '',
    items: [{ productId: 0, quantity: 1, price: 0 }],
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchOrders(), fetchSuppliers(), fetchProducts()]);
    setLoading(false);
  };

  const fetchOrders = async () => {
    try {
      const response = await purchaseOrderAPI.getAll({});
      setOrders(response.data.data);
    } catch { toast.error('Failed to fetch orders'); }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await supplierAPI.getAll();
      setSuppliers(response.data.data);
    } catch { toast.error('Failed to fetch suppliers'); }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(response.data.data);
    } catch { /* silent */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await purchaseOrderAPI.create(formData);
      toast.success('Purchase order created');
      setShowModal(false);
      setFormData({ supplierId: 0, notes: '', items: [{ productId: 0, quantity: 1, price: 0 }] });
      fetchOrders();
    } catch { toast.error('Failed to create order'); }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const deliveryDate = status === 'DELIVERED' ? new Date().toISOString() : undefined;
      await purchaseOrderAPI.updateStatus(id, { status, deliveryDate });
      toast.success('Status updated');
      setActiveMenu(null);
      fetchOrders();
    } catch { toast.error('Failed to update status'); }
  };

  const addItem = () => setFormData(f => ({ ...f, items: [...f.items, { productId: 0, quantity: 1, price: 0 }] }));
  const removeItem = (i: number) => setFormData(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i: number, field: string, value: unknown) =>
    setFormData(f => { const items = [...f.items]; items[i] = { ...items[i], [field]: value }; return { ...f, items }; });

  const cycleSort = (field: SortField) =>
    setSort(s => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'desc' });

  const filtered = useMemo(() => {
    let list = orders.filter(o =>
      (filterStatus === 'all' || o.status === filterStatus) &&
      (o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
       o.supplier.name.toLowerCase().includes(search.toLowerCase()))
    );
    list = [...list].sort((a, b) => {
      let va: string | number = sort.field === 'total' ? a.total : sort.field === 'orderDate' ? a.orderDate : a.orderNo;
      let vb: string | number = sort.field === 'total' ? b.total : sort.field === 'orderDate' ? b.orderDate : b.orderNo;
      return sort.dir === 'asc' ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
    });
    return list;
  }, [orders, filterStatus, search, sort]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    value: orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0),
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
  }), [orders]);

  /* ── input styles shared ── */
  const inp: React.CSSProperties = {
    background:'var(--card-bg)', border:'1px solid var(--border-subtle)', borderRadius:8,
    color:'var(--text)', fontSize:13, padding:'8px 12px', outline:'none', width:'100%',
    fontFamily:"'DM Sans', sans-serif",
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:240 }}>
      <div className="spinner w-12 h-12" />
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif", color:'var(--text)' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:'var(--text)', margin:0 }}>Purchase Orders</h1>
          <p style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>{orders.length} total orders</p>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ display:'flex', alignItems:'center', gap:6, background:'var(--accent)', color:'#fff',
            border:'none', borderRadius:9, padding:'9px 16px', fontSize:13, fontWeight:600,
            cursor:'pointer', letterSpacing:'-0.01em' }}>
          <Plus size={15} /> Create Order
        </button>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        <Stat label="Total Orders" value={String(stats.total)} />
        <Stat label="Pending" value={String(stats.pending)} sub="awaiting delivery" />
        <Stat label="Delivered" value={String(stats.delivered)} />
        <Stat label="Total Value" value={`BDT ${(stats.value/1000).toFixed(1)}k`} />
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        {/* Search */}
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search orders or suppliers…"
            style={{ ...inp, paddingLeft:30, width:'100%' }} />
        </div>

        {/* Status filters */}
        <div style={{ display:'flex', gap:4, background:'var(--card-bg)', padding:4, borderRadius:9,
          border:'1px solid var(--border-subtle)' }}>
          {['all','PENDING','DELIVERED','CANCELLED'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
                style={{ fontSize:12, fontWeight:500, padding:'5px 12px', borderRadius:6, border:'none',
                cursor:'pointer', transition:'all 0.12s',
                background: filterStatus === s ? 'var(--accent)' : 'transparent',
                color: filterStatus === s ? '#fff' : 'var(--muted-2)' }}>
              {s === 'all' ? 'All' : s.charAt(0)+s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Sort */}
        <button onClick={() => cycleSort('orderDate')}
          style={{ ...inp, width:'auto', display:'flex', alignItems:'center', gap:5,
        cursor:'pointer', color:'var(--muted-2)', whiteSpace:'nowrap' }}>
          <ArrowUpDown size={12} /> Date {sort.field==='orderDate' ? (sort.dir==='asc'?'↑':'↓') : ''}
        </button>
        <button onClick={() => cycleSort('total')}
          style={{ ...inp, width:'auto', display:'flex', alignItems:'center', gap:5,
            cursor:'pointer', color:'#9ca3af', whiteSpace:'nowrap' }}>
          <TrendingUp size={12} /> Value {sort.field==='total' ? (sort.dir==='asc'?'↑':'↓') : ''}
        </button>
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          background:'var(--card-bg)', border:'1px solid var(--border-subtle)', borderRadius:12,
          padding:'60px 0', gap:12 }}>
          <Package size={36} color="var(--muted)" />
          <p style={{ color:'var(--muted)', fontSize:14 }}>No orders match your filters</p>
          <button onClick={() => setShowModal(true)}
            style={{ background:'var(--accent)', color:'#fff', border:'none', borderRadius:8,
              padding:'8px 18px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Create Order
          </button>
        </div>
      ) : (
        <div style={{ background:'var(--card-bg)', border:'1px solid var(--border-subtle)', borderRadius:12, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                {['Order','Supplier','Date','Items','Total','Status',''].map((h, i) => (
                  <th key={i} style={{ padding:'11px 16px', textAlign: i>=4 ? 'right' : 'left',
                    fontSize:11, fontWeight:600, color:'var(--muted)',
                    letterSpacing:'0.05em', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, idx) => (
                <tr key={order.id}
                  style={{ borderBottom: idx < filtered.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    transition:'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--info)', fontFamily:'DM Mono, monospace' }}>
                      {order.orderNo}
                    </span>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:13, color:'var(--muted-2)' }}>{order.supplier.name}</td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'var(--muted-2)' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <CalendarDays size={11} /> {fmtDate(order.orderDate)}
                    </span>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'var(--muted-2)', textAlign:'right' }}>
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:13, fontWeight:600, color:'var(--text)', textAlign:'right', fontFamily:'DM Mono, monospace' }}>
                    {fmt(order.total)}
                  </td>
                  <td style={{ padding:'12px 16px', textAlign:'right' }}>
                    <Badge status={order.status} />
                  </td>
                  <td style={{ padding:'12px 16px', textAlign:'right' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4, position:'relative' }}>
                      <button onClick={() => setSelectedOrder(order)}
                        style={{ padding:'5px', borderRadius:6, border:'1px solid var(--border-subtle)',
                          background:'transparent', color:'var(--muted)', cursor:'pointer',
                          display:'flex', alignItems:'center' }}>
                        <Eye size={13} />
                      </button>
                      {order.status === 'PENDING' && (
                        <div style={{ position:'relative' }}>
                          <button onClick={() => setActiveMenu(activeMenu === order.id ? null : order.id)}
                            style={{ padding:'5px', borderRadius:6, border:'1px solid rgba(255,255,255,0.07)',
                              background:'transparent', color:'#6b7280', cursor:'pointer',
                              display:'flex', alignItems:'center' }}>
                            <MoreHorizontal size={13} />
                          </button>
                          {activeMenu === order.id && (
                            <div style={{ position:'absolute', right:0, top:'calc(100% + 4px)', zIndex:50,
                              background:'var(--card-bg)', border:'1px solid var(--border-subtle)',
                              borderRadius:9, padding:4, minWidth:160, boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
                              <button onClick={() => updateStatus(order.id, 'DELIVERED')}
                                style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
                                  background:'transparent', border:'none', color:'var(--status-delivered-text)', cursor:'pointer',
                                  fontSize:13, borderRadius:6, textAlign:'left' }}>
                                <Truck size={13} /> Mark Delivered
                              </button>
                              <button onClick={() => updateStatus(order.id, 'CANCELLED')}
                                style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
                                  background:'transparent', border:'none', color:'var(--status-cancelled-text)', cursor:'pointer',
                                  fontSize:13, borderRadius:6, textAlign:'left' }}>
                                <XCircle size={13} /> Cancel Order
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
          <div style={{ padding:'10px 16px', borderTop:'1px solid rgba(255,255,255,0.05)',
            fontSize:11, color:'#4b5563' }}>
            Showing {filtered.length} of {orders.length} orders
          </div>
        </div>
      )}

      {/* ── Detail Drawer ── */}
      {selectedOrder && <DetailDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />}

      {/* ── Create Modal ── */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex',
          alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)' }}>
          <div style={{ background:'#111318', border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:14, width:'100%', maxWidth:680, maxHeight:'90vh',
            display:'flex', flexDirection:'column', fontFamily:"'DM Sans', sans-serif" }}>

            {/* Modal header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'18px 22px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'rgba(31,111,235,0.15)',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Package size={15} color="#6ea8fe" />
                </div>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:'#f0f2f5', margin:0 }}>New Purchase Order</p>
                  <p style={{ fontSize:11, color:'#6b7280', margin:0, marginTop:1 }}>Fill in supplier and items</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)}
                style={{ width:28, height:28, borderRadius:7, border:'1px solid rgba(255,255,255,0.08)',
                  background:'rgba(255,255,255,0.04)', color:'#9ca3af', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                <XCircle size={14} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit}
              style={{ flex:1, overflowY:'auto', padding:'20px 22px', display:'flex', flexDirection:'column', gap:18 }}>

              <div>
                <label style={{ fontSize:11, color:'#6b7280', letterSpacing:'0.05em',
                  textTransform:'uppercase', display:'block', marginBottom:6 }}>Supplier *</label>
                <select required value={formData.supplierId}
                  onChange={e => setFormData({ ...formData, supplierId: Number(e.target.value) })}
                  style={{ ...inp }}>
                  <option value={0} disabled>Select supplier…</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <label style={{ fontSize:11, color:'#6b7280', letterSpacing:'0.05em', textTransform:'uppercase' }}>
                    Order Items *
                  </label>
                  <button type="button" onClick={addItem}
                    style={{ display:'flex', alignItems:'center', gap:4, fontSize:12,
                      color:'#6ea8fe', background:'transparent', border:'none', cursor:'pointer', fontWeight:500 }}>
                    <Plus size={12} /> Add Item
                  </button>
                </div>

                {/* Column headers */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 110px 28px',
                  gap:6, marginBottom:6, padding:'0 2px' }}>
                  {['Product','Qty','Unit Price',''].map((h, i) => (
                    <span key={i} style={{ fontSize:10, color:'#4b5563', letterSpacing:'0.05em', textTransform:'uppercase' }}>{h}</span>
                  ))}
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {formData.items.map((item, idx) => (
                    <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr 80px 110px 28px', gap:6, alignItems:'center' }}>
                      <select required value={item.productId}
                        onChange={e => updateItem(idx, 'productId', Number(e.target.value))}
                        style={{ ...inp }}>
                        <option value={0} disabled>Select…</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input type="number" required min="1" placeholder="1" value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                        style={{ ...inp, textAlign:'center' }} />
                      <input type="number" required min="0" step="0.01" placeholder="0.00" value={item.price}
                        onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                        style={{ ...inp }} />
                      {formData.items.length > 1 ? (
                        <button type="button" onClick={() => removeItem(idx)}
                          style={{ background:'transparent', border:'none', color:'#6b7280',
                            cursor:'pointer', padding:4, display:'flex', alignItems:'center',
                            borderRadius:5, width:28, justifyContent:'center' }}>
                          <XCircle size={14} />
                        </button>
                      ) : <span />}
                    </div>
                  ))}
                </div>

                {/* Live total */}
                {formData.items.some(i => i.price > 0 && i.quantity > 0) && (
                  <div style={{ marginTop:10, textAlign:'right', fontSize:12, color:'#9ca3af' }}>
                    Subtotal:{' '}
                    <span style={{ color:'#6ea8fe', fontWeight:600 }}>
                      BDT {formData.items.reduce((s, i) => s + i.quantity * i.price, 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize:11, color:'#6b7280', letterSpacing:'0.05em',
                  textTransform:'uppercase', display:'block', marginBottom:6 }}>Notes</label>
                <textarea value={formData.notes} rows={3}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes…"
                  style={{ ...inp, resize:'vertical', lineHeight:1.5 }} />
              </div>

              <div style={{ display:'flex', gap:8, paddingTop:4 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex:1, padding:'10px', borderRadius:9, border:'1px solid rgba(255,255,255,0.08)',
                    background:'transparent', color:'#9ca3af', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex:2, padding:'10px', borderRadius:9, border:'none',
                    background:'#1f6feb', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Click-away for dropdown */}
      {activeMenu !== null && (
        <div style={{ position:'fixed', inset:0, zIndex:40 }} onClick={() => setActiveMenu(null)} />
      )}
    </div>
  );
};

export default PurchaseOrders;