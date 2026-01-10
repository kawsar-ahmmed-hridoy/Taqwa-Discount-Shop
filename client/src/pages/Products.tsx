import { useState, useEffect } from 'react';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, AlertCircle, Filter, Camera, X } from 'lucide-react';
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

const handleSearch = async () => {
    filterProducts();
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 bg-gold-600 text-white px-4 py-2 rounded-lg hover:bg-gold-700 transition-colors"
          >
            <Camera size={20} />
            Scan Barcode
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-4 flex-1">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products by name, SKU, barcode, or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter size={20} />
              Filters
            </button>
          </div>
          {(searchQuery || selectedCategory !== 'all' || stockFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Products</option>
                <option value="available">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Showing {filteredProducts.length} of {products.length} products
              </div>
            </div>
          </div>
        )}
      </div>

<div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU / Barcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        {product.brand && <div className="text-xs text-gray-500">{product.brand}</div>}
                        {product.discount && (
                          <div className="text-xs text-gold-600 font-medium">Discount: {product.discount}%</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.sku}</div>
                      {product.barcode && <div className="text-xs text-gray-500">{product.barcode}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                        {product.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">BDT {product.sellingPrice.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Cost: {product.purchasePrice.toFixed(2)}</div>
                      {product.discount && (
                        <div className="text-xs text-green-600">After discount: BDT {(product.sellingPrice * (1 - product.discount / 100)).toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                          {stockStatus.status}
                        </span>
                        <span className="text-sm text-gray-600">{product.stockQuantity} units</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
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
          <div className="text-center py-8">
            <div className="text-gray-500">No products found matching your criteria</div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full mx-4">
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