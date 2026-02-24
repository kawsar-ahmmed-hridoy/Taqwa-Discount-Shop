import { useState, useEffect, useRef } from 'react';
import { saleAPI, productAPI, customerAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Search, Trash2, ShoppingCart, User, CreditCard, Banknote, Smartphone, Plus, Minus, Camera, Receipt } from 'lucide-react';
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
      const response = await customerAPI.getAll();
      setCustomers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch customers'+error);
    }
  };

  const handleProductSearch = async () => {
    try {
      const response = await productAPI.search(searchQuery);
      if (response.data.data.length > 0) {
        addToCart(response.data.data[0]);
        setSearchQuery('');
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      toast.error('Search failed'+error);
    }
  };

const addToCart = (product: any) => {
    const finalPrice = product.discount ? product.sellingPrice * (1 - product.discount / 100) : product.sellingPrice;
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
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

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity, total: quantity * item.price }
        : item
    ));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subtotal * discount) / 100;
  const afterDiscount = subtotal - discountAmount;
  const vat = afterDiscount * 0.05;
  const total = afterDiscount + vat;

const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setCheckoutLoading(true);
    try {
      const items = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price,
        discount: item.discount,
      }));

      await saleAPI.create({
        items,
        customerId: selectedCustomer,
        paymentMode,
        additionalDiscount: discount,
        subtotal,
        vat,
        total,
      });

      toast.success('Sale completed! 🎉');
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setTimeout(() => searchRef.current?.focus(), 100);
    } catch (error) {
      toast.error('Sale failed'+error);
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
  ];

  return (
    <div className="h-full">
      <div className="page-header mb-4">
        <h1 className="page-title">Point of Sale</h1>
        <button onClick={() => setShowScanner(true)} className="btn-secondary flex items-center gap-2">
          <Camera size={18} /> Scan Barcode
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Search + Cart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="card p-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search by name, SKU, or barcode — press Enter to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleProductSearch()}
                  className="input-field pl-10"
                  autoFocus
                />
              </div>
              <button onClick={handleProductSearch} className="btn-primary px-5">
                <Search size={18} />
              </button>
            </div>
          </div>

          {/* Cart */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <ShoppingCart size={18} className="text-primary-600" />
                Cart
                {cart.length > 0 && (
                  <span className="badge badge-primary">{cart.length} item{cart.length > 1 ? 's' : ''}</span>
                )}
              </h2>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700 font-medium">
                  Clear all
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="empty-state py-14">
                <ShoppingCart size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="font-medium text-gray-500">Cart is empty</p>
                <p className="text-sm text-gray-400">Search for a product to add it</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm text-gray-600">BDT {item.price.toFixed(2)}</span>
                        {item.discount > 0 && (
                          <>
                            <span className="text-xs text-gray-400 line-through">BDT {item.originalPrice.toFixed(2)}</span>
                            <span className="badge badge-warning">{item.discount}% off</span>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Qty controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center font-semibold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary-600 flex items-center justify-center transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="font-semibold text-gray-900">BDT {item.total.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="card p-4">
            <h3 className="section-title flex items-center gap-2 mb-3">
              <User size={16} className="text-primary-600" />
              Customer
            </h3>
            <select
              value={selectedCustomer || ''}
              onChange={(e) => setSelectedCustomer(Number(e.target.value) || null)}
              className="input-field"
            >
              <option value="">Walk-in Customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} — {customer.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Payment */}
          <div className="card p-4">
            <h3 className="section-title flex items-center gap-2 mb-3">
              <Receipt size={16} className="text-primary-600" />
              Payment
            </h3>

            {/* Payment Mode */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {paymentModes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setPaymentMode(id as 'CASH' | 'CARD' | 'UPI')}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all font-medium text-sm ${
                    paymentMode === id
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Icon size={20} />
                  {label}
                </button>
              ))}
            </div>

            {/* Additional Discount */}
            <div className="mb-4">
              <label className="label">Additional Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="input-field"
                placeholder="0"
              />
            </div>

            {/* Totals */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">BDT {subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount ({discount}%)</span>
                  <span>− BDT {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT (5%)</span>
                <span>BDT {vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2.5 border-t border-gray-200">
                <span>Total</span>
                <span className="text-primary-700">BDT {total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkoutLoading}
              className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
            >
              {checkoutLoading ? (
                <><span className="spinner w-5 h-5" /> Processing...</>
              ) : (
                <><Receipt size={18} /> Complete Sale — BDT {total.toFixed(2)}</>
              )}
            </button>
          </div>
        </div>
      </div>

      {showScanner && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg w-full">
            <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;