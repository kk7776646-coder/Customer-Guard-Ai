import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, type UserProfile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<{ data?: any; error: AuthError | Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ data?: any; error: AuthError | Error | null; isPendingVerification?: boolean }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  clearPasswordRecoveryFlag: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  // Fetch or construct profile
  const fetchProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }

    try {
      // 1. Try fetching from public.profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as UserProfile);
        return;
      }

      // 2. If table is not yet created or row not found, build profile from Auth metadata
      const meta = currentUser.user_metadata || {};
      const fallbackProfile: UserProfile = {
        id: currentUser.id,
        full_name: meta.full_name || meta.name || currentUser.email?.split('@')[0] || 'User',
        email: currentUser.email || null,
        avatar_url: meta.avatar_url || null,
        role: meta.role || 'Customer Retention Lead',
        bio: meta.bio || 'Managing customer churn risk and revenue optimization with Clario.',
        phone: meta.phone || null,
        username: meta.username || currentUser.email?.split('@')[0] || 'user',
        created_at: currentUser.created_at,
        updated_at: currentUser.updated_at,
      };

      setProfile(fallbackProfile);

      // Attempt background upsert if table exists
      try {
        await supabase.from('profiles').upsert(
          {
            id: currentUser.id,
            full_name: fallbackProfile.full_name,
            email: fallbackProfile.email,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch {
        // Table might not exist yet; safe to ignore
      }
    } catch (err) {
      console.warn('[Clario Auth] Could not fetch profile table, using metadata:', err);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Check if current URL is a password recovery link
    if (window.location.hash.includes('type=recovery')) {
      setIsPasswordRecovery(true);
    }

    // 1. Initial Session Retrieval
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!mounted) return;
      if (error) {
        console.error('[Clario Auth] Session error:', error);
      }
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchProfile(initialSession.user);
      }
      setLoading(false);
    });

    // 2. Real-time Auth State Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchProfile(newSession.user);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign In
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        await fetchProfile(data.user);
      }

      return { data, error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Sign Up
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            name: fullName.trim(),
          },
        },
      });

      if (error) {
        return { error };
      }

      // Check if email confirmation is required (user has identities or session is null)
      const isPendingVerification = !!data.user && !data.session;

      if (data.user && data.session) {
        await fetchProfile(data.user);
      }

      return { data, error: null, isPendingVerification };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsPasswordRecovery(false);
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Reset Password Request (send recovery email)
  const resetPasswordForEmail = async (email: string) => {
    try {
      const redirectUrl = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Update Password (set new password)
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (!error) {
        setIsPasswordRecovery(false);
      }
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Update Profile Data
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      // 1. Update Auth User Metadata
      const { error: userError } = await supabase.auth.updateUser({
        data: {
          full_name: updates.full_name,
          avatar_url: updates.avatar_url,
          bio: updates.bio,
          phone: updates.phone,
          role: updates.role,
        },
      });

      if (userError) {
        console.warn('[Clario Auth] Could not update user metadata:', userError);
      }

      // 2. Update public.profiles table if exists
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.warn('[Clario Auth] Profiles table update notice:', profileError.message);
      }

      // Update local state
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  const clearPasswordRecoveryFlag = () => {
    setIsPasswordRecovery(false);
    if (window.location.hash.includes('type=recovery')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isPasswordRecovery,
        signIn,
        signUp,
        signOut,
        resetPasswordForEmail,
        updatePassword,
        updateProfile,
        refreshProfile,
        clearPasswordRecoveryFlag,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
