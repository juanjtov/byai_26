import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout, OrganizationSetup } from '@/components/dashboard';
import { ChatInterface } from '@/components/chat';

export function ChatPage() {
  const { organization, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-ivory/10 rounded w-1/3"></div>
          <div className="h-[600px] bg-ivory/10 rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!organization) {
    return <OrganizationSetup />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-ivory">AI Estimator</h1>
          <p className="mt-2 text-body">
            Chat with REMODLY AI to generate project estimates based on your pricing and documents.
          </p>
        </div>
        <ChatInterface />
      </div>
    </DashboardLayout>
  );
}
