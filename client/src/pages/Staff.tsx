import { useState, useEffect } from 'react';
import { staffAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, UserCheck, UserX } from 'lucide-react';

interface Staff {
  id: number;
  email: string;
  fullName: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  isActive: boolean;
  createdAt: string;
}

const Staff = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    role: 'STAFF' as 'OWNER' | 'MANAGER' | 'STAFF',
    isActive: true,
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await staffAPI.getAll();
      setStaff(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch staff'+error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedStaff) {
        const updateData: any = {
          fullName: formData.fullName,
          role: formData.role,
          isActive: formData.isActive,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await staffAPI.update(selectedStaff.id, updateData);
        toast.success('Staff updated successfully');
      } else {
        await staffAPI.create(formData);
        toast.success('Staff created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchStaff();
    } catch (error) {
      toast.error('Operation failed'+error);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      fullName: '',
      password: '',
      role: 'STAFF',
      isActive: true,
    });
    setSelectedStaff(null);
  };

  const handleEdit = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setFormData({
      email: staffMember.email,
      fullName: staffMember.fullName,
      password: '',
      role: staffMember.role,
      isActive: staffMember.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
      await staffAPI.delete(id);
      toast.success('Staff deleted successfully');
      fetchStaff();
    } catch (error) {
      toast.error('Failed to delete staff'+error);
    }
  };

  const handleAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      OWNER: 'bg-purple-100 text-purple-800',
      MANAGER: 'bg-blue-100 text-blue-800',
      STAFF: 'bg-green-100 text-green-800',
    };
    return styles[role as keyof typeof styles] || styles.STAFF;
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
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => (
          <div key={member.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{member.fullName}</h3>
                <p className="text-sm text-gray-600">{member.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {member.isActive ? (
                  <UserCheck className="text-green-500" size={20} />
                ) : (
                  <UserX className="text-red-500" size={20} />
                )}
              </div>
            </div>

            <div className="mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(member.role)}`}>
                {member.role}
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-xs text-gray-500">
                Joined {new Date(member.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(member)}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                  title="Edit"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {staff.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg">No staff members found</p>
          <p className="text-gray-400 mt-2">Add your first staff member to get started</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    disabled={!!selectedStaff}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Password {selectedStaff ? '(leave blank to keep unchanged)' : '*'}
                  </label>
                  <input
                    type="password"
                    required={!selectedStaff}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder={selectedStaff ? '••••••••' : ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Role *</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="STAFF">Staff</option>
                    <option value="MANAGER">Manager</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Active Account
                  </label>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    {selectedStaff ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;