import { useState, useEffect } from 'react';
import { purchaseOrderAPI, supplierAPI, productAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Package, Truck, CheckCircle, XCircle } from 'lucide-react';

interface PurchaseOrder {
  id: number;
  orderNo: string;
  supplier: { id: number; name: string };
  status: 'PENDING' | 'DELIVERED' | 'CANCELLED';
  orderDate: string;
  deliveryDate?: string;
  total: number;
  items: Array<{
    id: number;
    product: { name: string };
    quantity: number;
    price: number;
    total: number;
  }>;
}

const PurchaseOrders = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    supplierId: 0,
    notes: '',
    items: [{ productId: 0, quantity: 1, price: 0 }],
  });

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await purchaseOrderAPI.getAll(params);
      setOrders(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch orders'+error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await supplierAPI.getAll();
      setSuppliers(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch suppliers'+error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(response.data.data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await purchaseOrderAPI.create(formData);
      toast.success('Purchase order created successfully');
      setShowModal(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      toast.error('Failed to create order'+error);
    }
  };

  const resetForm = () => {
    setFormData({
      supplierId: 0,
      notes: '',
      items: [{ productId: 0, quantity: 1, price: 0 }],
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: 0, quantity: 1, price: 0 }],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: unknown) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      const deliveryDate = status === 'DELIVERED' ? new Date().toISOString() : undefined;
      await purchaseOrderAPI.updateStatus(id, { status, deliveryDate });
      toast.success('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status'+error);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'badge-warning',
      DELIVERED: 'badge-success',
      CANCELLED: 'badge-danger',
    };
    return map[status] || 'badge-warning';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle size={16} />;
      case 'CANCELLED':
        return <XCircle size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{orders.length} orders</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Create Order
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'PENDING', 'DELIVERED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => { setFilterStatus(status); fetchOrders(); }}
              className={`filter-chip ${filterStatus === status ? 'filter-chip-active' : 'filter-chip-inactive'}`}
            >
              {status === 'all' ? 'All Orders' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state card py-16">
          <Package size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="font-medium text-gray-500">No purchase orders found</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Create Order</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {orders.map((order) => (
            <div key={order.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{order.orderNo}</h3>
                  <p className="text-sm text-gray-500">{order.supplier.name}</p>
                </div>
                <span className={`badge ${getStatusBadge(order.status)} flex items-center gap-1`}>
                  {getStatusIcon(order.status)}
                  {order.status}
                </span>
              </div>

              <div className="space-y-1.5 mb-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Date</span>
                  <span className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</span>
                </div>
                {order.deliveryDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivered</span>
                    <span className="font-medium text-green-600">{new Date(order.deliveryDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Items</span>
                  <span className="font-medium">{order.items.length}</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-100 mb-3">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-lg font-bold text-gray-900">BDT {order.total.toFixed(2)}</span>
              </div>

              {order.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button onClick={() => updateOrderStatus(order.id, 'DELIVERED')} className="flex-1 btn-success flex items-center justify-center gap-2 py-2">
                    <Truck size={15} /> Mark Delivered
                  </button>
                  <button onClick={() => updateOrderStatus(order.id, 'CANCELLED')} className="flex-1 btn-danger flex items-center justify-center gap-2 py-2">
                    <XCircle size={15} /> Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Create Purchase Order</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <XCircle size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <label className="label">Supplier *</label>
                <select required value={formData.supplierId} onChange={(e) => setFormData({ ...formData, supplierId: Number(e.target.value) })} className="input-field">
                  <option value={0} disabled>Select Supplier</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label">Order Items *</label>
                  <button type="button" onClick={addItem} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                    <Plus size={14} /> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <select required value={item.productId} onChange={(e) => updateItem(index, 'productId', Number(e.target.value))} className="input-field flex-1">
                        <option value={0} disabled>Select Product</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input type="number" required min="1" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} className="input-field w-20" />
                      <input type="number" required min="0" step="0.01" placeholder="Price" value={item.price} onChange={(e) => updateItem(index, 'price', Number(e.target.value))} className="input-field w-28" />
                      {formData.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg mt-0.5">
                          <XCircle size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="input-field" placeholder="Additional notes..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;