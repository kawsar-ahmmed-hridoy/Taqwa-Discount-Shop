import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ShoppingCart, Lock, Mail, User, ArrowLeft, Eye, EyeOff, Shield } from 'lucide-react';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'OWNER' | 'MANAGER' | 'STAFF'>('STAFF');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.signup({ email, password, fullName, role });
      const { token, user } = response.data.data;
      setAuth(user, token);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="hidden lg:flex lg:w-2/5 gradient-primary flex-col justify-center items-center p-12 text-white">
        <div className="max-w-sm text-center">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
            <ShoppingCart size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Taqwa Discount Shop</h1>
          <p className="text-white/80 text-lg">Create your account to get started with the POS system</p>
          <div className="mt-8 p-4 bg-white/10 rounded-xl backdrop-blur-sm text-left">
            <div className="flex items-center gap-3 mb-3">
              <Shield size={20} className="text-white/80" />
              <span className="font-semibold">Role-Based Access</span>
            </div>
            <p className="text-white/70 text-sm">Different roles (Owner, Manager, Staff) have different permissions and access levels</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center">
              <ShoppingCart size={32} className="text-white" />
            </div>
          </div>

          <div className="card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
              <p className="text-gray-500 mt-1 text-sm">Fill in your details to create a new account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="input-field pl-10"
                    placeholder="Kawser Hridoy"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field pl-10"
                    placeholder="hridoy@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="input-field pl-10 pr-10"
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'OWNER' | 'MANAGER' | 'STAFF')}
                  className="input-field"
                >
                  <option value="STAFF">Staff - Can process sales & manage products</option>
                  <option value="MANAGER">Manager - Staff permissions + suppliers & expenses</option>
                  <option value="OWNER">Owner - Full system access</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner w-4 h-4" />
                    Creating Account...
                  </span>
                ) : 'Create Account'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary-600 hover:text-primary-700 font-semibold inline-flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              Back to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;