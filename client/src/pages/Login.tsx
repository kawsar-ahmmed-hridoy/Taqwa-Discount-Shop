import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ShoppingCart, Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data.data;
      setAuth(user, token);
      toast.success(`Welcome back, ${user.fullName}!`);
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-center items-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
            <ShoppingCart size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Taqwa Discount Shop</h1>
          <p className="text-xl text-white/80 mb-8">Complete Point of Sale Management System</p>
          <div className="grid grid-cols-2 gap-4 text-left">
            {[
              { label: 'Real-time Billing', desc: 'Fast barcode scanning' },
              { label: 'Inventory Control', desc: 'Stock tracking & alerts' },
              { label: 'Customer Loyalty', desc: 'Points & purchase history' },
              { label: 'Analytics', desc: 'Reports & insights' },
            ].map((feature, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="font-semibold text-sm">{feature.label}</p>
                <p className="text-white/70 text-xs mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center">
              <ShoppingCart size={32} className="text-white" />
            </div>
          </div>

          <div className="card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
              <p className="text-gray-500 mt-1 text-sm">Enter your credentials to access the system</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                    placeholder="owner@taqwa.com"
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
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
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

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner w-4 h-4" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight size={18} />
                  </span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="text-center text-sm text-gray-500">
                <p className="font-medium text-gray-700 mb-3">Default Credentials</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { role: 'Owner', email: 'owner@takowa.com' },
                    { role: 'Manager', email: 'manager@takowa.com' },
                    { role: 'Staff', email: 'staff@takowa.com' },
                  ].map((cred) => (
                    <button
                      key={cred.role}
                      type="button"
                      onClick={() => { setEmail(cred.email); setPassword(`${cred.role.toLowerCase()}123`); }}
                      className="p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-primary-50 hover:border-primary-200 transition-colors text-left"
                    >
                      <p className="font-semibold text-gray-700">{cred.role}</p>
                      <p className="text-gray-400 truncate">{cred.email}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            New to the system?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Create account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;