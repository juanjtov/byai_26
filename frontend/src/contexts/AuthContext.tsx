import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
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

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, organizationName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
          setAccessToken(session.access_token);

          // Get user info from backend
          const response = await authApi.me(session.access_token) as {
            user: User;
            organization: Organization | null;
          };

          setUser(response.user);
          setOrganization(response.organization);
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setOrganization(null);
          setAccessToken(null);
        } else if (session?.access_token) {
          setAccessToken(session.access_token);

          try {
            const response = await authApi.me(session.access_token) as {
              user: User;
              organization: Organization | null;
            };
            setUser(response.user);
            setOrganization(response.organization);
          } catch (error) {
            console.error('Failed to get user info:', error);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password) as {
      user: User;
      organization: Organization | null;
      session: { access_token: string; refresh_token: string };
    };

    // Set the session in Supabase client
    await supabase.auth.setSession({
      access_token: response.session.access_token,
      refresh_token: response.session.refresh_token,
    });

    setUser(response.user);
    setOrganization(response.organization);
    setAccessToken(response.session.access_token);
  };

  const signup = async (email: string, password: string, organizationName: string) => {
    const response = await authApi.signup(email, password, organizationName) as {
      user: User;
      organization: Organization | null;
      session: { access_token: string; refresh_token: string } | null;
    };

    if (response.session) {
      await supabase.auth.setSession({
        access_token: response.session.access_token,
        refresh_token: response.session.refresh_token,
      });

      setUser(response.user);
      setOrganization(response.organization);
      setAccessToken(response.session.access_token);
    }
  };

  const logout = async () => {
    if (accessToken) {
      try {
        await authApi.logout(accessToken);
      } catch (error) {
        console.error('Logout API call failed:', error);
      }
    }

    await supabase.auth.signOut();
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
