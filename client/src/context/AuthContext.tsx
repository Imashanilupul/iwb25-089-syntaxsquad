

'use client'

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import axios from "axios";

type AuthState = {
  // Wallet authentication
  address: string | null;
  walletVerified: boolean;
  verified: boolean; // Legacy compatibility property
  isAdmin: boolean; // Admin user check for admin portal access
  
  // Asgardeo user validation
  asgardeoUser: any | null;
  isRegisteredUser: boolean;
  
  // Combined authentication state
  isFullyAuthenticated: boolean;
  jwt: string | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
};

type AuthContextType = AuthState & {
  clearAuthState: () => void;
  debugAuthState: () => void;
  refreshAsgardeoSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  address: null,
  walletVerified: false,
  verified: false,
  isAdmin: false,
  asgardeoUser: null,
  isRegisteredUser: false,
  isFullyAuthenticated: false,
  jwt: null,
  isLoading: false,
  error: null,
  clearAuthState: () => {},
  debugAuthState: () => {},
  refreshAsgardeoSession: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAppKitAccount();
  
  // Default auth state - consistent for SSR
  const defaultAuthState: AuthState = {
    address: null,
    walletVerified: false,
    verified: false,
    isAdmin: false,
    asgardeoUser: null,
    isRegisteredUser: false,
    isFullyAuthenticated: false,
    jwt: null,
    isLoading: false,
    error: null,
  };
  
  // Initialize with default state for SSR consistency
  const [auth, setAuth] = useState<AuthState>(defaultAuthState);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Restore from localStorage after hydration
  useEffect(() => {
    setIsHydrated(true);
    
    try {
      const savedAuth = localStorage.getItem('adminAuthState');
      if (savedAuth) {
        const parsedAuth = JSON.parse(savedAuth);
        // Only restore if it's not expired (check if saved within last 24 hours)
        const saveTime = localStorage.getItem('adminAuthStateTime');
        if (saveTime && Date.now() - parseInt(saveTime) < 24 * 60 * 60 * 1000) {
          setAuth({
            ...parsedAuth,
            isLoading: true, // Still set loading to true to revalidate
            error: null,
          });
        }
      }
    } catch (error) {
      console.error('Failed to restore auth state:', error);
    }
  }, []);

  // Function to save auth state to localStorage
  const saveAuthState = (authState: AuthState) => {
    if (!isHydrated) return; // Don't save until hydrated
    
    try {
      // Only save if fully authenticated to avoid storing incomplete states
      if (authState.isFullyAuthenticated) {
        localStorage.setItem('adminAuthState', JSON.stringify({
          address: authState.address,
          walletVerified: authState.walletVerified,
          verified: authState.verified,
          isAdmin: authState.isAdmin,
          asgardeoUser: authState.asgardeoUser,
          isRegisteredUser: authState.isRegisteredUser,
          isFullyAuthenticated: authState.isFullyAuthenticated,
          jwt: authState.jwt,
        }));
        localStorage.setItem('adminAuthStateTime', Date.now().toString());
      } else {
        // Clear saved state if not fully authenticated
        localStorage.removeItem('adminAuthState');
        localStorage.removeItem('adminAuthStateTime');
      }
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  };

  // Function to clear saved auth state
  const clearSavedAuthState = () => {
    if (!isHydrated) return; // Don't clear until hydrated
    
  console.debug('AuthContext: Clearing all saved authentication state');
    localStorage.removeItem('adminAuthState');
    localStorage.removeItem('adminAuthStateTime');
    localStorage.removeItem('oauth_completed');
    
    // Reset auth state to default
    setAuth(defaultAuthState);
  };

  // Function to get Asgardeo user info from the client
  const getAsgardeoUserInfo = async () => {
    try {
      console.log('🔍 AuthContext: Checking for Asgardeo session...')
      console.log('🍪 AuthContext: Current cookies:', document.cookie)
      
      // Quick check if we have a session cookie
      const hasSessionCookie = document.cookie.includes('asgardeo_session')
      console.log('🍪 AuthContext: Has session cookie:', hasSessionCookie)
      
      if (!hasSessionCookie) {
        console.log('❌ AuthContext: No session cookie found, skipping API call')
        return null
      }
      
      console.log('📡 AuthContext: Session cookie found, fetching Asgardeo user info...')
      const response = await fetch('/api/auth/me')
      console.log('📡 AuthContext: /api/auth/me response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📡 AuthContext: /api/auth/me response data:', data)
        return data.isAuthenticated ? data.user : null
      }
      console.log('❌ AuthContext: /api/auth/me request failed, status:', response.status)
      return null
    } catch (error) {
      console.log('❌ AuthContext: Error fetching Asgardeo session:', error)
      return null
    }
  };

  // Function to check if wallet address is authorized on blockchain
  const validateUserRegistration = async (walletAddress: string, asgardeoUser?: any) => {
    try {
  console.debug('AuthContext: Checking blockchain authorization for wallet:', walletAddress);
      
      // Call the /is-authorized endpoint to check if user is authorized on blockchain
      const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
      const authRes = await axios.get(`${API_BASE_URL}/auth/is-authorized/${walletAddress}`);
      
      const isAuthorized = authRes.data.isAuthorized;
      
      // Check if user is admin (for admin portal access)
      let isAdmin = false;
      try {
        const adminRes = await axios.get(`${API_BASE_URL}/auth/is-admin/${walletAddress}`);
        isAdmin = adminRes.data.isAdmin;
  console.debug('AuthContext: Admin check result:', isAdmin);
      } catch (error) {
        console.error('AuthContext: Admin check failed:', error);
        isAdmin = false;
      }
      
      const result = {
        walletVerified: isAuthorized,
        isRegisteredUser: isAuthorized, // For blockchain auth, registered = authorized
        isAdmin: isAdmin,
      };
      
  console.debug('AuthContext: Blockchain authorization result:', result);
      return result;
    } catch (error) {
      console.error("AuthContext: Blockchain authorization check failed:", error);
      return {
        walletVerified: false,
        isRegisteredUser: false,
        isAdmin: false,
        jwt: null,
        userData: null
      };
    }
  };

  // Main authentication function
  const handleAuthentication = async () => {
  console.debug('AuthContext: Starting blockchain authentication process...');
    setAuth(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      if (isConnected && address) {
  console.debug('AuthContext: Wallet connected, checking blockchain authorization...');
        // Only check blockchain authorization (no Asgardeo for main portal)
        const validation = await validateUserRegistration(address);
        
        const newAuthState = {
          address,
          walletVerified: validation.walletVerified,
          verified: validation.walletVerified, // Legacy compatibility
          isAdmin: validation.isAdmin,
          asgardeoUser: null, // No Asgardeo for main portal
          isRegisteredUser: validation.isRegisteredUser,
          isFullyAuthenticated: validation.walletVerified && validation.isRegisteredUser,
          jwt: null,
          isLoading: false,
          error: null,
        };
        
  console.debug('AuthContext: Setting new auth state:', newAuthState);
        setAuth(newAuthState);
        saveAuthState(newAuthState);
      } else {
  console.debug('AuthContext: No wallet connected, clearing auth state');
        // No wallet connected - clear auth state
        const newAuthState = {
          address: null,
          walletVerified: false,
          verified: false, // Legacy compatibility
          isAdmin: false,
          asgardeoUser: null,
          isRegisteredUser: false,
          isFullyAuthenticated: false,
          jwt: null,
          isLoading: false,
          error: null,
        };
        
        setAuth(newAuthState);
      }
    } catch (error) {
  console.error('AuthContext: Authentication error:', error);
      setAuth(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }));
    }
  };

  // Effect to monitor OAuth completion and refresh auth state
  useEffect(() => {
    if (!isHydrated) return;
    
    // Check if OAuth was recently completed
    const oauthCompleted = localStorage.getItem('oauth_completed');
    if (oauthCompleted) {
      const completedTime = parseInt(oauthCompleted);
      const now = Date.now();
      
      // If OAuth was completed within the last 30 seconds, refresh auth state
      if (now - completedTime < 30000) {
  console.debug('AuthContext: Detected recent OAuth completion, refreshing auth state...');
        
        // Clear the flag
        localStorage.removeItem('oauth_completed');
        
        // Trigger auth state refresh after a short delay to ensure cookie is set
        const refreshTimer = setTimeout(() => {
          handleAuthentication();
        }, 1000);
        
        return () => clearTimeout(refreshTimer);
      } else {
        // Clear old flag
        localStorage.removeItem('oauth_completed');
      }
    }
  }, [isHydrated]);

  useEffect(() => {
    // Only run if hydrated to avoid SSR issues
    if (isHydrated) {
      handleAuthentication();
    }
  }, [address, isConnected, isHydrated]);

  // Function to debug current auth state
  const debugAuthState = () => {
    if (!isHydrated) {
  console.debug('🔍 Auth State (not hydrated yet):', auth);
      return;
    }
    
  console.debug('🔍 Current Auth State:', auth);
  console.debug('💾 Saved Auth State:', localStorage.getItem('adminAuthState'));
  console.debug('🕒 Save Time:', localStorage.getItem('adminAuthStateTime'));
  };

  // Manual function to refresh Asgardeo session (useful after OAuth returns)
  const refreshAsgardeoSession = async () => {
    console.debug('AuthContext: Manually refreshing Asgardeo session...');
    const user = await getAsgardeoUserInfo();
    if (user) {
      setAuth(prevAuth => ({
        ...prevAuth,
        asgardeoUser: user
      }));
      console.debug('AuthContext: Session refresh successful, user:', user);
      return true;
    } else {
      console.debug('AuthContext: Session refresh failed - no user found');
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      ...auth,
      clearAuthState: clearSavedAuthState,
      debugAuthState,
      refreshAsgardeoSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}