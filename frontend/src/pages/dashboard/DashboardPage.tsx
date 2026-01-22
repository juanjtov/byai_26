import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard';

export function DashboardPage() {
  const { organization } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-ivory">
            Welcome to {organization?.name || 'your dashboard'}
          </h1>
          <p className="mt-2 text-body">
            Manage your company profile, documents, and pricing rules.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-ivory/5 border border-ivory/10 rounded-xl p-6">
            <div className="text-2xl font-display text-copper">0</div>
            <div className="text-sm text-body mt-1">Documents Uploaded</div>
          </div>
          <div className="bg-ivory/5 border border-ivory/10 rounded-xl p-6">
            <div className="text-2xl font-display text-copper">0</div>
            <div className="text-sm text-body mt-1">Labor Items</div>
          </div>
          <div className="bg-ivory/5 border border-ivory/10 rounded-xl p-6">
            <div className="text-2xl font-display text-copper">0</div>
            <div className="text-sm text-body mt-1">Estimates Generated</div>
          </div>
        </div>

        {/* Getting started */}
        <div className="bg-ivory/5 border border-ivory/10 rounded-xl p-6">
          <h2 className="font-display text-xl text-ivory mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-copper/20 flex items-center justify-center text-copper flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-ivory font-medium">Complete your company profile</h3>
                <p className="text-body text-sm mt-1">
                  Add your company information, logo, and brand colors.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-ivory/10 flex items-center justify-center text-ivory/60 flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-ivory font-medium">Upload your documents</h3>
                <p className="text-body text-sm mt-1">
                  Upload contracts, cost sheets, and addendums to train the system.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-ivory/10 flex items-center justify-center text-ivory/60 flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-ivory font-medium">Configure pricing rules</h3>
                <p className="text-body text-sm mt-1">
                  Set up your labor rates, overhead, and profit margins.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
