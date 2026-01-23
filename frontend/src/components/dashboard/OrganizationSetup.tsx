import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { DashboardLayout } from './DashboardLayout';

export function OrganizationSetup() {
  const { accessToken, setOrganization } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !accessToken) return;

    setLoading(true);
    setError('');

    try {
      const response = await authApi.initializeOrganization(orgName.trim(), accessToken);
      setOrganization(response.organization);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto">
        <div className="bg-ivory/5 border border-ivory/10 rounded-xl p-8">
          <h2 className="font-display text-2xl text-ivory mb-2">Organization Setup</h2>
          <p className="text-body mb-6">Create your organization to get started.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="orgName" className="block text-sm text-ivory/80 mb-2">
                Organization Name
              </label>
              <input
                id="orgName"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Your Company LLC"
                className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !orgName.trim()}
              className="w-full px-4 py-3 bg-copper text-obsidian font-medium rounded-lg hover:bg-copper/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
