import { useState, useEffect } from 'react';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Award, History } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  loyaltyPoints: number;
  createdAt: string;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getAll({ search: searchQuery });
      setCustomers(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch customers'+error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCustomers();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCustomer) {
        await customerAPI.update(selectedCustomer.id, formData);
        toast.success('Customer updated successfully');
      } else {
        await customerAPI.create(formData);
        toast.success('Customer created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchCustomers();
    } catch (error: unknown) {
      toast.error('Operation failed'+error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', address: '' });
    setSelectedCustomer(null);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const viewHistory = async (customer: Customer) => {
    try {
      const response = await customerAPI.getHistory(customer.id);
      setPurchaseHistory(response.data.data);
      setSelectedCustomer(customer);
      setShowHistory(true);
    } catch (error) {
      toast.error('Failed to fetch purchase history'+error);
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
          <h1 className="page-title">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{customers.length} registered customers</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className="card p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="input-field pl-10"
            />
          </div>
          <button onClick={handleSearch} className="btn-primary px-6">Search</button>
        </div>
      </div>

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Loyalty Points</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <Award size={36} className="mx-auto text-gray-200 mb-2" />
                      <p className="font-medium text-gray-500">No customers found</p>
                    </div>
                  </td>
                </tr>
              ) : customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    <div className="text-xs text-gray-400">Joined {new Date(customer.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td>
                    <div className="text-sm">{customer.phone}</div>
                    {customer.email && <div className="text-xs text-gray-500">{customer.email}</div>}
                  </td>
                  <td className="text-sm">{customer.address || <span className="text-gray-400">—</span>}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Award className="text-yellow-500" size={15} />
                      <span className="font-semibold text-gray-900">{customer.loyaltyPoints}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => viewHistory(customer)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors" title="Purchase History">
                        <History size={16} />
                      </button>
                      <button onClick={() => handleEdit(customer)} className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors" title="Edit">
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <Plus size={18} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Full name" />
              </div>
              <div>
                <label className="label">Phone *</label>
                <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-field" placeholder="01XXXXXXXXX" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="Optional" />
              </div>
              <div>
                <label className="label">Address</label>
                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={3} className="input-field" placeholder="Optional" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{selectedCustomer ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="modal-overlay">
          <div className="modal-content max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Purchase History — {selectedCustomer?.name}</h2>
              <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <Plus size={18} className="rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {purchaseHistory.length === 0 ? (
                <div className="empty-state py-12">
                  <History size={36} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-gray-500">No purchase history</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchaseHistory.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                      <div>
                        <span className="font-medium text-gray-900">{sale.invoiceNo}</span>
                        <div className="text-xs text-gray-500 mt-0.5">{new Date(sale.createdAt).toLocaleDateString()} · {sale.items.length} items</div>
                      </div>
                      <span className="text-base font-bold text-primary-700">BDT {sale.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-100">
              <button onClick={() => setShowHistory(false)} className="btn-secondary w-full">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;