import { useState, useEffect } from 'react';
import { expenseAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Plus, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Expense {
  id: number;
  category: string;
  amount: number;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  expenseDate: string;
  user: { fullName: string };
  createdAt: string;
}

const expenseCategories = [
  'Rent',
  'Utilities',
  'Salaries',
  'Maintenance',
  'Marketing',
  'Transportation',
  'Office Supplies',
  'Insurance',
  'Other',
];

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    category: '',
    amount: 0,
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchExpenses();
  }, [filterStatus]);

  const fetchExpenses = async () => {
    try {
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await expenseAPI.getAll(params);
      setExpenses(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch expenses'+error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await expenseAPI.create({
        ...formData,
        amount: Number(formData.amount),
      });
      toast.success('Expense created successfully');
      setShowModal(false);
      resetForm();
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to create expense'+error);
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      amount: 0,
      description: '',
      expenseDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleApprove = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await expenseAPI.approve(id, status);
      toast.success(`Expense ${status.toLowerCase()} successfully`);
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to update expense status'+error);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'badge-warning',
      APPROVED: 'badge-success',
      REJECTED: 'badge-danger',
    };
    return map[status] || 'badge-warning';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle size={16} />;
      case 'REJECTED':
        return <XCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const totalExpenses = expenses
    .filter((exp) => exp.status === 'APPROVED')
    .reduce((sum, exp) => sum + exp.amount, 0);

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
          <h1 className="page-title">Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage business expenses</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Approved</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">BDT {totalExpenses.toFixed(2)}</h3>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <DollarSign className="text-green-600" size={22} />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Pending Review</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{expenses.filter((e) => e.status === 'PENDING').length}</h3>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Clock className="text-yellow-600" size={22} />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">This Month</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {expenses.filter((e) => {
                  const d = new Date(e.expenseDate), n = new Date();
                  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
                }).length}
              </h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <DollarSign className="text-blue-600" size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
            <button key={status} onClick={() => setFilterStatus(status)} className={`filter-chip ${filterStatus === status ? 'filter-chip-active' : 'filter-chip-inactive'}`}>
              {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="empty-state card py-16">
          <DollarSign size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="font-medium text-gray-500">No expenses found</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Add Expense</button>
        </div>
      ) : (
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Submitted By</th>
                  <th>Status</th>
                  {user?.role === 'OWNER' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="text-sm">{new Date(expense.expenseDate).toLocaleDateString()}</td>
                    <td><span className="badge badge-info">{expense.category}</span></td>
                    <td className="text-sm max-w-xs truncate">{expense.description}</td>
                    <td className="font-semibold">BDT {expense.amount.toFixed(2)}</td>
                    <td className="text-sm text-gray-600">{expense.user.fullName}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(expense.status)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(expense.status)}
                        {expense.status.charAt(0) + expense.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    {user?.role === 'OWNER' && (
                      <td>
                        {expense.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(expense.id, 'APPROVED')} className="text-xs font-semibold text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50">Approve</button>
                            <button onClick={() => handleApprove(expense.id, 'REJECTED')} className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">Reject</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add New Expense</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <XCircle size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Category *</label>
                <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field">
                  <option value="">Select Category</option>
                  {expenseCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Amount (BDT) *</label>
                <input type="number" required min="0" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} className="input-field" placeholder="0.00" />
              </div>
              <div>
                <label className="label">Date *</label>
                <input type="date" required value={formData.expenseDate} onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label">Description *</label>
                <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="input-field" placeholder="Enter expense details..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;