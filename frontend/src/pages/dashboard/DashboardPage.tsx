import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { OnboardingStatus } from '@/hooks/useDashboardData';

export function DashboardPage() {
  const { organization, accessToken } = useAuth();

  const { metrics, onboarding, loading, error } = useDashboardData({
    organizationId: organization?.id,
    accessToken,
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-pulse">
          <div>
            <div className="h-9 bg-ivory/10 rounded w-1/3"></div>
            <div className="h-5 bg-ivory/10 rounded w-1/2 mt-2"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-ivory/5 border border-ivory/10 rounded-xl p-6 h-24"></div>
            <div className="bg-ivory/5 border border-ivory/10 rounded-xl p-6 h-24"></div>
            <div className="bg-ivory/5 border border-ivory/10 rounded-xl p-6 h-24"></div>
          </div>
          <div className="bg-ivory/5 border border-ivory/10 rounded-xl p-6 h-64"></div>
        </div>
      </DashboardLayout>
    );
  }

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

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-ivory/5 border border-ivory/10 rounded-xl p-6">
            <div className="text-2xl font-display text-copper">{metrics.documentsCount}</div>
            <div className="text-sm text-body mt-1">Documents Uploaded</div>
          </div>
          <div className="bg-ivory/5 border border-ivory/10 rounded-xl p-6">
            <div className="text-2xl font-display text-copper">{metrics.laborItemsCount}</div>
            <div className="text-sm text-body mt-1">Labor Items</div>
          </div>
          <div className="bg-ivory/5 border border-ivory/10 rounded-xl p-6">
            <div className="text-2xl font-display text-copper">{metrics.estimatesCount}</div>
            <div className="text-sm text-body mt-1">Estimates Generated</div>
          </div>
        </div>

        {/* Getting started */}
        <GettingStartedSection onboarding={onboarding} />
      </div>
    </DashboardLayout>
  );
}

interface GettingStartedSectionProps {
  onboarding: OnboardingStatus;
}

function GettingStartedSection({ onboarding }: GettingStartedSectionProps) {
  const steps = [
    {
      number: 1,
      complete: onboarding.profileComplete,
      title: 'Complete your company profile',
      description: 'Add your company information, logo, and brand colors.',
    },
    {
      number: 2,
      complete: onboarding.documentsUploaded,
      title: 'Upload your documents',
      description: 'Upload contracts, cost sheets, and addendums.',
    },
    {
      number: 3,
      complete: onboarding.documentsProcessed,
      title: 'Documents processed',
      description: 'Wait for AI to extract pricing data from your documents.',
    },
    {
      number: 4,
      complete: onboarding.pricingComplete,
      title: 'Configure pricing rules',
      description: 'Set up your labor rates, overhead, and profit margins.',
    },
  ];

  return (
    <div className="bg-ivory/5 border border-ivory/10 rounded-xl p-6">
      <h2 className="font-display text-xl text-ivory mb-4">Getting Started</h2>
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.number} className="flex items-start gap-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.complete ? 'bg-copper/20 text-copper' : 'bg-signal/20 text-signal'
              }`}
            >
              {step.complete ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <div>
              <h3 className="text-ivory font-medium">{step.title}</h3>
              <p className="text-body text-sm mt-1">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
