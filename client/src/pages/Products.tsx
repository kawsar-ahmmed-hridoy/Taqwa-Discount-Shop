import { useState, useEffect } from 'react';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Plus, Search, Edit, Trash2, Camera, X, Package,
  ArrowUpDown, TrendingUp, TrendingDown, RefreshCw,
  Copy, CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react';
import ProductModal from '../components/ProductModal';
import BarcodeScanner from '../components/BarcodeScanner';

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  category: { name: string; id: number };
  brand?: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  isActive: boolean;
  discount?: number;
}

interface Category { id: number; name: string; }
type SortField = 'name' | 'sellingPrice' | 'stockQuantity';

const stockInfo = (p: Product) => {
  if (p.stockQuantity === 0)
    return { label: 'Out of stock', icon: XCircle, pill: 'bg-red-500/10 text-red-400 ring-red-500/20' };
  if (p.stockQuantity <= p.minStockLevel)
    return { label: 'Low stock', icon: AlertTriangle, pill: 'bg-amber-400/10 text-amber-400 ring-amber-400/20' };
  return { label: 'In stock', icon: CheckCircle2, pill: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20' };
};

const getMargin = (p: Product) =>
  p.purchasePrice > 0 ? (((p.sellingPrice - p.purchasePrice) / p.purchasePrice) * 100).toFixed(1) : null;

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sort, setSort] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [modal, setModal] = useState<Product | null | false>(false);
  const [scanner, setScanner] = useState(false);
  const [copiedSku, setCopiedSku] = useState<number | null>(null);

  useEffect(() => { load(); fetchCats(); }, []);

  const load = async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try { const r = await productAPI.getAll(); setProducts(r.data.data); }
    catch { toast.error('Failed to fetch products'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const fetchCats = async () => {
    try { const r = await productAPI.getCategories(); setCategories(r.data.data); } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    try { await productAPI.delete(id); toast.success('Product deleted'); load(true); }
    catch { toast.error('Failed to delete'); }
  };

  const copySku = (id: number, sku: string) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(id);
    setTimeout(() => setCopiedSku(null), 1500);
  };

  const toggleSort = (f: SortField) => {
    if (sort === f) setSortAsc(a => !a); else { setSort(f); setSortAsc(true); }
  };

  const filtered = products
    .filter(p => {
      const q = search.toLowerCase();
      return (!q || [p.name, p.sku, p.barcode ?? '', p.brand ?? ''].some(v => v.toLowerCase().includes(q)))
        && (cat === 'all' || p.category.id.toString() === cat)
        && (stockFilter === 'all'
          || (stockFilter === 'in' && p.stockQuantity > p.minStockLevel)
          || (stockFilter === 'low' && p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel)
          || (stockFilter === 'out' && p.stockQuantity === 0));
    })
    .sort((a, b) => {
      const [av, bv] = sort === 'name'
        ? [a.name.toLowerCase(), b.name.toLowerCase()]
        : [a[sort], b[sort]];
      return sortAsc ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
    });

  const counts = {
    all: products.length,
    in: products.filter(p => p.stockQuantity > p.minStockLevel).length,
    low: products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel).length,
    out: products.filter(p => p.stockQuantity === 0).length,
  };

  const statTabs = [
    { key: 'all',  label: 'All',          count: counts.all,  activeColor: 'text-[#6ea8fe]',   activeBorder: 'border-[#1f6feb]' },
    { key: 'in',   label: 'In stock',     count: counts.in,   activeColor: 'text-emerald-400', activeBorder: 'border-emerald-400' },
    { key: 'low',  label: 'Low stock',    count: counts.low,  activeColor: 'text-amber-400',   activeBorder: 'border-amber-400' },
    { key: 'out',  label: 'Out of stock', count: counts.out,  activeColor: 'text-red-400',     activeBorder: 'border-red-400' },
  ];

  const SortTh = ({ field, label, right }: { field: SortField; label: string; right?: boolean }) => (
    <th className={`px-4 py-3 text-[10.5px] font-semibold uppercase tracking-widest text-[#3a404f] ${right ? 'text-right' : 'text-left'}`}>
      <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-[#6ea8fe] transition-colors">
        {right && <ArrowUpDown size={10} className={sort === field ? 'text-[#6ea8fe]' : 'text-[#3a404f]'} />}
        {label}
        {!right && <ArrowUpDown size={10} className={sort === field ? 'text-[#6ea8fe]' : 'text-[#3a404f]'} />}
      </button>
    </th>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64 bg-[#111318]">
      <div className="w-7 h-7 rounded-full border-2 border-white/10 border-t-[#1f6feb] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#111318] p-5 space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-[#f0f2f5] tracking-tight">Products</h1>
          <p className="text-[11.5px] text-[#3a404f] mt-0.5">
            {filtered.length !== products.length ? `${filtered.length} of ${products.length}` : products.length} products
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(true)} title="Refresh"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.055] bg-white/[0.03] hover:bg-white/[0.07] text-[#3a404f] hover:text-[#c8cdd8] transition-all">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setScanner(true)}
            className="flex items-center gap-1.5 px-3 h-8 text-[12.5px] font-medium text-[#c8cdd8] border border-white/[0.08] bg-white/[0.04] rounded-lg hover:bg-white/[0.08] transition-all">
            <Camera size={13} /> Scan
          </button>
          <button onClick={() => setModal(null)}
            className="flex items-center gap-1.5 px-3 h-8 text-[12.5px] font-medium text-white bg-[#1f6feb] rounded-lg hover:bg-[#1a5fd4] transition-all">
            <Plus size={13} /> Add product
          </button>
        </div>
      </div>

      {/* Stat tabs */}
      <div className="flex items-center gap-0 border-b border-white/[0.055]">
        {statTabs.map(s => (
          <button key={s.key} onClick={() => setStockFilter(s.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 -mb-px transition-all
              ${stockFilter === s.key
                ? `${s.activeColor} ${s.activeBorder}`
                : 'text-[#3a404f] border-transparent hover:text-[#6b7280]'}`}>
            <span className={`text-[13px] font-bold tabular-nums ${stockFilter === s.key ? s.activeColor : 'text-[#3a404f]'}`}>
              {s.count}
            </span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Search + category */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a404f] pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, SKU, barcode…"
            className="w-full h-9 pl-8 pr-8 text-[13px] bg-white/[0.04] border border-white/[0.07] rounded-lg text-[#c8cdd8] placeholder-[#3a404f] outline-none focus:border-[#1f6feb]/60 focus:bg-white/[0.06] transition-all" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#3a404f] hover:text-[#6b7280]">
              <X size={13} />
            </button>
          )}
        </div>
        <select value={cat} onChange={e => setCat(e.target.value)}
          className="h-9 px-3 text-[13px] bg-white/[0.04] border border-white/[0.07] rounded-lg text-[#c8cdd8] outline-none focus:border-[#1f6feb]/60 cursor-pointer transition-all">
          <option value="all" className="bg-[#1a1d24]">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id} className="bg-[#1a1d24]">{c.name}</option>)}
        </select>
        {(search || cat !== 'all' || stockFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setCat('all'); setStockFilter('all'); }}
            className="flex items-center gap-1 px-3 h-9 text-[12px] text-[#6ea8fe] border border-[#1f6feb]/30 rounded-lg hover:bg-[#1f6feb]/10 transition-all">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="border border-white/[0.055] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="border-b border-white/[0.055] bg-white/[0.025]">
              <tr>
                <SortTh field="name" label="Product" />
                <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-widest text-[#3a404f]">SKU</th>
                <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-widest text-[#3a404f]">Category</th>
                <SortTh field="sellingPrice" label="Pricing" right />
                <SortTh field="stockQuantity" label="Stock" right />
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const si = stockInfo(p);
                const m = getMargin(p);
                const finalPrice = p.sellingPrice * (1 - (p.discount ?? 0) / 100);
                const StockIcon = si.icon;
                return (
                  <tr key={p.id}
                    className={`hover:bg-white/[0.025] transition-colors group ${i < filtered.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#e2e5eb]">{p.name}</div>
                      {p.brand && <div className="text-[11.5px] text-[#3a404f] mt-0.5">{p.brand}</div>}
                      {!!p.discount && (
                        <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400">
                          {p.discount}% off
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[12px] text-[#6b7280]">{p.sku}</span>
                        <button onClick={() => copySku(p.id, p.sku)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#3a404f] hover:text-[#6ea8fe] hover:bg-[#1f6feb]/10 transition-all">
                          {copiedSku === p.id
                            ? <CheckCircle2 size={11} className="text-emerald-400" />
                            : <Copy size={11} />}
                        </button>
                      </div>
                      {p.barcode && <div className="font-mono text-[11px] text-[#3a404f] mt-0.5">{p.barcode}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11.5px] font-medium px-2 py-0.5 rounded-md bg-white/[0.05] text-[#6b7280] border border-white/[0.07]">
                        {p.category.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-semibold text-[#e2e5eb]">৳{finalPrice.toFixed(2)}</div>
                      <div className="text-[11.5px] text-[#3a404f] mt-0.5">cost ৳{p.purchasePrice.toFixed(2)}</div>
                      {m && (
                        <span className={`inline-flex items-center gap-0.5 mt-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded
                          ${+m > 0 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
                          {+m > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}{m}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-semibold text-[#e2e5eb]">{p.stockQuantity}</div>
                      <span className={`inline-flex items-center gap-1 mt-1 text-[10.5px] font-medium px-1.5 py-0.5 rounded-full ring-1 ring-inset ${si.pill}`}>
                        <StockIcon size={9} />{si.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModal(p)}
                          className="p-1.5 rounded-md text-[#3a404f] hover:text-[#6ea8fe] hover:bg-[#1f6feb]/10 transition-all" title="Edit">
                          <Edit size={13} />
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-md text-[#3a404f] hover:text-red-400 hover:bg-red-400/10 transition-all" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-2">
            <Package size={30} className="text-white/10" />
            <p className="text-[13px] font-medium text-[#3a404f]">No products found</p>
            <p className="text-[11.5px] text-[#3a404f]/60">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {modal !== false && <ProductModal product={modal} onClose={() => { setModal(false); load(true); }} />}
      {scanner && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg w-full">
            <BarcodeScanner
              onScan={b => { setSearch(b); setScanner(false); toast.success('Barcode scanned'); }}
              onClose={() => setScanner(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}