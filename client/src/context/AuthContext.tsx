

'use client'

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import axios from "axios";

type AuthState = {
  // Wallet authentication
  address: string | null;
  walletVerified: boolean;
  verified: boolean; // Legacy compatibility property
  
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
};

const AuthContext = createContext<AuthContextType>({
  address: null,
  walletVerified: false,
  verified: false,
  asgardeoUser: null,
  isRegisteredUser: false,
  isFullyAuthenticated: false,
  jwt: null,
  isLoading: false,
  error: null,
  clearAuthState: () => {},
  debugAuthState: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAppKitAccount();
  
  // Default auth state - consistent for SSR
  const defaultAuthState: AuthState = {
    address: null,
    walletVerified: false,
    verified: false,
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
    
    console.log('AuthContext: Clearing all saved authentication state');
    localStorage.removeItem('adminAuthState');
    localStorage.removeItem('adminAuthStateTime');
    localStorage.removeItem('oauth_completed');
    
    // Reset auth state to default
    setAuth(defaultAuthState);
  };

  // Function to get Asgardeo user info from the client
  const getAsgardeoUserInfo = async () => {
    try {
      // Quick check if we have a session cookie
      const hasSessionCookie = document.cookie.includes('asgardeo_session');
      if (!hasSessionCookie) {
        console.log('AuthContext: No session cookie found, skipping API call');
        return null;
      }
      
      console.log('AuthContext: Session cookie found, fetching Asgardeo user info...');
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        console.log('AuthContext: Asgardeo user data:', data);
        return data.isAuthenticated ? data.user : null;
      }
      console.log('AuthContext: No valid Asgardeo session');
      return null;
    } catch (error) {
      console.log('AuthContext: No Asgardeo session found:', error);
      return null;
    }
  };

  // Function to validate if wallet address is linked to a registered Asgardeo user
  const validateUserRegistration = async (walletAddress: string, asgardeoUser?: any) => {
    try {
      console.log('AuthContext: Validating user registration for wallet:', walletAddress);
      // First check existing wallet verification
      const walletAuthRes = await axios.get(`http://localhost:8080/api/auth/isauthorized/${walletAddress}`);
      
      // Check if this wallet is linked to a registered user in Asgardeo
      const userValidationRes = await axios.post('http://localhost:8080/api/auth/validate-user', {
        walletAddress,
        asgardeoUserId: asgardeoUser?.sub,
        asgardeoUser
      });
      
      const result = {
        walletVerified: walletAuthRes.data.verified,
        isRegisteredUser: userValidationRes.data.isRegistered,
        jwt: userValidationRes.data.token || walletAuthRes.data.token,
        userData: userValidationRes.data.userData
      };
      
      console.log('AuthContext: User validation result:', result);
      return result;
    } catch (error) {
      console.error("AuthContext: User validation failed:", error);
      return {
        walletVerified: false,
        isRegisteredUser: false,
        jwt: null,
        userData: null
      };
    }
  };

  useEffect(() => {
    async function handleAuthentication() {
      console.log('AuthContext: Starting authentication process...');
      setAuth(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Get Asgardeo user info
        const asgardeoUser = await getAsgardeoUserInfo();
        
        if (isConnected && address) {
          console.log('AuthContext: Wallet connected, validating user...');
          // Wallet is connected, now validate user registration
          const validation = await validateUserRegistration(address, asgardeoUser);
          
          const newAuthState = {
            address,
            walletVerified: validation.walletVerified,
            verified: validation.walletVerified, // Legacy compatibility
            asgardeoUser,
            isRegisteredUser: validation.isRegisteredUser,
            isFullyAuthenticated: validation.walletVerified && validation.isRegisteredUser,
            jwt: validation.jwt,
            isLoading: false,
            error: null,
          };
          
          console.log('AuthContext: Setting new auth state:', newAuthState);
          setAuth(newAuthState);
          saveAuthState(newAuthState);
        } else {
          console.log('AuthContext: No wallet connected, clearing auth state');
          // No wallet connected - clear saved auth state
          clearSavedAuthState();
          
          const newAuthState = {
            address: null,
            walletVerified: false,
            verified: false, // Legacy compatibility
            asgardeoUser,
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
        clearSavedAuthState(); // Clear saved state on error
        setAuth(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Authentication failed'
        }));
      }
    }
    
    // Only run if hydrated to avoid SSR issues
    if (isHydrated) {
      handleAuthentication();
    }
  }, [address, isConnected, isHydrated]);

  // Function to debug current auth state
  const debugAuthState = () => {
    if (!isHydrated) {
      console.log('🔍 Auth State (not hydrated yet):', auth);
      return;
    }
    
    console.log('🔍 Current Auth State:', auth);
    console.log('💾 Saved Auth State:', localStorage.getItem('adminAuthState'));
    console.log('🕒 Save Time:', localStorage.getItem('adminAuthStateTime'));
  };

  return (
    <AuthContext.Provider value={{
      ...auth,
      clearAuthState: clearSavedAuthState,
      debugAuthState
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}