import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { organizationApi, documentApi } from '@/lib/api';
import { DashboardLayout, OrganizationSetup } from '@/components/dashboard';

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

interface Document {
  id: string;
  status: string;
}

interface DocumentStats {
  total: number;
  processed: number;
  pending: number;
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

// AI Readiness Ring Component
function AIReadinessRing({ processed }: { processed: number; total: number }) {
  const minDocs = 3;
  // Calculate readiness as progress toward the 3-document minimum threshold
  const percentage = Math.min(100, Math.round((processed / minDocs) * 100));

  // Color based on percentage
  const getColor = () => {
    if (percentage < 30) return { stroke: '#ef4444', text: 'text-red-400', bg: 'bg-red-400' };
    if (percentage < 70) return { stroke: '#eab308', text: 'text-yellow-400', bg: 'bg-yellow-400' };
    return { stroke: '#9CAF88', text: 'text-sage', bg: 'bg-sage' };
  };

  const getStatus = () => {
    if (percentage < 30) return 'Not ready';
    if (percentage < 70) return 'Learning';
    return 'Ready to generate';
  };

  const color = getColor();
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-ivory/10"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{
              animation: 'ring-fill 1s ease-out forwards',
            }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-display ${color.text}`}>{percentage}%</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className={`text-sm font-medium ${color.text}`}>{getStatus()}</div>
        <div className="text-xs text-body mt-1">
          {Math.min(processed, minDocs)}/{minDocs} documents for full readiness
        </div>
      </div>
    </div>
  );
}

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

  const [documentStats, setDocumentStats] = useState<DocumentStats>({
    total: 0,
    processed: 0,
    pending: 0,
  });

  const fetchData = async () => {
    if (!organization?.id || !accessToken) return;

    try {
      const [pricingData, itemsData, documentsData] = await Promise.all([
        organizationApi.getPricing(organization.id, accessToken) as Promise<PricingProfile>,
        organizationApi.getLaborItems(organization.id, accessToken) as Promise<LaborItem[]>,
        documentApi.list(organization.id, accessToken) as Promise<Document[]>,
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

      // Calculate document stats
      setDocumentStats({
        total: documentsData.length,
        processed: documentsData.filter((d) => d.status === 'processed').length,
        pending: documentsData.filter((d) => d.status === 'pending' || d.status === 'processing').length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;

    // Exit loading if organization is explicitly null
    if (organization === null) {
      setLoading(false);
      return;
    }

    if (!organization?.id) return;

    fetchData();
  }, [organization, accessToken]);

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

  if (!organization) {
    return <OrganizationSetup />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-ivory">Pricing Rules</h1>
          <p className="mt-2 text-body">
            Configure your estimation options. When generating estimates, you can choose between manual pricing or AI-powered analysis.
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

        {/* Option 1: Manual Pricing */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-copper/20 text-copper font-medium text-sm">1</span>
            <h2 className="font-display text-xl text-ivory">Manual Pricing</h2>
          </div>
          <p className="text-body text-sm ml-11">
            Configure your labor rates, markups, and line items. These will be used when you select manual pricing for an estimate.
          </p>
        </div>

        {/* Pricing Profile */}
        <form onSubmit={handleSaveProfile} className="bg-ivory/5 border border-ivory/10 rounded-xl p-6 space-y-6">
          <h2 className="font-display text-lg text-ivory">Pricing Profile</h2>

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
          <h2 className="font-display text-lg text-ivory">Labor Items</h2>

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

        {/* Option 2: AI-Powered Estimates */}
        <div className="space-y-6 pt-4 border-t border-ivory/10">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sage/20 text-sage font-medium text-sm">2</span>
            <h2 className="font-display text-xl text-ivory flex items-center gap-2">
              AI-Powered Estimates
              <span className="text-xs bg-sage/20 text-sage px-2 py-0.5 rounded-full font-normal">
                Beta
              </span>
            </h2>
          </div>
        </div>

        <div className="relative bg-ivory/5 border border-ivory/10 rounded-xl p-6 space-y-8 overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #9CAF88 1px, transparent 1px),
                               radial-gradient(circle at 75% 75%, #B87333 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }} />
          </div>

          {/* How It Works - Visual Workflow */}
          <div className="relative">
            <h3 className="text-sm font-medium text-ivory/60 uppercase tracking-wider mb-6 text-center">How It Works</h3>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
              {/* Step 1: Upload */}
              <div className="flex flex-col items-center text-center w-full md:w-40">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-copper/20 to-copper/5 border border-copper/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <svg className="w-8 h-8 text-copper" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-ivory font-medium text-sm">Upload Documents</span>
                <span className="text-body text-xs mt-1">Contracts, cost sheets</span>
              </div>

              {/* Animated connector 1 */}
              <div className="hidden md:block w-20 h-0.5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-copper/20 via-sage/40 to-sage/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-flow" />
              </div>
              <div className="md:hidden h-8 w-0.5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-copper/20 via-sage/40 to-sage/20" />
              </div>

              {/* Step 2: AI Analysis */}
              <div className="flex flex-col items-center text-center w-full md:w-40">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sage/20 to-sage/5 border border-sage/30 flex items-center justify-center mb-3 relative">
                  <svg className="w-8 h-8 text-sage animate-pulse-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {/* Sparkle effect */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 text-sage/60 animate-sparkle">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                    </svg>
                  </div>
                </div>
                <span className="text-ivory font-medium text-sm">AI Analyzes</span>
                <span className="text-body text-xs mt-1">Extracts pricing patterns</span>
              </div>

              {/* Animated connector 2 */}
              <div className="hidden md:block w-20 h-0.5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-sage/20 via-sage/40 to-copper/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-flow" style={{ animationDelay: '1.5s' }} />
              </div>
              <div className="md:hidden h-8 w-0.5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-sage/20 via-sage/40 to-copper/20" />
              </div>

              {/* Step 3: Generate */}
              <div className="flex flex-col items-center text-center w-full md:w-40">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-copper/20 to-copper/5 border border-copper/30 flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-copper" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-ivory font-medium text-sm">Generate Estimates</span>
                <span className="text-body text-xs mt-1">Instant, accurate quotes</span>
              </div>
            </div>
          </div>

          {/* AI Readiness Section */}
          <div className="relative bg-ivory/5 rounded-xl p-6 border border-ivory/10">
            <h3 className="text-sm font-medium text-ivory/60 uppercase tracking-wider mb-6">AI Readiness</h3>

            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Progress Ring */}
              <div className="relative flex-shrink-0">
                <AIReadinessRing
                  processed={documentStats.processed}
                  total={documentStats.total}
                />
              </div>

              {/* Stats List */}
              <div className="flex-1 space-y-4 w-full">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-ivory/5 transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full bg-copper" />
                  <span className="text-body text-sm flex-1">Documents Uploaded</span>
                  <span className="text-ivory font-medium">{documentStats.total}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-ivory/5 transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full bg-sage" />
                  <span className="text-body text-sm flex-1">Processed & Analyzed</span>
                  <span className="text-ivory font-medium">{documentStats.processed}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-ivory/5 transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full bg-ivory/40 animate-pulse" />
                  <span className="text-body text-sm flex-1">Pending Analysis</span>
                  <span className="text-ivory font-medium">{documentStats.pending}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex justify-end">
            <Link
              to="/dashboard/documents"
              className="px-6 py-3 bg-copper text-obsidian font-medium rounded-lg hover:bg-copper/90 transition-colors inline-flex items-center gap-2 group"
            >
              Manage Documents
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes flow {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes sparkle {
            0%, 100% { opacity: 0.4; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          @keyframes pulse-subtle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          @keyframes ring-fill {
            from { stroke-dashoffset: 283; }
          }
          .animate-flow {
            animation: flow 3s linear infinite;
          }
          .animate-sparkle {
            animation: sparkle 2s ease-in-out infinite;
          }
          .animate-pulse-subtle {
            animation: pulse-subtle 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
}
