import { useState, useEffect } from 'react';
import { saleAPI, productAPI, customerAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Search, Trash2 } from 'lucide-react';
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

  useEffect(() => {
    fetchCustomers();
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

      toast.success('Sale completed successfully!');
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
    } catch (error) {
      toast.error('Sale failed'+error);
    }
  };

  const handleScan = (barcode: string) => {
    setSearchQuery(barcode);
    handleProductSearch();
    setShowScanner(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Product Search</h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by name, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleProductSearch()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleProductSearch}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Search size={20} />
            </button>
            <button
              onClick={() => setShowScanner(!showScanner)}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Scan
            </button>
          </div>
          {showScanner && <BarcodeScanner onScan={handleScan} />}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Cart Items</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Cart is empty</p>
          ) : (
            <div className="space-y-3">
{cart.map(item => (
                <div key={item.productId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <div className="text-sm text-gray-600">
                      <span>BDT {item.price.toFixed(2)}</span>
                      {item.discount > 0 && (
                        <span className="ml-2 text-gold-600">
                          ({item.discount}% off)
                        </span>
                      )}
                      {item.originalPrice > item.price && (
                        <span className="ml-2 line-through text-gray-400">
                          BDT {item.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                    <p className="w-24 text-right font-semibold">BDT {item.total.toFixed(2)}</p>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Customer</h2>
          <select
            value={selectedCustomer || ''}
            onChange={(e) => setSelectedCustomer(Number(e.target.value) || null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Walk-in Customer</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.phone}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Payment</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Payment Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {['CASH', 'CARD', 'UPI'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode as 'CASH' | 'CARD' | 'UPI')}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      paymentMode === mode
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

<div>
              <label className="block text-sm font-medium mb-2">Additional Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">Applied to total after product discounts</p>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>BDT {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount:</span>
                <span>- BDT {discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>VAT (5%):</span>
                <span>BDT {vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span>BDT {total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;