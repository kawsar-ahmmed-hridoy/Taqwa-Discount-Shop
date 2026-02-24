import { useState, useEffect } from 'react';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Filter, Camera, X, Package } from 'lucide-react';
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

interface Category {
  id: number;
  name: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory, stockFilter]);

const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch products'+error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productAPI.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category.id.toString() === selectedCategory);
    }

    if (stockFilter === 'low') {
      filtered = filtered.filter(product => product.stockQuantity <= product.minStockLevel);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(product => product.stockQuantity === 0);
    } else if (stockFilter === 'available') {
      filtered = filtered.filter(product => product.stockQuantity > 0);
    }

    setFilteredProducts(filtered);
  };

  const handleBarcodeScan = (barcode: string) => {
    setSearchQuery(barcode);
    setShowScanner(false);
    toast.success('Barcode scanned successfully');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setStockFilter('all');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await productAPI.delete(id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product'+error);
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setShowModal(true);
  };

const handleModalClose = () => {
    setShowModal(false);
    setSelectedProduct(null);
    fetchProducts();
  };

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === 0) return { status: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (product.stockQuantity <= product.minStockLevel) return { status: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { status: 'In Stock', color: 'text-green-600 bg-green-100' };
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
          <h1 className="page-title">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filteredProducts.length} of {products.length} products</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowScanner(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Camera size={18} />
            Scan Barcode
          </button>
          <button
            onClick={handleAdd}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[260px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, SKU, barcode, or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-primary-50 border-primary-300 text-primary-700' : ''}`}
          >
            <Filter size={16} />
            Filters
          </button>
          {(searchQuery || selectedCategory !== 'all' || stockFilter !== 'all') && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
              <X size={14} /> Clear filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 mt-4 border-t border-gray-100">
            <div>
              <label className="label">Category</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input-field">
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Stock Status</label>
              <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="input-field">
                <option value="all">All Products</option>
                <option value="available">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
          </div>
        )}
      </div>

<div className="table-container">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU / Barcode</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      {product.brand && <div className="text-xs text-gray-500 mt-0.5">{product.brand}</div>}
                      {!!product.discount && (
                        <span className="badge badge-warning mt-1">{product.discount}% off</span>
                      )}
                    </td>
                    <td>
                      <div className="font-mono text-sm">{product.sku}</div>
                      {product.barcode && <div className="text-xs text-gray-400 mt-0.5">{product.barcode}</div>}
                    </td>
                    <td>
                      <span className="badge badge-primary">{product.category.name}</span>
                    </td>
                    <td>
                      <div className="font-semibold text-gray-900">BDT {product.sellingPrice.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Cost: BDT {product.purchasePrice.toFixed(2)}</div>
                      {!!product.discount && (
                        <div className="text-xs text-green-600 font-medium">Final: BDT {(product.sellingPrice * (1 - product.discount / 100)).toFixed(2)}</div>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className={`badge ${
                          stockStatus.status === 'Out of Stock' ? 'badge-danger' :
                          stockStatus.status === 'Low Stock' ? 'badge-warning' : 'badge-success'
                        }`}>{stockStatus.status}</span>
                        <span className="text-xs text-gray-500">{product.stockQuantity} units</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="empty-state">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-gray-600">No products found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

{showModal && (
        <ProductModal
          product={selectedProduct}
          onClose={handleModalClose}
        />
      )}

      {showScanner && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg w-full">
            <BarcodeScanner
              onScan={handleBarcodeScan}
              onClose={() => setShowScanner(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;