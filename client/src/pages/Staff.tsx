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
    const map: Record<string, string> = {
      OWNER: 'badge-danger',
      MANAGER: 'badge-primary',
      STAFF: 'badge-success',
    };
    return map[role] || 'badge-info';
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
          <h1 className="page-title">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{staff.length} team members</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Staff
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="empty-state card py-16">
          <UserCheck size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="font-medium text-gray-500">No staff members yet</p>
          <button onClick={handleAdd} className="btn-primary mt-4">Add Staff</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {staff.map((member) => (
            <div key={member.id} className="card card-hover p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 gradient-primary rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                  {member.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{member.fullName}</h3>
                  <p className="text-sm text-gray-500 truncate">{member.email}</p>
                </div>
                <div className="flex items-center">
                  {member.isActive ? (
                    <UserCheck className="text-green-500" size={18} />
                  ) : (
                    <UserX className="text-red-400" size={18} />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`badge ${getRoleBadge(member.role)}`}>{member.role}</span>
                {!member.isActive && <span className="badge badge-danger">Inactive</span>}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(member)} className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors" title="Edit">
                    <Edit size={15} />
                  </button>
                  <button onClick={() => handleDelete(member.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <UserX size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input type="text" required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" required disabled={!!selectedStaff} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field disabled:bg-gray-50" />
              </div>
              <div>
                <label className="label">Password {selectedStaff ? '(leave blank to keep)' : '*'}</label>
                <input type="password" required={!selectedStaff} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input-field" placeholder={selectedStaff ? '••••••••' : ''} />
              </div>
              <div>
                <label className="label">Role *</label>
                <select required value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as any })} className="input-field">
                  <option value="STAFF">Staff</option>
                  <option value="MANAGER">Manager</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 text-primary-600 border-gray-300 rounded" />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active Account</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{selectedStaff ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;