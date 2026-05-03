import { useState, useEffect } from 'react';
import { staffAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, X, Search, Shield, Users, Mail, ShieldCheck, RefreshCw, Loader2 } from 'lucide-react';

interface Staff {
  id: number;
  email: string;
  fullName: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  isActive: boolean;
  createdAt: string;
}

/* ─── Primitives ──────────────────────────────────────────────────────────── */
const F: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

const inp: React.CSSProperties = {
  ...F, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
  borderRadius: 8, color: 'var(--text)', fontSize: 13,
  padding: '9px 12px', outline: 'none', width: '100%', boxSizing: 'border-box',
};

const ROLE_CONFIG = {
  OWNER:   { label: 'Owner',   color: '#c084fc', bg: 'rgba(192,132,252,0.1)', dot: '#a855f7' },
  MANAGER: { label: 'Manager', color: '#6ea8fe', bg: 'rgba(110,168,254,0.1)', dot: '#3b82f6' },
  STAFF:   { label: 'Staff',   color: '#34d399', bg: 'rgba(52,211,153,0.1)',  dot: '#10b981' },
};

const RoleBadge = ({ role }: { role: keyof typeof ROLE_CONFIG }) => {
  const c = ROLE_CONFIG[role];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
      padding: '3px 9px', borderRadius: 20,
      background: c.bg, color: c.color, border: `1px solid ${c.dot}30` }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot }} />
      {c.label}
    </span>
  );
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.05em',
    textTransform: 'uppercase', margin: '0 0 6px' }}>{children}</p>
);

