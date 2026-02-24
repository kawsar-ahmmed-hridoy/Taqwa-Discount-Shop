import { useState, useEffect } from 'react';
import { settingsAPI, authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Save, Lock, DollarSign, Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'password'>('general');

  const [generalSettings, setGeneralSettings] = useState({
    vat_rate: '5',
    currency: 'BDT',
    loyalty_points_rate: '1',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      setGeneralSettings(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch settings'+error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(generalSettings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings'+error);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await authAPI.resetPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to change password'+error);
    }
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
          <h1 className="page-title">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your system settings and preferences</p>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-gray-100">
          <nav className="flex gap-1 p-2">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <SettingsIcon size={16} />
              General Settings
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'password'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Lock size={16} />
              Change Password
            </button>
          </nav>
        </div>

        {activeTab === 'general' ? (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="section-title mb-4">Tax & Currency Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">VAT Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={generalSettings.vat_rate}
                      onChange={(e) =>
                        setGeneralSettings({ ...generalSettings, vat_rate: e.target.value })
                      }
                      className="input-field pr-10"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Current VAT rate: {generalSettings.vat_rate}%
                  </p>
                </div>

                <div>
                  <label className="label">Currency</label>
                  <select
                    value={generalSettings.currency}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, currency: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="BDT">BDT - Bangladeshi Taka</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="INR">INR - Indian Rupee</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="section-title mb-4">Loyalty Program</h3>
              <div>
                <label className="label">Loyalty Points Rate</label>
                <div className="relative">
                  <DollarSign
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={generalSettings.loyalty_points_rate}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, loyalty_points_rate: e.target.value })
                    }
                    className="input-field pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Points earned per {generalSettings.currency} spent
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveGeneral}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h3 className="section-title mb-4">Change Your Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="label">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  }
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Change Password
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="card p-6 border-l-4 border-primary-500 bg-primary-50">
        <h3 className="text-base font-semibold text-primary-900 mb-3 flex items-center gap-2">
          <SettingsIcon size={16} className="text-primary-600" />
          System Information
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-primary-600 font-medium uppercase tracking-wide">Version</p>
            <p className="font-semibold text-primary-900 mt-1">1.0.0</p>
          </div>
          <div>
            <p className="text-xs text-primary-600 font-medium uppercase tracking-wide">Last Updated</p>
            <p className="font-semibold text-primary-900 mt-1">{new Date().toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-primary-600 font-medium uppercase tracking-wide">Server Status</p>
            <p className="font-semibold text-green-600 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              Online
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
