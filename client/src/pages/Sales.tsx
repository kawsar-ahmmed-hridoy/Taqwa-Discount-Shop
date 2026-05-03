import { useState, useEffect, useRef } from 'react';
import { saleAPI, productAPI, customerAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Search, Trash2, ShoppingCart, User, CreditCard,
  Banknote, Smartphone, Plus, Minus, Receipt, ScanLine, RotateCcw,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import BarcodeScanner from '../components/BarcodeScanner';
import SalesHistoryModal from '../components/SalesHistoryModal';

interface CartItem {
  productId: number;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  quantity: number;
  total: number;
}

interface ReceiptSaleItem {
  product: {
    name: string;
    barcode?: string | null;
  };
  quantity: number;
  price: number;
  total: number;
}

interface ReceiptSale {
  id: number;
  invoiceNo: string;
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paymentMode: 'CASH' | 'CARD' | 'UPI';
  createdAt: string;
  customer?: {
    name: string;
    phone: string;
  } | null;
  user?: {
    fullName: string;
    email: string;
  } | null;
  items: ReceiptSaleItem[];
}

const fmt = (n: number) => n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDateTime = (value: string | Date) => new Date(value).toLocaleString('en-BD', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const escapeHtml = (value: string) => value
  .split('&').join('&amp;')
  .split('<').join('&lt;')
  .split('>').join('&gt;')
  .split('"').join('&quot;')
  .split("'").join('&#39;');

const SHOP_INFO = {
  name: 'Taqwa Discount Shop',
  tagline: 'Quality essentials for your everyday needs',
  address: 'Sylhet, Bangladesh',
  phone: '+880 1714440146',
  email: 'support@taqwadiscountshop.com',
};

const PAYMENT_LABELS: Record<'CASH' | 'CARD' | 'UPI', string> = {
  CASH: 'Cash',
  CARD: 'Card',
  UPI: 'UPI',
};

const Sales = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [discount, setDiscount] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [completedSale, setCompletedSale] = useState<ReceiptSale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
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

  const buildReceiptHtml = (sale: ReceiptSale) => {
    const customerLine = sale.customer
      ? `${escapeHtml(sale.customer.name)} (${escapeHtml(sale.customer.phone)})`
      : 'Walk-in Customer';

    const itemsHtml = sale.items.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>
          <div class="name">${escapeHtml(item.product.name)}</div>
          <div class="meta">Barcode: ${escapeHtml(item.product.barcode || 'N/A')}</div>
        </td>
        <td class="right">${item.quantity}</td>
        <td class="right">৳ ${fmt(item.price)}</td>
        <td class="right">৳ ${fmt(item.total)}</td>
      </tr>
    `).join('');

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Receipt ${escapeHtml(sale.invoiceNo)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #111827; }
    .receipt { max-width: 780px; margin: 0 auto; border: 1px solid #d1d5db; padding: 24px; border-radius: 14px; }
    .header { text-align: center; margin-bottom: 18px; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 4px 0; color: #4b5563; }
    .meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; margin: 18px 0; font-size: 13px; }
    .meta-grid div { line-height: 1.45; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; font-size: 13px; vertical-align: top; }
    th { text-align: left; background: #f9fafb; }
    .right { text-align: right; white-space: nowrap; }
    .summary { margin-top: 16px; margin-left: auto; width: 280px; }
    .summary-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
    .summary-row.total { border-top: 2px solid #111827; margin-top: 8px; padding-top: 10px; font-weight: 700; font-size: 15px; }
    .footer { margin-top: 18px; text-align: center; font-size: 12px; color: #4b5563; }
    .name { font-weight: 600; }
    .meta { color: #6b7280; font-size: 12px; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${escapeHtml(SHOP_INFO.name)}</h1>
      <p>${escapeHtml(SHOP_INFO.tagline)}</p>
      <p>${escapeHtml(SHOP_INFO.address)} | ${escapeHtml(SHOP_INFO.phone)} | ${escapeHtml(SHOP_INFO.email)}</p>
    </div>

    <div class="meta-grid">
      <div><strong>Invoice:</strong> ${escapeHtml(sale.invoiceNo)}</div>
      <div><strong>Date:</strong> ${escapeHtml(fmtDateTime(sale.createdAt))}</div>
      <div><strong>Customer:</strong> ${customerLine}</div>
      <div><strong>Cashier:</strong> ${escapeHtml(sale.user?.fullName || 'N/A')}</div>
      <div><strong>Payment:</strong> ${escapeHtml(PAYMENT_LABELS[sale.paymentMode])}</div>
      <div><strong>Sale ID:</strong> ${sale.id}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 40px">#</th>
          <th>Item</th>
          <th class="right" style="width: 70px">Qty</th>
          <th class="right" style="width: 110px">Unit</th>
          <th class="right" style="width: 110px">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-row"><span>Subtotal</span><span>৳ ${fmt(sale.subtotal)}</span></div>
      <div class="summary-row"><span>Discount</span><span>৳ ${fmt(sale.discount)}</span></div>
      <div class="summary-row"><span>VAT</span><span>৳ ${fmt(sale.vat)}</span></div>
      <div class="summary-row total"><span>Total</span><span>৳ ${fmt(sale.total)}</span></div>
    </div>

    <div class="footer">Thank you for shopping with ${escapeHtml(SHOP_INFO.name)}</div>
  </div>
</body>
</html>`;
  };

  const printReceipt = (sale: ReceiptSale) => {
    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) {
      toast.error('Unable to open print window');
      return;
    }

    popup.document.open();
    popup.document.write(`${buildReceiptHtml(sale)}<script>window.onload=function(){window.focus();window.print();};window.onafterprint=function(){window.close();};</script>`);
    popup.document.close();
    popup.focus();
  };

  const downloadReceipt = (sale: ReceiptSale) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const left = 14;
    const right = pageWidth - 14;
    const lineHeight = 6;
    let y = 14;

    const ensureSpace = (needed: number) => {
      if (y + needed <= pageHeight - 14) return;
      doc.addPage();
      y = 14;
    };

    const writeLine = (label: string, value: string, valueX = right, isBold = false) => {
      ensureSpace(lineHeight);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.text(label, left, y);
      doc.text(value, valueX, y, { align: 'right' });
      y += lineHeight;
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(SHOP_INFO.name, pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(SHOP_INFO.tagline, pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text(`${SHOP_INFO.address} | ${SHOP_INFO.phone} | ${SHOP_INFO.email}`, pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setDrawColor(209, 213, 219);
    doc.line(left, y - 2, right, y - 2);

    writeLine('Invoice', sale.invoiceNo, right - 54, true);
    writeLine('Date', fmtDateTime(sale.createdAt));
    writeLine('Customer', sale.customer ? `${sale.customer.name} (${sale.customer.phone})` : 'Walk-in Customer');
    writeLine('Cashier', sale.user?.fullName || 'N/A');
    writeLine('Payment', PAYMENT_LABELS[sale.paymentMode]);
    writeLine('Sale ID', `#${sale.id}`);

    y += 2;
    doc.line(left, y, right, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('#', left, y);
    doc.text('Item', left + 10, y);
    doc.text('Qty', right - 64, y, { align: 'right' });
    doc.text('Unit', right - 34, y, { align: 'right' });
    doc.text('Total', right, y, { align: 'right' });
    y += 4;
    doc.line(left, y, right, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    sale.items.forEach((item, index) => {
      const nameLines = doc.splitTextToSize(item.product.name, 84);
      const barcodeLines = doc.splitTextToSize(`Barcode: ${item.product.barcode || 'N/A'}`, 84);
      const rowHeight = Math.max(10, (nameLines.length + barcodeLines.length) * 4 + 2);
      ensureSpace(rowHeight + 10);

      doc.text(String(index + 1), left, y);
      doc.text(nameLines, left + 10, y);
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(barcodeLines, left + 10, y + (nameLines.length * 4));
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(10);
      doc.text(String(item.quantity), right - 64, y, { align: 'right' });
      doc.text(`BDT ${fmt(item.price)}`, right - 34, y, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(`BDT ${fmt(item.total)}`, right, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += rowHeight;
      doc.setDrawColor(229, 231, 235);
      doc.line(left, y - 2, right, y - 2);
      y += 2;
    });

    y += 4;
    ensureSpace(32);
    writeLine('Subtotal', `BDT ${fmt(sale.subtotal)}`);
    writeLine('Discount', `BDT ${fmt(sale.discount)}`);
    writeLine('VAT', `BDT ${fmt(sale.vat)}`);
    doc.setFont('helvetica', 'bold');
    writeLine('Total', `BDT ${fmt(sale.total)}`);

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Thank you for shopping with ${SHOP_INFO.name}`, pageWidth / 2, y, { align: 'center' });

    doc.save(`${sale.invoiceNo}.pdf`);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    setCheckoutLoading(true);
    try {
      const res = await saleAPI.create({
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        customerId: selectedCustomer,
        paymentMode,
        discount,
      });
      setCompletedSale(res.data.data);
      toast.success('Sale completed!');
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setShowReceipt(true);
      setTimeout(() => searchRef.current?.focus(), 100);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Sale failed');
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSalesHistory(true)}
            className="flex items-center gap-1.5 h-[30px] px-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.13] rounded-[7px] text-[#4a5060] hover:text-[#8892a4] text-[11.5px] font-medium transition-all duration-[120ms]"
          >
            <RotateCcw size={12} strokeWidth={1.8} />
            Sales & Refunds
          </button>
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-1.5 h-[30px] px-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.13] rounded-[7px] text-[#4a5060] hover:text-[#8892a4] text-[11.5px] font-medium transition-all duration-[120ms]"
          >
            <ScanLine size={12} strokeWidth={1.8} />
            Scan Barcode
          </button>
        </div>
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

      {/* Sales History Modal */}
      {showSalesHistory && (
        <SalesHistoryModal onClose={() => setShowSalesHistory(false)} />
      )}

      {/* Barcode scanner modal */}
      {showScanner && (
        <div className="modal-overlay">
          <div className="modal-content rounded-[12px] w-full max-w-lg overflow-hidden shadow-2xl" style={{ background: 'var(--panel-bg)', border: '1px solid var(--border-subtle)' }}>
            <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
          </div>
        </div>
      )}

      {showReceipt && completedSale && (
        <>
          <div className="modal-overlay no-print">
            <div className="modal-content w-full max-w-3xl rounded-[18px] shadow-2xl overflow-hidden" style={{ background: 'var(--panel-bg)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div>
                  <p className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>Receipt ready</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>{completedSale.invoiceNo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadReceipt(completedSale)}
                    className="h-8 px-3 rounded-[8px] border border-white/[0.08] text-[12px] font-semibold hover:bg-white/[0.05] transition-colors"
                    style={{ color: 'var(--text)' }}
                  >
                    Download Receipt
                  </button>
                  <button
                    onClick={() => printReceipt(completedSale)}
                    className="h-8 px-3 rounded-[8px] bg-[var(--accent)] text-white text-[12px] font-semibold hover:opacity-90 transition-opacity"
                  >
                    Print
                  </button>
                  <button
                    onClick={() => setShowReceipt(false)}
                    className="h-8 w-8 rounded-[8px] bg-white/[0.04] border border-white/[0.08] text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/[0.07] transition-colors"
                    aria-label="Close receipt"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="max-h-[72vh] overflow-y-auto p-4 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]">
                <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="text-center pb-4 border-b border-white/[0.06]">
                    <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>{SHOP_INFO.name}</h2>
                    <p className="text-[12px] mt-1" style={{ color: 'var(--muted)' }}>{SHOP_INFO.tagline}</p>
                    <p className="text-[11.5px] mt-1" style={{ color: 'var(--muted-2)' }}>{SHOP_INFO.address} · {SHOP_INFO.phone} · {SHOP_INFO.email}</p>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2 text-[12px] py-4 border-b border-white/[0.06]" style={{ color: 'var(--muted-2)' }}>
                    <div><span className="font-semibold" style={{ color: 'var(--text)' }}>Invoice:</span> {completedSale.invoiceNo}</div>
                    <div><span className="font-semibold" style={{ color: 'var(--text)' }}>Date:</span> {fmtDateTime(completedSale.createdAt)}</div>
                    <div><span className="font-semibold" style={{ color: 'var(--text)' }}>Customer:</span> {completedSale.customer ? `${completedSale.customer.name} (${completedSale.customer.phone})` : 'Walk-in Customer'}</div>
                    <div><span className="font-semibold" style={{ color: 'var(--text)' }}>Cashier:</span> {completedSale.user?.fullName || 'N/A'}</div>
                    <div><span className="font-semibold" style={{ color: 'var(--text)' }}>Payment:</span> {PAYMENT_LABELS[completedSale.paymentMode]}</div>
                    <div><span className="font-semibold" style={{ color: 'var(--text)' }}>Sale ID:</span> #{completedSale.id}</div>
                  </div>

                  <div className="overflow-x-auto py-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-[10.5px] uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>
                          <th className="py-2 pr-3">#</th>
                          <th className="py-2 pr-3">Item</th>
                          <th className="py-2 pr-3 text-right">Qty</th>
                          <th className="py-2 pr-3 text-right">Unit</th>
                          <th className="py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedSale.items.map((item, index) => (
                          <tr key={`${item.product.name}-${index}`} className="border-b border-white/[0.04] last:border-0 text-[12.5px]" style={{ color: 'var(--text)' }}>
                            <td className="py-2 pr-3 align-top">{index + 1}</td>
                            <td className="py-2 pr-3 align-top">
                              <div className="font-medium">{item.product.name}</div>
                              <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>Barcode: {item.product.barcode || 'N/A'}</div>
                            </td>
                            <td className="py-2 pr-3 text-right align-top">{item.quantity}</td>
                            <td className="py-2 pr-3 text-right align-top">৳ {fmt(item.price)}</td>
                            <td className="py-2 text-right align-top font-semibold">৳ {fmt(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-2">
                    <div className="w-full max-w-[280px] space-y-2 text-[12px]" style={{ color: 'var(--muted-2)' }}>
                      <div className="flex justify-between gap-4"><span>Subtotal</span><span>৳ {fmt(completedSale.subtotal)}</span></div>
                      <div className="flex justify-between gap-4"><span>Discount</span><span>৳ {fmt(completedSale.discount)}</span></div>
                      <div className="flex justify-between gap-4"><span>VAT</span><span>৳ {fmt(completedSale.vat)}</span></div>
                      <div className="flex justify-between gap-4 pt-2 border-t border-white/[0.06] text-[13px] font-bold" style={{ color: 'var(--text)' }}>
                        <span>Total</span><span>৳ {fmt(completedSale.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/[0.06] text-center text-[11.5px]" style={{ color: 'var(--muted)' }}>
                    Thank you for shopping with {SHOP_INFO.name}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="print-only" style={{ color: '#111827', background: '#ffffff', padding: '24px' }}>
            <div style={{ maxWidth: '780px', margin: '0 auto', border: '1px solid #d1d5db', padding: '24px', borderRadius: '14px' }}>
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <h1 style={{ margin: 0, fontSize: '24px' }}>{SHOP_INFO.name}</h1>
                <p style={{ margin: '4px 0', color: '#4b5563' }}>{SHOP_INFO.tagline}</p>
                <p style={{ margin: '4px 0', color: '#4b5563' }}>{SHOP_INFO.address} | {SHOP_INFO.phone} | {SHOP_INFO.email}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px 16px', margin: '18px 0', fontSize: '13px' }}>
                <div><strong>Invoice:</strong> {completedSale.invoiceNo}</div>
                <div><strong>Date:</strong> {fmtDateTime(completedSale.createdAt)}</div>
                <div><strong>Customer:</strong> {completedSale.customer ? `${completedSale.customer.name} (${completedSale.customer.phone})` : 'Walk-in Customer'}</div>
                <div><strong>Cashier:</strong> {completedSale.user?.fullName || 'N/A'}</div>
                <div><strong>Payment:</strong> {PAYMENT_LABELS[completedSale.paymentMode]}</div>
                <div><strong>Sale ID:</strong> {completedSale.id}</div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '10px 8px', fontSize: '13px', width: '40px' }}>#</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '10px 8px', fontSize: '13px' }}>Item</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid #e5e7eb', padding: '10px 8px', fontSize: '13px', width: '70px' }}>Qty</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid #e5e7eb', padding: '10px 8px', fontSize: '13px', width: '110px' }}>Unit</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid #e5e7eb', padding: '10px 8px', fontSize: '13px', width: '110px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {completedSale.items.map((item, index) => (
                    <tr key={`${item.product.name}-${index}`}>
                      <td style={{ borderBottom: '1px solid #e5e7eb', padding: '10px 8px', fontSize: '13px', verticalAlign: 'top' }}>{index + 1}</td>
                      <td style={{ borderBottom: '1px solid #e5e7eb', padding: '10px 8px', fontSize: '13px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                        <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>Barcode: {item.product.barcode || 'N/A'}</div>
                      </td>
                      <td style={{ borderBottom: '1px solid #e5e7eb', padding: '10px 8px', fontSize: '13px', textAlign: 'right', verticalAlign: 'top' }}>{item.quantity}</td>
                      <td style={{ borderBottom: '1px solid #e5e7eb', padding: '10px 8px', fontSize: '13px', textAlign: 'right', verticalAlign: 'top' }}>৳ {fmt(item.price)}</td>
                      <td style={{ borderBottom: '1px solid #e5e7eb', padding: '10px 8px', fontSize: '13px', textAlign: 'right', verticalAlign: 'top', fontWeight: 700 }}>৳ {fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '16px', marginLeft: 'auto', width: '280px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '13px' }}><span>Subtotal</span><span>৳ {fmt(completedSale.subtotal)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '13px' }}><span>Discount</span><span>৳ {fmt(completedSale.discount)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '13px' }}><span>VAT</span><span>৳ {fmt(completedSale.vat)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: '8px', borderTop: '2px solid #111827', fontSize: '15px', fontWeight: 700 }}><span>Total</span><span>৳ {fmt(completedSale.total)}</span></div>
              </div>

              <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '12px', color: '#4b5563' }}>Thank you for shopping with {SHOP_INFO.name}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Sales;