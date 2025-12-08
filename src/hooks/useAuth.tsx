import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const signOut = async () => {
    try {
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Ignore errors
      }
      // Use window.location only for logout to ensure complete cleanup
      window.location.replace('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // First, clear any potentially corrupted sessions
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error('Auth session error:', error);
            // Check for specific refresh token errors or 500 errors
            if (error.message?.includes('oauth_client_id') || 
                error.message?.includes('refresh_token') ||
                error.message?.includes('missing destination') ||
                (error as any)?.status === 500) {
              console.warn('Session corrupted, clearing auth state and signing out');
              cleanupAuthState();
              try {
                await supabase.auth.signOut({ scope: 'local' });
              } catch (e) {
                // Ignore signout errors
              }
            }
            setSession(null);
            setUser(null);
          } else {
            setSession(session);
            setUser(session?.user ?? null);
          }
          setLoading(false);
        }
      } catch (error: any) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          // Handle refresh token errors gracefully
          if (error?.message?.includes('oauth_client_id') || 
              error?.message?.includes('missing destination') ||
              error?.status === 500) {
            console.warn('Auth error detected, clearing corrupted session');
            cleanupAuthState();
            try {
              await supabase.auth.signOut({ scope: 'local' });
            } catch (e) {
              // Ignore signout errors
            }
          }
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          // Handle token refresh errors or sign out events
          if (event === 'TOKEN_REFRESHED' && !session) {
            console.warn('Token refresh failed, clearing session');
            cleanupAuthState();
          }
          if (event === 'SIGNED_OUT') {
            cleanupAuthState();
          }
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
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