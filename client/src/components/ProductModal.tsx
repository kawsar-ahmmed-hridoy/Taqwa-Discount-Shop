import { useState, useEffect } from 'react';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';
import { X, Package, Tag, DollarSign, BarChart2, Loader } from 'lucide-react';

interface ProductModalProps { product: any; onClose: () => void; }
interface Category { id: number; name: string; }

const EMPTY = { name: '', sku: '', barcode: '', categoryId: 0, brand: '', purchasePrice: 0, sellingPrice: 0, discount: 0, stockQuantity: 0, minStockLevel: 10, expiryDate: '' };

const inp   = "w-full h-9 px-3 text-[13px] bg-white/[0.04] border border-white/[0.07] rounded-lg text-[#c8cdd8] placeholder:text-[#3a404f] outline-none focus:border-[#1f6feb]/60 transition-all";
const Lbl   = ({ children }: { children: React.ReactNode }) => <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#3a404f] mb-1.5">{children}</p>;
const Sec   = ({ icon: Icon, label }: { icon: typeof Tag; label: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon size={12} className="text-[#3a404f]" />
    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#3a404f]">{label}</p>
    <div className="flex-1 h-px bg-white/[0.05]" />
  </div>
);

const ProductModal = ({ product, onClose }: ProductModalProps) => {
  const [form, setForm]             = useState({ ...EMPTY });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [saving, setSaving]         = useState(false);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    productAPI.getCategories()
      .then(r => {
        const cats = r.data.data as Category[];
        setCategories(cats);
        if (product) {
          setForm({
            name: product.name, sku: product.sku, barcode: product.barcode ?? '',
            categoryId: product.category?.id ?? product.categoryId ?? cats[0]?.id ?? 0,
            brand: product.brand ?? '', purchasePrice: product.purchasePrice,
            sellingPrice: product.sellingPrice, discount: product.discount ?? 0,
            stockQuantity: product.stockQuantity, minStockLevel: product.minStockLevel,
            expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
          });
        } else {
          set('categoryId', cats[0]?.id ?? 0);
        }
      })
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoadingCats(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) return toast.error('Select a category');
    setSaving(true);
    try {
      const data = { ...form,
        purchasePrice: +form.purchasePrice, sellingPrice: +form.sellingPrice,
        discount: +form.discount, stockQuantity: +form.stockQuantity,
        minStockLevel: +form.minStockLevel, categoryId: +form.categoryId,
        barcode: form.barcode.trim() || null, brand: form.brand.trim() || null,
        expiryDate: form.expiryDate || null,
      };
      product ? await productAPI.update(product.id, data) : await productAPI.create(data);
      toast.success(product ? 'Product updated' : 'Product created');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const finalPrice = +form.sellingPrice * (1 - +form.discount / 100);
  const margin     = form.sellingPrice > 0 ? (((finalPrice - +form.purchasePrice) / finalPrice) * 100).toFixed(1) : null;
  const marginColor = margin === null ? '' : +margin >= 20 ? 'text-emerald-400' : +margin >= 10 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-full max-w-xl bg-[#13161c] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1f6feb]/15 flex items-center justify-center">
              <Package size={14} className="text-[#6ea8fe]" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#f0f2f5]">{product ? 'Edit Product' : 'New Product'}</p>
              <p className="text-[11px] text-[#3a404f]">{product ? `SKU: ${product.sku}` : 'Fill in the product details'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-[#3a404f] hover:text-[#c8cdd8] transition-all">
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── Basic info ── */}
          <div>
            <Sec icon={Tag} label="Basic Information" />
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Lbl>Product Name *</Lbl>
                <input required type="text" placeholder="e.g. Paracetamol 500mg" value={form.name}
                  onChange={e => set('name', e.target.value)} className={inp} />
              </div>
              <div>
                <Lbl>SKU *</Lbl>
                <input required type="text" placeholder="PROD-001" value={form.sku}
                  onChange={e => set('sku', e.target.value.toUpperCase())} className={inp} />
              </div>
              <div>
                <Lbl>Barcode</Lbl>
                <input type="text" placeholder="Scan or enter" value={form.barcode}
                  onChange={e => set('barcode', e.target.value)} className={inp} />
              </div>
              <div>
                <Lbl>Category *</Lbl>
                {loadingCats ? (
                  <div className={`${inp} flex items-center gap-2 text-[#3a404f]`}>
                    <Loader size={13} className="animate-spin" /> Loading…
                  </div>
                ) : (
                  <select required value={form.categoryId} onChange={e => set('categoryId', +e.target.value)} className={`${inp} appearance-none`}>
                    <option value={0} disabled>Select…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
              <div>
                <Lbl>Brand</Lbl>
                <input type="text" placeholder="Optional" value={form.brand}
                  onChange={e => set('brand', e.target.value)} className={inp} />
              </div>
            </div>
          </div>

          {/* ── Pricing ── */}
          <div>
            <Sec icon={DollarSign} label="Pricing" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Lbl>Purchase Price (৳) *</Lbl>
                <input required type="number" step="0.01" min="0" placeholder="0.00" value={form.purchasePrice}
                  onChange={e => set('purchasePrice', e.target.value)} className={inp} />
              </div>
              <div>
                <Lbl>Selling Price (৳) *</Lbl>
                <input required type="number" step="0.01" min="0" placeholder="0.00" value={form.sellingPrice}
                  onChange={e => set('sellingPrice', e.target.value)} className={inp} />
              </div>
              <div>
                <Lbl>Discount (%)</Lbl>
                <input type="number" step="0.1" min="0" max="100" placeholder="0" value={form.discount}
                  onChange={e => set('discount', e.target.value)} className={inp} />
              </div>

              {/* Price preview */}
              <div>
                <Lbl>Effective Price</Lbl>
                <div className={`${inp} flex items-center justify-between`}>
                  <span className="font-semibold text-emerald-400">৳{finalPrice.toFixed(2)}</span>
                  {+form.discount > 0 && (
                    <span className="text-[11.5px] text-[#3a404f] line-through">৳{(+form.sellingPrice).toFixed(2)}</span>
                  )}
                </div>
                {margin !== null && (
                  <p className={`text-[11px] mt-1 font-medium ${marginColor}`}>Margin: {margin}%</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Stock ── */}
          <div>
            <Sec icon={BarChart2} label="Stock Management" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Lbl>Stock Quantity *</Lbl>
                <input required type="number" min="0" placeholder="0" value={form.stockQuantity}
                  onChange={e => set('stockQuantity', e.target.value)} className={inp} />
              </div>
              <div>
                <Lbl>Min Stock Level *</Lbl>
                <input required type="number" min="0" placeholder="10" value={form.minStockLevel}
                  onChange={e => set('minStockLevel', e.target.value)} className={inp} />
                <p className="text-[10.5px] text-[#3a404f] mt-1">Alert below this level</p>
              </div>
              <div className="col-span-2">
                <Lbl>Expiry Date</Lbl>
                <input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} className={inp} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2.5 pt-1 sticky bottom-0 bg-[#13161c] pb-1">
            <button type="button" onClick={onClose} className="flex-1 h-9 text-[13px] font-medium text-[#6b7280] border border-white/[0.07] rounded-lg hover:bg-white/[0.04] transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving || loadingCats} className="flex-[2] h-9 text-[13px] font-medium text-white bg-[#1f6feb] rounded-lg hover:bg-[#1a5fd4] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {saving ? <><Loader size={13} className="animate-spin" /> Saving…</> : product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;