import { useState, useEffect, useCallback } from 'react';
import { organizationApi, documentApi, chatApi } from '@/lib/api';

export interface DashboardMetrics {
  documentsCount: number;
  laborItemsCount: number;
  estimatesCount: number;
}

export interface OnboardingStatus {
  profileComplete: boolean;
  documentsUploaded: boolean;
  documentsProcessed: boolean;
  pricingComplete: boolean;
}

interface UseDashboardDataParams {
  organizationId: string | undefined;
  accessToken: string | null;
}

interface UseDashboardDataResult {
  metrics: DashboardMetrics;
  onboarding: OnboardingStatus;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardData({
  organizationId,
  accessToken,
}: UseDashboardDataParams): UseDashboardDataResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    documentsCount: 0,
    laborItemsCount: 0,
    estimatesCount: 0,
  });
  const [onboarding, setOnboarding] = useState<OnboardingStatus>({
    profileComplete: false,
    documentsUploaded: false,
    documentsProcessed: false,
    pricingComplete: false,
  });

  const fetchData = useCallback(async () => {
    if (!organizationId || !accessToken) return;

    setError(null);

    try {
      // Parallel fetch all required data
      const [profile, pricing, laborItems, documents, conversations] = await Promise.all([
        organizationApi.getProfile(organizationId, accessToken),
        organizationApi.getPricing(organizationId, accessToken),
        organizationApi.getLaborItems(organizationId, accessToken),
        documentApi.list(organizationId, accessToken),
        chatApi.listConversations(organizationId, true, accessToken),
      ]);

      // Type assertions
      const profileData = profile as { company_name: string | null };
      const pricingData = pricing as { labor_rate_per_hour: number | null };
      const laborItemsData = laborItems as Array<{ id: string }>;
      const documentsData = documents as Array<{ id: string; status: string }>;
      const conversationsData = conversations as Array<{ id: string }>;

      // Calculate metrics
      setMetrics({
        documentsCount: documentsData.length,
        laborItemsCount: laborItemsData.length,
        estimatesCount: conversationsData.length,
      });

      // Calculate onboarding status
      setOnboarding({
        profileComplete: profileData.company_name !== null,
        documentsUploaded: documentsData.length > 0,
        documentsProcessed: documentsData.some((doc) => doc.status === 'processed'),
        pricingComplete: pricingData.labor_rate_per_hour !== null && laborItemsData.length > 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [organizationId, accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    if (!organizationId) {
      setLoading(false);
      return;
    }

    fetchData();
  }, [organizationId, accessToken, fetchData]);

  return {
    metrics,
    onboarding,
    loading,
    error,
    refetch: fetchData,
  };
}
