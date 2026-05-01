import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Phone, Save, User } from 'lucide-react';

const F: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

const inp: React.CSSProperties = {
  ...F,
  background: 'var(--card-bg)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 8,
  color: 'var(--text)',
  fontSize: 13,
  padding: '9px 12px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const Field = ({ label, hint, children }: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '200px 1fr',
      gap: 20,
      alignItems: 'start',
      padding: '14px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}
  >
    <div>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', margin: 0 }}>{label}</p>
      {hint && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>{hint}</p>}
    </div>
    <div style={{ maxWidth: 360 }}>{children}</div>
  </div>
);

const IconWrap = ({ icon: Icon, children }: {
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div style={{ position: 'relative' }}>
    <Icon
      size={13}
      style={{
        position: 'absolute',
        left: 10,
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--muted)',
        pointerEvents: 'none',
      }}
    />
    {children}
  </div>
);

const PasswordInput = ({ value, onChange, placeholder, required }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) => {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={e => onChange(e.target.value)}
        style={{ ...inp, paddingRight: 36 }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: 'absolute',
          right: 9,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: 2,
        }}
      >
        {show ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  );
};

const PasswordStrength = ({ pw }: { pw: string }) => {
  if (!pw) return null;
  const score = [/.{6,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length;
  const map = ['#374151', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 3, flex: 1 }}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 2.5,
              borderRadius: 2,
              background: i <= score ? map[score] : 'var(--panel-bg)',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 11, color: map[score], minWidth: 52 }}>{labels[score]}</span>
    </div>
  );
};

const ProfileInfoPage = () => {
  const { user, setUser } = useAuthStore();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profile, setProfile] = useState({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  });

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    setProfile({
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    });
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authAPI.updateProfile(profile);
      setUser({ ...user, ...res.data.data });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) return toast.error('Passwords do not match');
    if (pw.next.length < 6) return toast.error('Password must be at least 6 characters');

    setSavingPassword(true);
    try {
      await authAPI.resetPassword({ currentPassword: pw.current, newPassword: pw.next });
      toast.success('Password changed');
      setPw({ current: '', next: '', confirm: '' });
    } catch {
      toast.error('Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = (profile.fullName || user?.fullName || '')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="min-h-screen bg-[#111318] p-5 space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Profile</h1>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>Manage your account details and password</p>
      </div>

      <div style={{ background: 'var(--panel-bg)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '22px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg,#1f4ded,#1f6feb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>
            {initials}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{profile.fullName || 'Your Name'}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {user?.role ?? 'User'}{profile.email ? ` · ${profile.email}` : ''}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>Personal Information</h3>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 14px' }}>Update your name, email, and contact details</p>

          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Full Name" hint="Shown throughout the app">
              <IconWrap icon={User}>
                <input
                  type="text"
                  value={profile.fullName}
                  placeholder="e.g. Mahbub Rahman"
                  onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
                  style={{ ...inp, paddingLeft: 30 }}
                />
              </IconWrap>
            </Field>

            <Field label="Email Address" hint="Used for login and notifications">
              <IconWrap icon={Mail}>
                <input
                  type="email"
                  value={profile.email}
                  placeholder="you@example.com"
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  style={{ ...inp, paddingLeft: 30 }}
                />
              </IconWrap>
            </Field>

            <Field label="Phone Number" hint="Optional contact number">
              <IconWrap icon={Phone}>
                <input
                  type="tel"
                  value={profile.phone}
                  placeholder="+880 1XXXXXXXXX"
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  style={{ ...inp, paddingLeft: 30 }}
                />
              </IconWrap>
            </Field>

            <button
              type="submit"
              disabled={savingProfile}
              style={{
                ...F,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: savingProfile ? '#163a6b' : 'var(--accent)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: savingProfile ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                marginTop: 6,
                alignSelf: 'flex-end',
              }}
            >
              <Save size={13} />
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>Change Password</h3>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 14px' }}>Keep your account secure with a strong password</p>

          <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Current Password">
              <PasswordInput
                value={pw.current}
                required
                onChange={v => setPw(p => ({ ...p, current: v }))}
              />
            </Field>

            <div>
              <Field label="New Password" hint="Min. 6 characters">
                <PasswordInput
                  value={pw.next}
                  required
                  placeholder="Min. 6 characters"
                  onChange={v => setPw(p => ({ ...p, next: v }))}
                />
              </Field>
              <PasswordStrength pw={pw.next} />
            </div>

            <Field label="Confirm Password">
              <PasswordInput
                value={pw.confirm}
                required
                onChange={v => setPw(p => ({ ...p, confirm: v }))}
              />
              {pw.confirm && (
                <p style={{ fontSize: 11, marginTop: 6, color: pw.next === pw.confirm ? '#34d399' : '#f87171' }}>
                  {pw.next === pw.confirm ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setPw({ current: '', next: '', confirm: '' })}
                style={{
                  ...F,
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'transparent',
                  color: 'var(--muted)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={savingPassword}
                style={{
                  ...F,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: savingPassword ? '#163a6b' : 'var(--accent)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: savingPassword ? 'not-allowed' : 'pointer',
                }}
              >
                {savingPassword ? 'Saving…' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfoPage;