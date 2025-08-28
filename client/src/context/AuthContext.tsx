

'use client'

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import axios from "axios";

type AuthState = {
  // Wallet authentication
  address: string | null;
  walletVerified: boolean;
  
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

const AuthContext = createContext<AuthState>({
  address: null,
  walletVerified: false,
  asgardeoUser: null,
  isRegisteredUser: false,
  isFullyAuthenticated: false,
  jwt: null,
  isLoading: false,
  error: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAppKitAccount();
  
  const [auth, setAuth] = useState<AuthState>({
    address: null,
    walletVerified: false,
    asgardeoUser: null,
    isRegisteredUser: false,
    isFullyAuthenticated: false,
    jwt: null,
    isLoading: false,
    error: null,
  });

  // Function to get Asgardeo user info from the client
  const getAsgardeoUserInfo = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        return data.isAuthenticated ? data.user : null;
      }
      return null;
    } catch (error) {
      console.log('No Asgardeo session found:', error);
      return null;
    }
  };

  // Function to validate if wallet address is linked to a registered Asgardeo user
  const validateUserRegistration = async (walletAddress: string, asgardeoUser?: any) => {
    try {
      // First check existing wallet verification
      const walletAuthRes = await axios.get(`http://localhost:8080/api/auth/isauthorized/${walletAddress}`);
      
      // Check if this wallet is linked to a registered user in Asgardeo
      const userValidationRes = await axios.post('http://localhost:8080/api/auth/validate-user', {
        walletAddress,
        asgardeoUserId: asgardeoUser?.sub,
        asgardeoUser
      });
      
      return {
        walletVerified: walletAuthRes.data.verified,
        isRegisteredUser: userValidationRes.data.isRegistered,
        jwt: userValidationRes.data.token || walletAuthRes.data.token,
        userData: userValidationRes.data.userData
      };
    } catch (error) {
      console.error("User validation failed:", error);
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
      setAuth(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Get Asgardeo user info
        const asgardeoUser = await getAsgardeoUserInfo();
        
        if (isConnected && address) {
          // Wallet is connected, now validate user registration
          const validation = await validateUserRegistration(address, asgardeoUser);
          
          setAuth({
            address,
            walletVerified: validation.walletVerified,
            asgardeoUser,
            isRegisteredUser: validation.isRegisteredUser,
            isFullyAuthenticated: validation.walletVerified && validation.isRegisteredUser,
            jwt: validation.jwt,
            isLoading: false,
            error: null,
          });
        } else {
          // No wallet connected
          setAuth({
            address: null,
            walletVerified: false,
            asgardeoUser,
            isRegisteredUser: false,
            isFullyAuthenticated: false,
            jwt: null,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        setAuth(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Authentication failed'
        }));
      }
    }
    
    handleAuthentication();
  }, [address, isConnected]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}