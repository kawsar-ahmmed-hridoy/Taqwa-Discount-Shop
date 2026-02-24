import { useState, useEffect } from 'react';
import { supplierAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
}

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await supplierAPI.getAll();
      setSuppliers(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch suppliers'+error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedSupplier) {
        await supplierAPI.update(selectedSupplier.id, formData);
        toast.success('Supplier updated successfully');
      } else {
        await supplierAPI.create(formData);
        toast.success('Supplier created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      toast.error('Operation failed'+error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', contactPerson: '', phone: '', email: '', address: '' });
    setSelectedSupplier(null);
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      await supplierAPI.delete(id);
      toast.success('Supplier deleted successfully');
      fetchSuppliers();
    } catch (error) {
      toast.error('Failed to delete supplier'+error);
    }
  };

  const handleAdd = () => {
    resetForm();
    setShowModal(true);
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
          <h1 className="page-title">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{suppliers.length} suppliers</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Supplier
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="empty-state card py-16">
          <MapPin size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="font-medium text-gray-500">No suppliers yet</p>
          <p className="text-sm text-gray-400">Add your first supplier to get started</p>
          <button onClick={handleAdd} className="btn-primary mt-4">Add Supplier</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="card card-hover p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                  <p className="text-sm text-gray-500">{supplier.contactPerson}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(supplier)} className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(supplier.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} className="text-primary-400" />
                  <span>{supplier.phone}</span>
                </div>
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} className="text-primary-400" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0 text-primary-400" />
                    <span>{supplier.address}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
                Added {new Date(supplier.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {suppliers.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg">No suppliers found</p>
          <p className="text-gray-400 mt-2">Add your first supplier to get started</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <Plus size={18} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Company Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label">Contact Person *</label>
                <input type="text" required value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label">Phone *</label>
                <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="Optional" />
              </div>
              <div>
                <label className="label">Address</label>
                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={3} className="input-field" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{selectedSupplier ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;