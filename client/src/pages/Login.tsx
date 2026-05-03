import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ShoppingBag, Eye, EyeOff, X } from 'lucide-react';

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

  const modalInputClass = "w-full rounded-md border border-white/12 bg-slate-950/40 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/15";

  return (
    <div className="min-h-screen flex bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_100%)]">

      {/* Left panel */}
      <div className="hidden lg:flex w-96 bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 flex-col justify-between p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(96,165,250,0.20),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(148,163,184,0.16),_transparent_32%)] pointer-events-none" />
        <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 ring-1 ring-white/10 flex items-center justify-center">
            <ShoppingBag size={18} />
          </div>
          <span className="font-semibold text-base">Taqwa Discount Shop</span>
        </div>

        <div>
          <p className="text-2xl font-light leading-snug mb-8 text-white/90">
            Manage your store<br />with clarity and control.
          </p>
          <div className="space-y-5">
            {[
              { title: 'Point of Sale', desc: 'Barcode scanning & fast checkout' },
              { title: 'Inventory Control', desc: 'Real-time stock & low-stock alerts' },
              { title: 'Customer Loyalty', desc: 'Points system & purchase history' },
              { title: 'Reports & Analytics', desc: 'Daily, weekly & monthly insights' },
            ].map(f => (
              <div key={f.title} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-white/60 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/50">© {new Date().getFullYear()} Taqwa · POS v2.4</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.20),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(148,163,184,0.12),_transparent_30%)] pointer-events-none" />
        <div className="relative z-10 w-full max-w-sm">
          <div className="rounded-[24px] border border-white/10 bg-white/7 backdrop-blur-2xl shadow-[0_24px_80px_rgba(2,6,23,0.38)] p-6 text-white">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-white/15 ring-1 ring-white/10 flex items-center justify-center">
                <ShoppingBag size={16} className="text-white" />
              </div>
              <span className="font-semibold text-white">Taqwa Discount Shop</span>
            </div>

            <div className="mb-5">
              <h1 className="text-[24px] font-semibold tracking-tight leading-tight mt-4">Sign in to continue</h1>
              <p className="text-[13px] text-white/68 mt-2 max-w-sm leading-relaxed">
                A focused workspace for sales, stock, refunds, and reports all in one place.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3.5" aria-label="Sign in form">
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@taqwa.com"
                  autoComplete="email"
                  className="w-full rounded-md border  border-white/12 bg-slate-950/40 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/15"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-white/60">Password</label>
                  <button
                    type="button"
                    onClick={() => { setResetEmail(email); setShowForgot(true); setResetStep('request'); }}
                    className="text-xs text-sky-200 hover:text-white transition"
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
                    className="w-full rounded-md border border-white/12 bg-slate-950/40 px-3 py-2 pr-10 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-white/45 hover:text-white transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 flex items-center justify-center gap-2"
                aria-live="polite"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><ShoppingBag size={15} /> Sign in securely</>}
              </button>
            </form>

            {/* Quick access */}
            <div className="mt-5 mb-4">
              <div className="mt-3 rounded-md border border-white/10 bg-sky-400/10 px-4 py-4 text-xs text-white/75">
                Need help signing in? Email <a href="mailto:support@taqwa.com" className="font-medium text-sky-200 hover:text-white hover:underline">support@taqwa.com</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div
          className="modal-overlay"
          onClick={e => e.target === e.currentTarget && closeForgotModal()}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/12 bg-slate-950/90 backdrop-blur-xl p-6 shadow-[0_20px_60px_rgba(2,6,23,0.55)] text-white">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Reset password</h2>
                <p className="text-sm text-white/65 mt-1">
                  {resetStep === 'request'
                    ? 'We will send a 6-digit code to your email.'
                    : 'Enter the code and choose a new password.'}
                </p>
              </div>
              <button onClick={closeForgotModal} className="text-white/45 hover:text-white transition">
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
                  className={modalInputClass}
                  aria-label="Reset email"
                />
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm flex items-center justify-center transition shadow-sm shadow-blue-600/20"
                >
                  {resetLoading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'Send verification code'}
                </button>
                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="w-full text-sm text-white/50 hover:text-white py-1.5 transition"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmForgotPassword} className="space-y-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-white/45">Email</p>
                  <p className="text-sm font-medium text-white mt-1 truncate">{resetEmail}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">Verification code</label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={6}
                    className={modalInputClass + ' tracking-[0.3em] text-center font-semibold'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">New password</label>
                  <input
                    type="password"
                    value={resetNewPassword}
                    onChange={e => setResetNewPassword(e.target.value)}
                    required
                    placeholder="New password"
                    autoComplete="new-password"
                    className={modalInputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">Confirm password</label>
                  <input
                    type="password"
                    value={resetConfirmPassword}
                    onChange={e => setResetConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    className={modalInputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetConfirmLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm flex items-center justify-center transition shadow-sm shadow-blue-600/20"
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
                    className="w-full text-sm text-white/70 hover:text-white py-1.5 transition border border-white/15 rounded-lg bg-white/[0.03]"
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={() => void requestForgotPasswordCode()}
                    disabled={resetLoading}
                    className="w-full text-sm text-sky-100 hover:text-white py-1.5 transition border border-sky-300/30 rounded-lg bg-sky-400/15 disabled:opacity-50"
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