/* ─── Main ────────────────────────────────────────────────────────────────── */
const StaffPage = () => {
  const [staff, setStaff]               = useState<Staff[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [search, setSearch]             = useState('');
  const [filterRole, setFilterRole]     = useState<string>('all');
  const [deleteId, setDeleteId]         = useState<number | null>(null);
  const [verificationId, setVerificationId] = useState<number | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [sendingVerification, setSendingVerification] = useState(false);
  const [confirmingVerification, setConfirmingVerification] = useState(false);

  const [formData, setFormData] = useState({
    email: '', fullName: '', password: '',
    role: 'STAFF' as 'OWNER' | 'MANAGER' | 'STAFF',
    isActive: true,
  });

  useEffect(() => { fetchStaff(); }, []);

  const clearVerification = () => {
    setVerificationId(null);
    setVerificationCode('');
    setVerificationEmail('');
  };

  const sendVerificationCode = async () => {
    setSendingVerification(true);
    try {
      const res = await staffAPI.requestVerification(formData);
      setVerificationId(res.data.data.id);
      setVerificationEmail(res.data.data.email);
      setVerificationCode('');
      toast.success('Verification code sent to Gmail');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send verification code');
    } finally {
      setSendingVerification(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await staffAPI.getAll();
      setStaff(res.data.data);
    } catch { toast.error('Failed to fetch staff'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedStaff) {
        const payload: any = { fullName: formData.fullName, role: formData.role, isActive: formData.isActive };
        if (formData.password) payload.password = formData.password;
        await staffAPI.update(selectedStaff.id, payload);
        toast.success('Staff updated');
      } else if (!verificationId) {
        await sendVerificationCode();
        return;
      } else {
        if (verificationCode.trim().length !== 6) {
          toast.error('Enter the 6-digit verification code');
          return;
        }

        setConfirmingVerification(true);
        await staffAPI.confirmVerification({ verificationId, code: verificationCode.trim() });
        toast.success('Staff created');
      }
      closeModal();
      fetchStaff();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Operation failed');
    } finally {
      setSendingVerification(false);
      setConfirmingVerification(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await staffAPI.delete(deleteId);
      toast.success(res.data?.message ?? 'Staff removed');
      setDeleteId(null);
      fetchStaff();
    } catch { toast.error('Failed to delete'); }
  };

  const openEdit = (m: Staff) => {
    setSelectedStaff(m);
    setFormData({ email: m.email, fullName: m.fullName, password: '', role: m.role, isActive: m.isActive });
    clearVerification();
    setShowModal(true);
  };

  const openAdd = () => {
    setSelectedStaff(null);
    setFormData({ email: '', fullName: '', password: '', role: 'STAFF', isActive: true });
    clearVerification();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStaff(null);
    clearVerification();
    setSendingVerification(false);
    setConfirmingVerification(false);
  };

  const filtered = staff.filter(m =>
    (filterRole === 'all' || m.role === filterRole) &&
    (m.fullName.toLowerCase().includes(search.toLowerCase()) ||
     m.email.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = {
    total: staff.length,
    active: staff.filter(m => m.isActive).length,
    owners: staff.filter(m => m.role === 'OWNER').length,
    managers: staff.filter(m => m.role === 'MANAGER').length,
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
      <div className="spinner w-10 h-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#111318] p-5 space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Staff</h1>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{staff.length} team members</p>
        </div>
        <button onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent)',
            color: '#fff', border: 'none', borderRadius: 9, padding: '9px 16px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> Add Staff
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
        {[
          { label: 'Total',    value: counts.total },
          { label: 'Active',   value: counts.active },
          { label: 'Owners',   value: counts.owners },
          { label: 'Managers', value: counts.managers },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--panel-bg)', border: '1px solid var(--border-subtle)',
            borderRadius: 10, padding: '13px 16px' }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase',
              letterSpacing: '0.05em', margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%',
            transform: 'translateY(-50%)', color: '#4b5563' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{ ...inp, paddingLeft: 30 }} />
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--panel-bg)', padding: 4,
          borderRadius: 9, border: '1px solid rgba(255,255,255,0.06)' }}>
          {['all', 'OWNER', 'MANAGER', 'STAFF'].map(r => (
            <button key={r} onClick={() => setFilterRole(r)}
              style={{ ...F, fontSize: 12, fontWeight: 500, padding: '5px 12px',
                borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.12s',
                background: filterRole === r ? 'var(--accent)' : 'transparent',
                color: filterRole === r ? '#fff' : 'var(--muted)' }}>
              {r === 'all' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', background: 'var(--panel-bg)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: '60px 0', gap: 10 }}>
          <Users size={34} color="var(--muted)" />
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>No staff members found</p>
          <button onClick={openAdd}
            style={{ ...F, background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
            Add Staff
          </button>
        </div>
      ) : (
        <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--border-subtle)',
          borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Member', 'Role', 'Status', 'Joined', ''].map((h, i) => (
                  <th key={i} style={{ padding: '11px 16px', textAlign: i >= 3 ? 'right' : 'left',
                    fontSize: 11, fontWeight: 600, color: 'var(--muted)',
                    letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, idx) => {
                const initials = m.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <tr key={m.id}
                    style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                    {/* Member */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                          background: 'linear-gradient(135deg,#1f4ded,#1f6feb)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: '#fff' }}>
                          {initials}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{m.fullName}</p>
                          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{m.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={{ padding: '12px 16px' }}>
                      <RoleBadge role={m.role} />
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 11, fontWeight: 600,
                        color: m.isActive ? '#34d399' : 'var(--muted)' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%',
                          background: m.isActive ? '#10b981' : '#374151' }} />
                        {m.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>
                      {new Date(m.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        <button onClick={() => openEdit(m)} title="Edit"
                          style={{ padding: 6, borderRadius: 6, border: '1px solid var(--border-subtle)',
                            background: 'transparent', color: 'var(--muted)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', transition: 'all 0.12s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6ea8fe'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(110,168,254,0.3)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)'; }}>
                          <Edit size={13} />
                        </button>
                        <button onClick={() => setDeleteId(m.id)} title="Delete"
                          style={{ padding: 6, borderRadius: 6, border: '1px solid var(--border-subtle)',
                            background: 'transparent', color: 'var(--muted)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', transition: 'all 0.12s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(248,113,113,0.3)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)'; }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', fontSize: 11, color: 'var(--muted)' }}>
            Showing {filtered.length} of {staff.length} members
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex',
          alignItems: 'center', justifyContent: 'center', background: 'var(--modal-overlay)', backdropFilter: 'blur(6px)' }}>
          <div style={{ ...F, background: 'var(--card-bg)', border: '1px solid var(--border-subtle)',
            borderRadius: 14, width: '100%', maxWidth: 420 }}>

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8,
                  background: 'rgba(31,111,235,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={13} color="#6ea8fe" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                </p>
              </div>
              <button onClick={closeModal}
                style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-2)', color: 'var(--muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={13} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div>
                <Label>Full Name *</Label>
                <input type="text" required value={formData.fullName} placeholder="e.g. Mahbub Rahman"
                  onChange={e => setFormData(f => ({ ...f, fullName: e.target.value }))}
                  style={inp} />
              </div>

              <div>
                <Label>Email Address *</Label>
                <input type="email" required value={formData.email} disabled={!!selectedStaff}
                  placeholder="staff@example.com"
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  style={{ ...inp, opacity: selectedStaff ? 0.5 : 1, cursor: selectedStaff ? 'not-allowed' : 'text' }} />
                {!selectedStaff && verificationId && (
                  <p style={{ fontSize: 11, color: '#6ea8fe', marginTop: 6 }}>
                    Verification is locked to {verificationEmail || formData.email}. Use the code sent there to finish.
                  </p>
                )}
              </div>

              <div>
                <Label>Password {selectedStaff ? '(leave blank to keep)' : '*'}</Label>
                <input type="password" required={!selectedStaff} value={formData.password}
                  placeholder={selectedStaff ? 'Leave blank to keep current' : 'Min. 6 characters'}
                  onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                  disabled={!selectedStaff && !!verificationId}
                  style={{ ...inp, opacity: !selectedStaff && verificationId ? 0.5 : 1, cursor: !selectedStaff && verificationId ? 'not-allowed' : 'text' }} />
              </div>

              <div>
                <Label>Role *</Label>
                <select required value={formData.role}
                  onChange={e => setFormData(f => ({ ...f, role: e.target.value as any }))}
                  disabled={!selectedStaff && !!verificationId}
                  style={{ ...inp, opacity: !selectedStaff && verificationId ? 0.5 : 1, cursor: !selectedStaff && verificationId ? 'not-allowed' : 'pointer' }}>
                  <option value="STAFF">Staff</option>
                  <option value="MANAGER">Manager</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>

              {/* Active toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: '#161920', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#d1d5db', margin: 0 }}>Active Account</p>
                  <p style={{ fontSize: 11, color: '#4b5563', marginTop: 1 }}>Staff can log in when active</p>
                </div>
                <button type="button"
                  onClick={() => {
                    if (!selectedStaff && verificationId) return;
                    setFormData(f => ({ ...f, isActive: !f.isActive }));
                  }}
                  disabled={!selectedStaff && !!verificationId}
                  style={{ width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: formData.isActive ? '#1f6feb' : 'rgba(255,255,255,0.08)',
                    position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 3,
                    left: formData.isActive ? 21 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                </button>
              </div>

              {!selectedStaff && verificationId && (
                <div style={{ padding: '14px', borderRadius: 12, border: '1px solid rgba(110,168,254,0.16)', background: 'rgba(31,111,235,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(110,168,254,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShieldCheck size={14} color="#6ea8fe" />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#e7eefc', margin: 0 }}>Gmail verification sent</p>
                      <p style={{ fontSize: 11, color: '#8ea4d0', margin: '2px 0 0' }}>Enter the 6-digit code from the email to create the staff account.</p>
                    </div>
                  </div>
                  <div>
                    <Label>Verification Code *</Label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required={!selectedStaff && !!verificationId}
                      value={verificationCode}
                      onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      style={inp}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={clearVerification}
                      style={{ ...F, flex: 1, padding: '9px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#93a4c5', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <RefreshCw size={13} />
                      Edit Details
                    </button>
                    <button
                      type="button"
                      onClick={sendVerificationCode}
                      disabled={sendingVerification}
                      style={{ ...F, flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: '#0f172a', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: sendingVerification ? 0.8 : 1 }}
                    >
                      {sendingVerification ? <><Loader2 size={13} className="animate-spin" /> Resending…</> : <><Mail size={13} /> Resend Code</>}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, paddingTop: 2 }}>
                <button type="button" onClick={closeModal}
                  style={{ ...F, flex: 1, padding: '9px', borderRadius: 9,
                    border: '1px solid rgba(255,255,255,0.08)', background: 'transparent',
                    color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit"
                  disabled={sendingVerification || confirmingVerification}
                  style={{ ...F, flex: 2, padding: '9px', borderRadius: 9, border: 'none',
                    background: '#1f6feb', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: sendingVerification || confirmingVerification ? 0.85 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {selectedStaff ? 'Save Changes' : verificationId ? (confirmingVerification ? <><Loader2 size={13} className="animate-spin" /> Verifying…</> : 'Verify & Create Staff') : (sendingVerification ? <><Loader2 size={13} className="animate-spin" /> Sending…</> : 'Send Verification Code')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteId !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex',
          alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
          <div style={{ ...F, background: '#111318', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, width: '100%', maxWidth: 360, padding: '24px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 11,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Trash2 size={18} color="#f87171" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#f0f2f5', margin: '0 0 6px' }}>Remove Staff Member</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px', lineHeight: 1.5 }}>
              This action cannot be undone. The staff member will lose all access.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDeleteId(null)}
                style={{ ...F, flex: 1, padding: '9px', borderRadius: 9,
                  border: '1px solid rgba(255,255,255,0.08)', background: 'transparent',
                  color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleDelete}
                style={{ ...F, flex: 1, padding: '9px', borderRadius: 9, border: 'none',
                  background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;