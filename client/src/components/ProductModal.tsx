import { useState, useEffect } from 'react';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';
import { X, Package, Tag, DollarSign, BarChart2, Calendar, Loader } from 'lucide-react';

interface ProductModalProps {
  product: any;
  onClose: () => void;
}

interface Category {
  id: number;
  name: string;
}

const ProductModal = ({ product, onClose }: ProductModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: 0,
    brand: '',
    purchasePrice: 0,
    sellingPrice: 0,
    discount: 0,
    stockQuantity: 0,
    minStockLevel: 10,
    expiryDate: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (product && categories.length > 0) {
      setFormData({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || '',
        categoryId: product.category?.id || product.categoryId || categories[0]?.id || 0,
        brand: product.brand || '',
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        discount: product.discount || 0,
        stockQuantity: product.stockQuantity,
        minStockLevel: product.minStockLevel,
        expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
      });
    } else if (!product && categories.length > 0 && formData.categoryId === 0) {
      setFormData(prev => ({ ...prev, categoryId: categories[0]?.id || 0 }));
    }
  }, [product, categories]);

  const fetchCategories = async () => {
    try {
      const response = await productAPI.getCategories();
      const cats = response.data.data;
      setCategories(cats);
      if (!product && cats.length > 0) {
        setFormData(prev => ({ ...prev, categoryId: cats[0].id }));
      }
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      toast.error('Please select a category');
      return;
    }
    setLoading(true);
    try {
      const data = {
        ...formData,
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),
        discount: Number(formData.discount),
        stockQuantity: Number(formData.stockQuantity),
        minStockLevel: Number(formData.minStockLevel),
        categoryId: Number(formData.categoryId),
        barcode: formData.barcode.trim() || null,
        brand: formData.brand.trim() || null,
        expiryDate: formData.expiryDate || null,
      };
      if (product) {
        await productAPI.update(product.id, data);
        toast.success('Product updated successfully');
      } else {
        await productAPI.create(data);
        toast.success('Product created successfully');
      }
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const finalPrice = formData.sellingPrice * (1 - formData.discount / 100);
  const margin = formData.sellingPrice > 0
    ? (((finalPrice - formData.purchasePrice) / finalPrice) * 100).toFixed(1)
    : '0';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Package size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {product ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-xs text-gray-500">
                {product ? `SKU: ${product.sku}` : 'Fill in the product details below'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Tag size={13} />
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="label">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    className="input-field"
                    placeholder="PROD-001"
                  />
                </div>
                <div>
                  <label className="label">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="input-field"
                    placeholder="Scan or enter barcode"
                  />
                </div>
                <div>
                  <label className="label">Category *</label>
                  {loadingCategories ? (
                    <div className="input-field flex items-center gap-2 text-gray-400">
                      <Loader size={16} className="animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  ) : (
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                      className="input-field"
                    >
                      <option value={0} disabled>Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="label">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="input-field"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <DollarSign size={13} />
                Pricing & Discount
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Purchase Price (BDT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="label">Selling Price (BDT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="label">Discount (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                    className="input-field"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label">Price Preview</label>
                  <div className="input-field bg-gray-50 flex flex-col justify-center">
                    {formData.discount > 0 ? (
                      <div>
                        <span className="text-green-600 font-semibold text-base">BDT {finalPrice.toFixed(2)}</span>
                        <span className="text-gray-400 line-through ml-2 text-sm">BDT {Number(formData.sellingPrice).toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-700 text-base font-medium">BDT {Number(formData.sellingPrice).toFixed(2)}</span>
                    )}
                  </div>
                  {formData.purchasePrice > 0 && formData.sellingPrice > 0 && (
                    <p className={`text-xs mt-1 font-medium ${Number(margin) >= 20 ? 'text-green-600' : Number(margin) >= 10 ? 'text-amber-600' : 'text-red-500'}`}>
                      Margin: {margin}%
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Stock */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <BarChart2 size={13} />
                Stock Management
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                    className="input-field"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label">Min Stock Level *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                    className="input-field"
                    placeholder="10"
                  />
                  <p className="text-xs text-gray-400 mt-1">Alert below this level</p>
                </div>
                <div className="col-span-2">
                  <label className="label flex items-center gap-1.5">
                    <Calendar size={13} />
                    Expiry Date (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading || loadingCategories} className="btn-primary flex-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner w-4 h-4" /> Saving...
                </span>
              ) : (
                product ? 'Update Product' : 'Add Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;