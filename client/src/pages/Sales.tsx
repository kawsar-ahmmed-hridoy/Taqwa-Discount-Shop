import { useState, useEffect, useRef } from 'react';
import { saleAPI, productAPI, customerAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Search, Trash2, ShoppingCart, User, CreditCard,
  Banknote, Smartphone, Plus, Minus, Receipt, ScanLine,
} from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';

interface CartItem {
  productId: number;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  quantity: number;
  total: number;
}

const fmt = (n: number) => n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Sales = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [discount, setDiscount] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCustomers();
    setTimeout(() => searchRef.current?.focus(), 100);
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await customerAPI.getAll();
      setCustomers(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleProductSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await productAPI.search(searchQuery);
      if (res.data.data.length > 0) {
        addToCart(res.data.data[0]);
        setSearchQuery('');
      } else {
        toast.error('Product not found');
      }
    } catch (e) {
      toast.error('Search failed');
    }
  };

  const addToCart = (product: any) => {
    const finalPrice = product.discount
      ? product.sellingPrice * (1 - product.discount / 100)
      : product.sellingPrice;
    const existing = cart.find((i) => i.productId === product.id);
    if (existing) {
      setCart(cart.map((i) =>
        i.productId === product.id
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price }
          : i
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: finalPrice,
        originalPrice: product.sellingPrice,
        discount: product.discount || 0,
        quantity: 1,
        total: finalPrice,
      }]);
    }
  };

  const removeFromCart = (id: number) => setCart(cart.filter((i) => i.productId !== id));

  const updateQuantity = (id: number, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return; }
    setCart(cart.map((i) => i.productId === id ? { ...i, quantity: qty, total: qty * i.price } : i));
  };

  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const discountAmount = (subtotal * discount) / 100;
  const afterDiscount = subtotal - discountAmount;
  const vat = afterDiscount * 0.05;
  const total = afterDiscount + vat;

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    setCheckoutLoading(true);
    try {
      await saleAPI.create({
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.price,
          discount: i.discount,
        })),
        customerId: selectedCustomer,
        paymentMode,
        additionalDiscount: discount,
        subtotal, vat, total,
      });
      toast.success('Sale completed!');
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setTimeout(() => searchRef.current?.focus(), 100);
    } catch (e) {
      toast.error('Sale failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleScan = (barcode: string) => {
    setSearchQuery(barcode);
    handleProductSearch();
    setShowScanner(false);
    searchRef.current?.focus();
  };

  const paymentModes = [
    { id: 'CASH', label: 'Cash', icon: Banknote },
    { id: 'CARD', label: 'Card', icon: CreditCard },
    { id: 'UPI', label: 'UPI', icon: Smartphone },
  ] as const;

  return (
    <div
      className="flex flex-col h-full"
      style={{ fontFamily: "'DM Sans', sans-serif", background: 'var(--panel-bg)' }}
    >
      {/* Page header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.055] flex-shrink-0">
        <span className="text-[13px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
          Point of Sale
        </span>
        <button
          onClick={() => setShowScanner(true)}
          className="flex items-center gap-1.5 h-[30px] px-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.13] rounded-[7px] text-[#4a5060] hover:text-[#8892a4] text-[11.5px] font-medium transition-all duration-[120ms]"
        >
          <ScanLine size={12} strokeWidth={1.8} />
          Scan Barcode
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden" style={{ gridTemplateColumns: '1fr 260px' }}>

        {/* LEFT: Search + Cart */}
        <div className="flex-1 flex flex-col border-r border-white/[0.055] overflow-hidden min-w-0">

          {/* Search bar */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-white/[0.055] flex-shrink-0">
            <div className="relative flex-1">
              <Search
                size={13}
                strokeWidth={1.7}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--muted)' }}
              />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search by name, SKU or barcode — press Enter to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleProductSearch()}
                className="w-full h-8 bg-white/[0.04] hover:bg-white/[0.055] border border-white/[0.08] rounded-[7px] text-[12px] placeholder:text-[#333844] pl-8 pr-3 outline-none transition-all duration-[120ms]"
                style={{ color: 'var(--text)' }}
                autoFocus
              />
            </div>
            <button
              onClick={handleProductSearch}
              className="h-8 px-4 hover:opacity-90 rounded-[7px] text-white text-[11.5px] font-semibold transition-opacity duration-[120ms] flex-shrink-0"
              style={{ background: 'var(--accent)' }}
            >
              Add
            </button>
          </div>

          {/* Cart header */}
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/[0.04] flex-shrink-0">
            <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--muted)' }}>
              <ShoppingCart size={11} strokeWidth={1.8} />
              Cart
              {cart.length > 0 && (
                <span
                  className="bg-[#1f6feb]/15 text-[#6ea8fe] text-[10px] font-bold px-1.5 py-px rounded"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {cart.length}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[11px] font-medium hover:text-[var(--status-cancelled-text)] transition-colors duration-[120ms] bg-none border-none cursor-pointer"
                style={{ color: 'var(--muted)' }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Cart items */}
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
              <ShoppingCart size={28} strokeWidth={1.3} style={{ color: 'var(--muted)' }} />
              <p className="text-[12px] font-medium" style={{ color: 'var(--muted)' }}>Cart is empty</p>
              <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>Search for a product to add it</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-white/[0.035] last:border-0 hover:bg-white/[0.02] transition-colors duration-[100ms]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate" style={{ color: 'var(--muted-2)' }}>{item.name}</p>
                    <p className="text-[11px] mt-px" style={{ fontFamily: "'DM Mono', monospace", color: 'var(--muted)' }}>
                      ৳ {fmt(item.price)}
                      {item.discount > 0 && (
                        <span className="ml-1.5 text-[9.5px] font-semibold bg-amber-500/10 text-amber-600 px-1 py-px rounded" style={{ fontFamily: "'DM Mono', monospace" }}>
                          {item.discount}% off
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-[22px] h-[22px] rounded-[5px] bg-white/[0.05] border border-white/[0.07] hover:bg-white/[0.09] flex items-center justify-center transition-all duration-[120ms]"
                      style={{ color: 'var(--muted-2)' }}
                    >
                      <Minus size={9} strokeWidth={2} />
                    </button>
                    <span
                      className="w-6 text-center text-[12px] font-semibold"
                      style={{ fontFamily: "'DM Mono', monospace", color: 'var(--text)' }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-[22px] h-[22px] rounded-[5px] bg-white/[0.05] border border-white/[0.07] hover:bg-white/[0.09] flex items-center justify-center transition-all duration-[120ms]"
                      style={{ color: 'var(--muted-2)' }}
                    >
                      <Plus size={9} strokeWidth={2} />
                    </button>
                  </div>

                  <span
                    className="text-[12.5px] font-semibold min-w-[72px] text-right"
                    style={{ fontFamily: "'DM Mono', monospace", color: 'var(--text)' }}
                  >
                    ৳ {fmt(item.total)}
                  </span>

                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="w-[22px] h-[22px] rounded-[5px] flex items-center justify-center hover:bg-red-500/[0.08] hover:text-[var(--status-cancelled-text)] transition-all duration-[120ms]"
                    style={{ color: 'var(--muted)' }}
                  >
                    <Trash2 size={12} strokeWidth={1.7} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Order summary */}
        <div className="w-[260px] flex-shrink-0 flex flex-col overflow-y-auto">

          {/* Customer */}
          <div className="px-3.5 py-3 border-b border-white/[0.055]">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#333844] mb-2">
              <User size={11} strokeWidth={1.8} />
              Customer
            </div>
            <select
              value={selectedCustomer ?? ''}
              onChange={(e) => setSelectedCustomer(Number(e.target.value) || null)}
              className="w-full h-8 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.12] focus:border-[#1f6feb]/50 rounded-[7px] text-[#8892a4] text-[12px] px-2.5 outline-none appearance-none cursor-pointer transition-all duration-[120ms]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <option value="">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
              ))}
            </select>
          </div>

          {/* Payment mode */}
            <div className="px-3.5 py-3 border-b border-white/[0.055]">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] mb-2" style={{ color: 'var(--muted)' }}>
              <Receipt size={11} strokeWidth={1.8} />
              Payment
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {paymentModes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setPaymentMode(id)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-[7px] border transition-all duration-[120ms] ${
                    paymentMode === id
                      ? 'border-[var(--accent)]/45 bg-[var(--accent)]/[0.08]'
                          : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                      <Icon
                        size={14}
                        strokeWidth={1.7}
                        style={{ color: paymentMode === id ? 'var(--info)' : 'var(--muted)' }}
                      />
                      <span className={`text-[10.5px] font-semibold`} style={{ color: paymentMode === id ? 'var(--info)' : 'var(--muted-2)' }}>
                        {label}
                      </span>
                </button>
              ))}
            </div>
          </div>

          {/* Additional discount */}
            <div className="px-3.5 py-3 border-b border-white/[0.055]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] mb-2" style={{ color: 'var(--muted)' }}>
              Additional Discount
            </div>
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              placeholder="0 %"
              className="w-full h-8 bg-white/[0.04] border border-white/[0.08] focus:border-[var(--accent)]/50 rounded-[7px] text-[12px] px-2.5 outline-none transition-all duration-[120ms]"
              style={{ fontFamily: "'DM Mono', monospace" }}
            />
          </div>

          {/* Totals */}
          <div className="px-3.5 py-3 border-b border-white/[0.055] space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px]" style={{ color: 'var(--muted)' }}>Subtotal</span>
              <span className="text-[11.5px] font-medium" style={{ fontFamily: "'DM Mono', monospace", color: 'var(--muted-2)' }}>
                ৳ {fmt(subtotal)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[11px]" style={{ color: 'var(--status-cancelled-text)' }}>Discount ({discount}%)</span>
                  <span className="text-[11.5px] font-medium" style={{ fontFamily: "'DM Mono', monospace", color: 'var(--status-cancelled-text)' }}>
                    − ৳ {fmt(discountAmount)}
                  </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[11px]" style={{ color: 'var(--muted)' }}>VAT (5%)</span>
              <span className="text-[11.5px] font-medium" style={{ fontFamily: "'DM Mono', monospace", color: 'var(--muted-2)' }}>
                ৳ {fmt(vat)}
              </span>
            </div>
            <div className="h-px bg-white/[0.05] my-1" />
            <div className="flex justify-between items-center">
              <span className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>Total</span>
              <span className="text-[14px] font-bold" style={{ fontFamily: "'DM Mono', monospace", color: 'var(--info)' }}>
                ৳ {fmt(total)}
              </span>
            </div>
          </div>

          {/* Checkout */}
          <div className="px-3.5 py-3 mt-auto">
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkoutLoading}
              className={`w-full h-9 rounded-[8px] text-[12.5px] font-semibold flex items-center justify-center gap-2 transition-all duration-[120ms] ${
                cart.length === 0
                  ? 'bg-white/[0.05] text-[#333844] cursor-not-allowed'
                  : 'bg-[#1f6feb] hover:opacity-90 text-white cursor-pointer'
              }`}
            >
              {checkoutLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingCart size={13} strokeWidth={1.8} />
                  Complete Sale — ৳ {fmt(total)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Barcode scanner modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-[12px] w-full max-w-lg overflow-hidden shadow-2xl" style={{ background: 'var(--panel-bg)', border: '1px solid var(--border-subtle)' }}>
            <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;