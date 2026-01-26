import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface SignupResult {
  requiresEmailConfirmation: boolean;
}

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, organizationName: string) => Promise<SignupResult>;
  logout: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  setOrganization: (org: Organization | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch organization data from backend
  const fetchOrganization = async (token: string): Promise<Organization | null> => {
    try {
      const response = await authApi.me(token) as {
        user: User;
        organization: Organization | null;
      };
      return response.organization;
    } catch (error) {
      console.error('Failed to fetch organization:', error);
      return null;
    }
  };

  useEffect(() => {
    // Skip auth setup if Supabase isn't configured
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Check for existing session on load
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase!.auth.getSession();

        if (session?.user && session.access_token) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          });
          setAccessToken(session.access_token);

          // Fetch org data from backend
          const org = await fetchOrganization(session.access_token);
          setOrganization(org);
        }
      } catch (error) {
        console.error('Session initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setOrganization(null);
          setAccessToken(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          });
          setAccessToken(session.access_token);

          // Fetch org data
          const org = await fetchOrganization(session.access_token);
          setOrganization(org);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Update access token when refreshed
          setAccessToken(session.access_token);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Authentication is not configured. Please set up Supabase environment variables.');
    }

    // Call Supabase directly
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Login failed - no user data returned');
    }

    // Set user immediately from Supabase response
    setUser({
      id: data.user.id,
      email: data.user.email || '',
    });
    setAccessToken(data.session.access_token);

    // Fetch organization from backend
    const org = await fetchOrganization(data.session.access_token);
    setOrganization(org);
  };

  const signup = async (email: string, password: string, organizationName: string): Promise<SignupResult> => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Authentication is not configured. Please set up Supabase environment variables.');
    }

    // Step 1: Create user in Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Signup failed - no user data returned');
    }

    // Check if email confirmation is required
    if (!data.session) {
      // Email confirmation required - return status instead of throwing error
      return { requiresEmailConfirmation: true };
    }

    // Step 2: Set user state
    setUser({
      id: data.user.id,
      email: data.user.email || '',
    });
    setAccessToken(data.session.access_token);

    // Step 3: Initialize organization via backend
    try {
      const orgResponse = await authApi.initializeOrganization(
        organizationName,
        data.session.access_token
      );
      setOrganization(orgResponse.organization);
    } catch (orgError) {
      // Log error but don't fail signup - user can create org later
      console.error('Failed to initialize organization:', orgError);
    }

    return { requiresEmailConfirmation: false };
  };

  const resendConfirmation = async (email: string): Promise<void> => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Authentication is not configured. Please set up Supabase environment variables.');
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setOrganization(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        accessToken,
        loading,
        login,
        signup,
        logout,
        resendConfirmation,
        setOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
