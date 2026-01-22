import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { organizationApi } from '@/lib/api';
import { DashboardLayout } from '@/components/dashboard';

interface PricingProfile {
  id: string;
  labor_rate_per_hour: number | null;
  overhead_markup: number | null;
  profit_margin: number | null;
  minimum_charge: number | null;
  region: string | null;
}

interface LaborItem {
  id: string;
  name: string;
  unit: string;
  rate: number;
  category: string | null;
}

const categories = [
  'Demolition',
  'Plumbing',
  'Electrical',
  'Tile',
  'Drywall',
  'Painting',
  'Flooring',
  'Cabinetry',
  'Countertops',
  'Fixtures',
  'General Labor',
  'Other',
];

export function PricingPage() {
  const { organization, accessToken } = useAuth();
  const [, setProfile] = useState<PricingProfile | null>(null);
  const [laborItems, setLaborItems] = useState<LaborItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    labor_rate_per_hour: '',
    overhead_markup: '15',
    profit_margin: '10',
    minimum_charge: '',
    region: '',
  });

  const [newItem, setNewItem] = useState({
    name: '',
    unit: 'sqft',
    rate: '',
    category: 'General Labor',
  });

  useEffect(() => {
    fetchData();
  }, [organization?.id, accessToken]);

  const fetchData = async () => {
    if (!organization?.id || !accessToken) return;

    try {
      const [pricingData, itemsData] = await Promise.all([
        organizationApi.getPricing(organization.id, accessToken) as Promise<PricingProfile>,
        organizationApi.getLaborItems(organization.id, accessToken) as Promise<LaborItem[]>,
      ]);

      setProfile(pricingData);
      setLaborItems(itemsData);

      setFormData({
        labor_rate_per_hour: pricingData.labor_rate_per_hour?.toString() || '',
        overhead_markup: (pricingData.overhead_markup ? pricingData.overhead_markup * 100 : 15).toString(),
        profit_margin: (pricingData.profit_margin ? pricingData.profit_margin * 100 : 10).toString(),
        minimum_charge: pricingData.minimum_charge?.toString() || '',
        region: pricingData.region || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id || !accessToken) return;

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await organizationApi.updatePricing(
        organization.id,
        {
          labor_rate_per_hour: formData.labor_rate_per_hour ? parseFloat(formData.labor_rate_per_hour) : null,
          overhead_markup: formData.overhead_markup ? parseFloat(formData.overhead_markup) / 100 : null,
          profit_margin: formData.profit_margin ? parseFloat(formData.profit_margin) / 100 : null,
          minimum_charge: formData.minimum_charge ? parseFloat(formData.minimum_charge) : null,
          region: formData.region || null,
        },
        accessToken
      );
      setSuccess('Pricing profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pricing');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id || !accessToken || !newItem.name || !newItem.rate) return;

    try {
      const item = await organizationApi.createLaborItem(
        organization.id,
        {
          name: newItem.name,
          unit: newItem.unit,
          rate: parseFloat(newItem.rate),
          category: newItem.category,
        },
        accessToken
      ) as LaborItem;

      setLaborItems((prev) => [...prev, item]);
      setNewItem({ name: '', unit: 'sqft', rate: '', category: 'General Labor' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add labor item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!organization?.id || !accessToken) return;

    try {
      await organizationApi.deleteLaborItem(organization.id, itemId, accessToken);
      setLaborItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
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
          <h1 className="font-display text-3xl text-ivory">Pricing Rules</h1>
          <p className="mt-2 text-body">
            Configure your labor rates, markups, and pricing rules.
          </p>
        </div>

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

        {/* Pricing Profile */}
        <form onSubmit={handleSaveProfile} className="bg-ivory/5 border border-ivory/10 rounded-xl p-6 space-y-6">
          <h2 className="font-display text-xl text-ivory">Pricing Profile</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-ivory/80 mb-2">
                Base Labor Rate ($/hour)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.labor_rate_per_hour}
                onChange={(e) => setFormData((prev) => ({ ...prev, labor_rate_per_hour: e.target.value }))}
                className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors"
                placeholder="75.00"
              />
            </div>

            <div>
              <label className="block text-sm text-ivory/80 mb-2">
                Minimum Charge ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.minimum_charge}
                onChange={(e) => setFormData((prev) => ({ ...prev, minimum_charge: e.target.value }))}
                className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors"
                placeholder="500.00"
              />
            </div>

            <div>
              <label className="block text-sm text-ivory/80 mb-2">
                Overhead Markup (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.overhead_markup}
                onChange={(e) => setFormData((prev) => ({ ...prev, overhead_markup: e.target.value }))}
                className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors"
                placeholder="15"
              />
            </div>

            <div>
              <label className="block text-sm text-ivory/80 mb-2">
                Profit Margin (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.profit_margin}
                onChange={(e) => setFormData((prev) => ({ ...prev, profit_margin: e.target.value }))}
                className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors"
                placeholder="10"
              />
            </div>

            <div>
              <label className="block text-sm text-ivory/80 mb-2">
                Region
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData((prev) => ({ ...prev, region: e.target.value }))}
                className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors"
                placeholder="San Francisco Bay Area"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-copper text-obsidian font-medium rounded-lg hover:bg-copper/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        {/* Labor Items */}
        <div className="bg-ivory/5 border border-ivory/10 rounded-xl p-6 space-y-6">
          <h2 className="font-display text-xl text-ivory">Labor Items</h2>

          {/* Add new item form */}
          <form onSubmit={handleAddItem} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-ivory/80 mb-2">Name</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors"
                placeholder="Tile Installation"
              />
            </div>

            <div className="w-32">
              <label className="block text-sm text-ivory/80 mb-2">Unit</label>
              <select
                value={newItem.unit}
                onChange={(e) => setNewItem((prev) => ({ ...prev, unit: e.target.value }))}
                className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory focus:outline-none focus:border-copper transition-colors"
              >
                <option value="sqft" className="bg-obsidian">sq ft</option>
                <option value="lf" className="bg-obsidian">linear ft</option>
                <option value="each" className="bg-obsidian">each</option>
                <option value="hour" className="bg-obsidian">hour</option>
              </select>
            </div>

            <div className="w-32">
              <label className="block text-sm text-ivory/80 mb-2">Rate ($)</label>
              <input
                type="number"
                step="0.01"
                value={newItem.rate}
                onChange={(e) => setNewItem((prev) => ({ ...prev, rate: e.target.value }))}
                className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors"
                placeholder="12.50"
              />
            </div>

            <div className="w-40">
              <label className="block text-sm text-ivory/80 mb-2">Category</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory focus:outline-none focus:border-copper transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-obsidian">{cat}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-copper text-obsidian font-medium rounded-lg hover:bg-copper/90 transition-colors"
            >
              Add Item
            </button>
          </form>

          {/* Items list */}
          {laborItems.length === 0 ? (
            <div className="text-center text-body py-8">
              No labor items yet. Add your first item above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ivory/10">
                    <th className="text-left text-sm text-ivory/60 pb-3">Name</th>
                    <th className="text-left text-sm text-ivory/60 pb-3">Category</th>
                    <th className="text-right text-sm text-ivory/60 pb-3">Rate</th>
                    <th className="text-right text-sm text-ivory/60 pb-3">Unit</th>
                    <th className="text-right text-sm text-ivory/60 pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {laborItems.map((item) => (
                    <tr key={item.id} className="border-b border-ivory/5">
                      <td className="py-3 text-ivory">{item.name}</td>
                      <td className="py-3 text-body">{item.category || '-'}</td>
                      <td className="py-3 text-right text-copper">${item.rate.toFixed(2)}</td>
                      <td className="py-3 text-right text-body">{item.unit}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-400 hover:text-red-300 transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
