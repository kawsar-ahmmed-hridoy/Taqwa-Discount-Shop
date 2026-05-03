import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ShoppingBag, Eye, EyeOff, X } from 'lucide-react';

const credentials = [
  { role: 'Owner', email: 'owner@taqwa.com', password: 'owner123' },
  { role: 'Manager', email: 'manager@taqwa.com', password: 'manager123' },
  { role: 'Staff', email: 'staff@taqwa.com', password: 'staff123' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetVerificationId, setResetVerificationId] = useState<number | null>(null);
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [resetConfirmLoading, setResetConfirmLoading] = useState(false);
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

  const requestForgotPasswordCode = async () => {
    setResetLoading(true);
    try {
      const response = await authAPI.forgotPassword({ email: resetEmail });
      const verification = response.data.data;

      if (!verification?.id) {
        toast.success(response.data.message || 'If the email exists, a verification code has been sent.');
        setShowForgot(false);
        setResetEmail('');
        return;
      }

      setResetVerificationId(verification.id);
      setResetStep('confirm');
      toast.success('Verification code sent to your email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send verification code');
    } finally {
      setResetLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestForgotPasswordCode();
  };

  const handleConfirmForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (resetNewPassword !== resetConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!resetVerificationId) {
      toast.error('Verification code is missing');
      return;
    }

    if (!/^\d{6}$/.test(resetCode)) {
      toast.error('Enter the 6-digit verification code');
      return;
    }

    setResetConfirmLoading(true);
    try {
      await authAPI.confirmForgotPassword({
        verificationId: resetVerificationId,
        code: resetCode,
        newPassword: resetNewPassword,
      });
      toast.success('Password reset successfully. Please sign in again.');
      setShowForgot(false);
      setResetEmail('');
      setResetVerificationId(null);
      setResetCode('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      setResetStep('request');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetConfirmLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgot(false);
    setResetEmail('');
    setResetVerificationId(null);
    setResetCode('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetStep('request');
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition";

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Left panel */}
      <div className="hidden lg:flex w-96 bg-emerald-700 flex-col justify-between p-10 text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
            <ShoppingBag size={18} />
          </div>
          <span className="font-semibold text-base">Taqwa Discount Shop</span>
        </div>

        <div>
          <p className="text-2xl font-light leading-snug mb-8 text-white/90">
            Manage your store<br />smarter, faster.
          </p>
          <div className="space-y-5">
            {[
              { title: 'Point of Sale', desc: 'Barcode scanning & fast checkout' },
              { title: 'Inventory Control', desc: 'Real-time stock & low-stock alerts' },
              { title: 'Customer Loyalty', desc: 'Points system & purchase history' },
              { title: 'Reports & Analytics', desc: 'Daily, weekly & monthly insights' },
            ].map(f => (
              <div key={f.title} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-white/60 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/50">© {new Date().getFullYear()} Taqwa · POS v2.4</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <ShoppingBag size={16} className="text-white" />
            </div>
            <span className="font-semibold text-gray-800">Taqwa Discount Shop</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-7">Access the POS management system</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@taqwa.com"
                autoComplete="email"
                className={inputClass}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-gray-600">Password</label>
                <button
                  type="button"
                  onClick={() => { setResetEmail(email); setShowForgot(true); setResetStep('request'); }}
                  className="text-xs text-emerald-600 hover:text-emerald-700"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={inputClass + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition mt-2"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Sign in'}
            </button>
          </form>

          {/* Quick access */}
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-xs text-gray-400">Quick access</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {credentials.map(c => (
                <button
                  key={c.role}
                  type="button"
                  onClick={() => { setEmail(c.email); setPassword(c.password); }}
                  className="border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-lg p-2.5 text-left transition"
                >
                  <p className="text-xs font-semibold text-gray-700">{c.role}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">{c.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={e => e.target === e.currentTarget && closeForgotModal()}
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Reset password</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {resetStep === 'request'
                    ? 'We will send a 6-digit code to your email.'
                    : 'Enter the code and choose a new password.'}
                </p>
              </div>
              <button onClick={closeForgotModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            {resetStep === 'request' ? (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  autoComplete="email"
                  className={inputClass}
                />
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm flex items-center justify-center transition"
                >
                  {resetLoading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'Send verification code'}
                </button>
                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="w-full text-sm text-gray-400 hover:text-gray-600 py-1.5 transition"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmForgotPassword} className="space-y-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-800 mt-1 truncate">{resetEmail}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Verification code</label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={6}
                    className={inputClass + ' tracking-[0.3em] text-center font-semibold'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">New password</label>
                  <input
                    type="password"
                    value={resetNewPassword}
                    onChange={e => setResetNewPassword(e.target.value)}
                    required
                    placeholder="New password"
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm password</label>
                  <input
                    type="password"
                    value={resetConfirmPassword}
                    onChange={e => setResetConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetConfirmLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm flex items-center justify-center transition"
                >
                  {resetConfirmLoading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'Verify & reset password'}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetVerificationId(null);
                      setResetCode('');
                      setResetNewPassword('');
                      setResetConfirmPassword('');
                      setResetStep('request');
                    }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700 py-1.5 transition border border-gray-200 rounded-lg"
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={() => void requestForgotPasswordCode()}
                    disabled={resetLoading}
                    className="w-full text-sm text-emerald-700 hover:text-emerald-800 py-1.5 transition border border-emerald-200 rounded-lg bg-emerald-50 disabled:opacity-50"
                  >
                    {resetLoading ? 'Resending…' : 'Resend code'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;