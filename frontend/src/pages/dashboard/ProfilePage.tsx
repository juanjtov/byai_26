import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { organizationApi } from '@/lib/api';
import { DashboardLayout } from '@/components/dashboard';

interface CompanyProfile {
  id: string;
  company_name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  license_number: string | null;
  primary_color: string | null;
  secondary_color: string | null;
}

export function ProfilePage() {
  const { organization, accessToken } = useAuth();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    company_name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    license_number: '',
    primary_color: '#C88D74',
    secondary_color: '#7A9E7E',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!organization?.id || !accessToken) return;

      try {
        const data = await organizationApi.getProfile(organization.id, accessToken) as CompanyProfile;
        setProfile(data);
        setFormData({
          company_name: data.company_name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          license_number: data.license_number || '',
          primary_color: data.primary_color || '#C88D74',
          secondary_color: data.secondary_color || '#7A9E7E',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [organization?.id, accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id || !accessToken) return;

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await organizationApi.updateProfile(organization.id, formData, accessToken);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-ivory/10 rounded w-1/3"></div>
          <div className="h-64 bg-ivory/10 rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-ivory">Company Profile</h1>
          <p className="mt-2 text-body">
            Update your company information and branding.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-green-400 text-sm">
              {success}
            </div>
          )}

          <div className="bg-ivory/5 border border-ivory/10 rounded-xl p-6 space-y-6">
            <h2 className="font-display text-xl text-ivory">Company Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="company_name" className="block text-sm text-ivory/80 mb-2">
                  Company Name
                </label>
                <input
                  id="company_name"
                  name="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors"
                  placeholder="Your Company LLC"
                />
              </div>

              <div>
                <label htmlFor="license_number" className="block text-sm text-ivory/80 mb-2">
                  License Number
                </label>
                <input
                  id="license_number"
                  name="license_number"
                  type="text"
                  value={formData.license_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors"
                  placeholder="GC-12345"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm text-ivory/80 mb-2">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors"
                  placeholder="123 Main St, City, State 12345"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm text-ivory/80 mb-2">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm text-ivory/80 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors"
                  placeholder="contact@company.com"
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm text-ivory/80 mb-2">
                  Website
                </label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors"
                  placeholder="https://yourcompany.com"
                />
              </div>
            </div>
          </div>

          <div className="bg-ivory/5 border border-ivory/10 rounded-xl p-6 space-y-6">
            <h2 className="font-display text-xl text-ivory">Brand Colors</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="primary_color" className="block text-sm text-ivory/80 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="primary_color"
                    name="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={handleChange}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, primary_color: e.target.value }))}
                    className="flex-1 px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="secondary_color" className="block text-sm text-ivory/80 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="secondary_color"
                    name="secondary_color"
                    type="color"
                    value={formData.secondary_color}
                    onChange={handleChange}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, secondary_color: e.target.value }))}
                    className="flex-1 px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-copper text-obsidian font-medium rounded-lg hover:bg-copper/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
