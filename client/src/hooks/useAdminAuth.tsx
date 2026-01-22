import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createAdminAuditLog, AdminAuditActions, AdminResourceTypes } from '@/services/adminAuditLog';

interface AdminUser {
  id: string;
  username: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  sessionTimeLeft: number; // in seconds
  resetSessionTimer: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_TOKEN_KEY = 'arx_admin_token';
const ADMIN_LAST_ACTIVITY_KEY = 'arx_admin_last_activity';
const SESSION_TIMEOUT_MINUTES = 30; // Session timeout in minutes
const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;
const SESSION_WARNING_THRESHOLD = 5 * 60; // Show warning when 5 minutes left

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(SESSION_TIMEOUT_MINUTES * 60);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Reset the session timer
  const resetSessionTimer = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, now.toString());
    setSessionTimeLeft(SESSION_TIMEOUT_MINUTES * 60);
  }, []);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // Logout with optional reason
  const performLogout = useCallback(async (reason?: 'manual' | 'timeout') => {
    const currentAdmin = admin;
    
    clearTimers();
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
    setAdmin(null);
    setSessionTimeLeft(0);

    // Log the logout action
    if (currentAdmin) {
      try {
        await createAdminAuditLog({
          adminId: currentAdmin.id,
          adminUsername: currentAdmin.username,
          action: reason === 'timeout' ? AdminAuditActions.SESSION_TIMEOUT : AdminAuditActions.LOGOUT,
          resourceType: AdminResourceTypes.ADMIN_SESSION,
          details: { reason: reason || 'manual' }
        });
      } catch (err) {
        console.error('Failed to log admin logout:', err);
      }
    }
  }, [admin, clearTimers]);

  // Start session monitoring
  const startSessionMonitoring = useCallback(() => {
    clearTimers();

    // Update countdown every second
    countdownRef.current = setInterval(() => {
      const lastActivity = localStorage.getItem(ADMIN_LAST_ACTIVITY_KEY);
      if (!lastActivity) {
        performLogout('timeout');
        return;
      }

      const elapsed = Date.now() - parseInt(lastActivity, 10);
      const remaining = Math.max(0, SESSION_TIMEOUT_MS - elapsed);
      const remainingSeconds = Math.floor(remaining / 1000);
      
      setSessionTimeLeft(remainingSeconds);

      // Check for session timeout
      if (remaining <= 0) {
        performLogout('timeout');
      }
    }, 1000);
  }, [clearTimers, performLogout]);

  // Activity tracker - reset timer on user activity
  useEffect(() => {
    if (!admin) return;

    const handleActivity = () => {
      resetSessionTimer();
    };

    // Track various user activities
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [admin, resetSessionTimer]);

  // Check for existing admin token on mount
  useEffect(() => {
    const checkAdminAuth = async () => {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Check if session has expired based on last activity
      const lastActivity = localStorage.getItem(ADMIN_LAST_ACTIVITY_KEY);
      if (lastActivity) {
        const elapsed = Date.now() - parseInt(lastActivity, 10);
        if (elapsed >= SESSION_TIMEOUT_MS) {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
          setIsLoading(false);
          return;
        }
      }

      try {
        const { data, error } = await supabase.functions.invoke('admin-login', {
          body: { action: 'verify', token }
        });

        if (error || !data?.valid) {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
          setAdmin(null);
        } else {
          setAdmin(data.admin);
          resetSessionTimer();
          startSessionMonitoring();
        }
      } catch (err) {
        console.error('Admin auth check failed:', err);
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
        setAdmin(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();

    return () => {
      clearTimers();
    };
  }, []);

  // Start monitoring when admin changes
  useEffect(() => {
    if (admin) {
      startSessionMonitoring();
    } else {
      clearTimers();
    }
  }, [admin, startSessionMonitoring, clearTimers]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-login', {
        body: { action: 'login', username, password }
      });

      if (error) {
        return { success: false, error: 'Authentication failed' };
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Invalid credentials' };
      }

      // Store token and set admin state
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      setAdmin(data.admin);
      resetSessionTimer();
      startSessionMonitoring();

      // Log the login action
      try {
        await createAdminAuditLog({
          adminId: data.admin.id,
          adminUsername: data.admin.username,
          action: AdminAuditActions.LOGIN,
          resourceType: AdminResourceTypes.ADMIN_SESSION,
          details: { 
            loginTime: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        });
      } catch (err) {
        console.error('Failed to log admin login:', err);
      }
      
      return { success: true };
    } catch (err) {
      console.error('Admin login error:', err);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = useCallback(() => {
    performLogout('manual');
  }, [performLogout]);

  return (
    <AdminAuthContext.Provider value={{
      admin,
      isLoading,
      isAuthenticated: !!admin,
      login,
      logout,
      sessionTimeLeft,
      resetSessionTimer
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

// Format session time for display
export function formatSessionTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export { SESSION_WARNING_THRESHOLD };
