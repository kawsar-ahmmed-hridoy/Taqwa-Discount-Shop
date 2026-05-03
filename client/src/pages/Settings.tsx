import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Percent, DollarSign, Globe, Save } from 'lucide-react';
import { useLocaleStore } from '../store/localeStore';

/* ─── Primitives ──────────────────────────────────────────────────────────── */
const F: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

const inp: React.CSSProperties = {
  ...F, background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
  borderRadius: 8, color: 'var(--text)', fontSize: 13,
  padding: '9px 12px', outline: 'none', width: '100%', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const SectionHeader = ({ label, sub }: { label: string; sub: string }) => (
  <div style={{ marginBottom: 20 }}>
    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{label}</p>
    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sub}</p>
  </div>
);

const Field = ({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, alignItems: 'start',
    padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
    <div>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', margin: 0 }}>{label}</p>
      {hint && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>{hint}</p>}
    </div>
    <div style={{ maxWidth: 360 }}>{children}</div>
  </div>
);

const IconWrap = ({ icon: Icon, children, right }: {
  icon: React.ElementType; children: React.ReactNode; right?: React.ReactNode;
}) => (
  <div style={{ position: 'relative' }}>
    <Icon size={13} style={{ position: 'absolute', left: 10, top: '50%',
      transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
    {children}
    {right && <span style={{ position: 'absolute', right: 10, top: '50%',
      transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 12 }}>{right}</span>}
  </div>
);



const SaveRow = ({ saving, onClear }: { saving: boolean; onClear?: () => void }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 18 }}>
    {onClear && (
      <button type="button" onClick={onClear}
        style={{ ...F, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-subtle)',
          background: 'transparent', color: 'var(--muted)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
        Clear
      </button>
    )}
    <button type="submit" disabled={saving}
      style={{ ...F, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px',
        borderRadius: 8, border: 'none', background: saving ? '#163a6b' : 'var(--accent)',
        color: '#fff', fontSize: 13, fontWeight: 600,
        cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
      <Save size={13} />
      {saving ? 'Saving…' : 'Save Changes'}
    </button>
  </div>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--border-subtle)',
    borderRadius: 12, padding: '22px 26px' }}>
    {children}
  </div>
);

const Divider = () => <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '6px 0' }} />;

const CURRENCIES = [
  { value: 'BDT', label: 'BDT — Bangladeshi Taka' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'INR', label: 'INR — Indian Rupee' },
];

/* ─── Main ────────────────────────────────────────────────────────────────── */
const Settings = () => {
  const { t } = useLocaleStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [general, setGeneral] = useState({
    vat_rate: '5',
    currency: 'BDT',
    loyalty_points_rate: '1',
  });

  useEffect(() => {
    settingsAPI
      .get()
      .then(r => setGeneral(r.data.data))
      .catch(() => toast.error(t('Failed to load settings')))
      .finally(() => setLoading(false));
  }, []);

  const saveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsAPI.update(general);
      toast.success(t('Settings saved'));
    } catch {
      toast.error(t('Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
        <div className="spinner w-10 h-10" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#111318] p-5 space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Page heading ── */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{t('Settings')}</h1>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{t('Configure system preferences')}</p>
      </div>

      {/* ══ General ══════════════════════════════════════════════════════════ */}
      <Card>
        <SectionHeader label={t('General Settings')} sub={t('Configure tax, currency, and loyalty rules')} />
        <form onSubmit={saveGeneral}>
          <Field label={t('VAT Rate')} hint={t('Applied at checkout on taxable items')}>
            <IconWrap icon={Percent} right="%">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={general.vat_rate}
                onChange={e => setGeneral(g => ({ ...g, vat_rate: e.target.value }))}
                style={{ ...inp, paddingLeft: 30, paddingRight: 28, borderWidth: '0.5px', borderStyle: 'solid'}}
              />
            </IconWrap>
          </Field>
          <Field label={t('Currency')} hint={t('Display currency used system-wide')}>
            <IconWrap icon={Globe}>
              <select
                value={general.currency}
                onChange={e => setGeneral(g => ({ ...g, currency: e.target.value }))}
                style={{ ...inp, paddingLeft: 30, appearance: 'none', borderWidth: '0.5px', borderStyle: 'solid'}}
              >
                {CURRENCIES.map(c => (
                  <option key={c.value} value={c.value}>
                    {t(c.label)}
                  </option>
                ))}
              </select>
            </IconWrap>
          </Field>

          <Divider />

          <Field
            label={t('Loyalty Points Rate')}
            hint={t('Points per 1 {currency} spent', { currency: general.currency }) + `${
              Number(general.loyalty_points_rate) > 0
                ? ` · 1,000 ${general.currency} = ${(1000 * Number(general.loyalty_points_rate)).toLocaleString()} ${t('pts')}`
                : ''
            }`}
          >
            <IconWrap icon={DollarSign}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={general.loyalty_points_rate}
                onChange={e => setGeneral(g => ({ ...g, loyalty_points_rate: e.target.value }))}
                style={{ ...inp, paddingLeft: 30, borderWidth: '0.5px', borderStyle: 'solid' }}
              />
            </IconWrap>
          </Field>
          <SaveRow saving={saving} />
        </form>
      </Card>
    </div>
  );
};

export default Settings;