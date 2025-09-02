'use client'

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import axios from "axios";
import { EnhancedAuthService } from "@/services/enhanced-auth";

const BALLERINA_BASE_URL = process.env.NEXT_PUBLIC_BALLERINA_BASE_URL || 'http://localhost:8080';

type AuthState = {
  // Wallet authentication
  address: string | null;
  walletVerified: boolean;
  verified: boolean; // Legacy compatibility property
  
  // Asgardeo user validation
  asgardeoUser: any | null;
  isRegisteredUser: boolean;
  
  // Enhanced security: wallet-user binding
  walletUserBindingValid: boolean;
  bindingError: string | null;
  
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
  verified: false,
  asgardeoUser: null,
  isRegisteredUser: false,
  walletUserBindingValid: false,
  bindingError: null,
  isFullyAuthenticated: false,
  jwt: null,
  isLoading: false,
  error: null,
});

export function EnhancedAuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAppKitAccount();
  
  const [auth, setAuth] = useState<AuthState>({
    address: null,
    walletVerified: false,
    verified: false,
    asgardeoUser: null,
    isRegisteredUser: false,
    walletUserBindingValid: false,
    bindingError: null,
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

  // Enhanced validation that includes wallet-user binding check
  const validateUserAuthentication = async (walletAddress: string, asgardeoUser?: any) => {
    try {
      // Step 1: Check basic wallet verification
      const walletAuthRes = await axios.get(`${BALLERINA_BASE_URL}/api/auth/isauthorized/${walletAddress}`);
      const walletVerified = walletAuthRes.data.verified;

      if (!walletVerified) {
        return {
          walletVerified: false,
          isRegisteredUser: false,
          walletUserBindingValid: false,
          bindingError: 'Wallet not authorized on blockchain',
          jwt: null,
          userData: null
        };
      }

      // Step 2: If Asgardeo user exists, validate wallet-user binding
      let walletUserBindingValid = true;
      let bindingError = null;

      if (asgardeoUser) {
        const bindingValidation = await EnhancedAuthService.validateWalletUserBinding(
          walletAddress, 
          asgardeoUser
        );
        
        walletUserBindingValid = bindingValidation.isValid;
        bindingError = bindingValidation.error || null;

        // Log security events for failed binding validation
        if (!bindingValidation.isValid) {
          EnhancedAuthService.logSecurityEvent('WALLET_BINDING_VIOLATION', {
            connectedWallet: walletAddress,
            asgardeoUser: asgardeoUser.sub,
            error: bindingValidation.error,
            timestamp: new Date().toISOString()
          });

          // Auto-sign out if binding is invalid
          setTimeout(() => {
            window.location.href = '/api/auth/signout?reason=wallet_mismatch';
          }, 3000);
        }
      }

      // Step 3: Check if user is registered (for users without Asgardeo session)
      const userValidationRes = await axios.post(`${BALLERINA_BASE_URL}/api/auth/validate-user`, {
        walletAddress,
        asgardeoUserId: asgardeoUser?.sub,
        asgardeoUser
      });
      
      return {
        walletVerified,
        isRegisteredUser: userValidationRes.data.isRegistered,
        walletUserBindingValid,
        bindingError,
        jwt: userValidationRes.data.token || walletAuthRes.data.token,
        userData: userValidationRes.data.userData
      };

    } catch (error) {
      console.error("Enhanced user validation failed:", error);
      return {
        walletVerified: false,
        isRegisteredUser: false,
        walletUserBindingValid: false,
        bindingError: 'Validation service error',
        jwt: null,
        userData: null
      };
    }
  };

  // Handle authentication state changes with enhanced security
  useEffect(() => {
    async function handleEnhancedAuthentication() {
      setAuth(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Get Asgardeo user info
        const asgardeoUser = await getAsgardeoUserInfo();
        
        if (isConnected && address) {
          // Wallet is connected, perform enhanced validation
          const validation = await validateUserAuthentication(address, asgardeoUser);
          
          // Determine if user is fully authenticated
          const isFullyAuthenticated = validation.walletVerified && 
                                     validation.isRegisteredUser && 
                                     validation.walletUserBindingValid;

          setAuth({
            address,
            walletVerified: validation.walletVerified,
            verified: validation.walletVerified, // Legacy compatibility
            asgardeoUser,
            isRegisteredUser: validation.isRegisteredUser,
            walletUserBindingValid: validation.walletUserBindingValid,
            bindingError: validation.bindingError,
            isFullyAuthenticated,
            jwt: validation.jwt,
            isLoading: false,
            error: validation.bindingError && !validation.walletUserBindingValid ? validation.bindingError : null,
          });

          // Handle security violations
          if (!validation.walletUserBindingValid && asgardeoUser) {
            handleSecurityViolation(validation.bindingError, address, asgardeoUser);
          }

        } else {
          // No wallet connected
          setAuth({
            address: null,
            walletVerified: false,
            verified: false,
            asgardeoUser,
            isRegisteredUser: false,
            walletUserBindingValid: false,
            bindingError: null,
            isFullyAuthenticated: false,
            jwt: null,
            isLoading: false,
            error: null,
          });

          // If user has Asgardeo session but no wallet, sign them out
          if (asgardeoUser) {
            setTimeout(() => {
              window.location.href = '/api/auth/signout?reason=no_wallet';
            }, 2000);
          }
        }
      } catch (error) {
        setAuth(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Enhanced authentication failed'
        }));
      }
    }
    
    handleEnhancedAuthentication();
  }, [address, isConnected]);

  // Handle security violations
  const handleSecurityViolation = (error: string | null, walletAddress: string, asgardeoUser: any) => {
    const violations = {
      'Connected wallet does not match registered wallet address': {
        title: 'Wallet Mismatch Detected',
        message: 'The connected wallet does not match the wallet registered with your account.',
        action: 'Please connect the correct wallet or contact support.',
        severity: 'critical'
      },
      'No wallet address registered for this Asgardeo account': {
        title: 'Account Not Linked',
        message: 'Your account is not linked to any wallet address.',
        action: 'Please complete the wallet linking process.',
        severity: 'warning'
      },
      'Wallet is not authorized on the blockchain': {
        title: 'Wallet Not Authorized',
        message: 'Your wallet is not authorized to access this platform.',
        action: 'Please contact support for wallet authorization.',
        severity: 'critical'
      }
    };

    const violation = violations[error as keyof typeof violations] || {
      title: 'Authentication Error',
      message: 'An authentication error occurred.',
      action: 'Please try again or contact support.',
      severity: 'warning'
    };

    // Show user-friendly error message
    console.error('Security Violation:', {
      type: violation.title,
      message: violation.message,
      walletAddress,
      asgardeoUser: asgardeoUser.sub,
      timestamp: new Date().toISOString()
    });

    // In a real app, you'd show a modal or toast notification
    // For now, we'll set it in the auth state error
  };

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

// Enhanced registration hook that creates Asgardeo users with wallet binding
export function useEnhancedRegistration() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  const registerUserWithWalletBinding = async (registrationData: {
    walletAddress: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    additionalInfo?: any;
  }) => {
    setIsRegistering(true);
    setRegistrationError(null);

    try {
      const result = await EnhancedAuthService.registerUserWithWalletBinding(registrationData);
      
      if (!result.success) {
        setRegistrationError(result.error || 'Registration failed');
        return false;
      }

      // Registration successful
      setRegistrationError(null);
      return true;

    } catch (error: any) {
      setRegistrationError(error.message || 'Registration failed');
      return false;
    } finally {
      setIsRegistering(false);
    }
  };

  return {
    registerUserWithWalletBinding,
    isRegistering,
    registrationError
  };
}

// Security monitoring hook
export function useSecurityMonitoring() {
  const { address, asgardeoUser, walletUserBindingValid, bindingError } = useAuth();

  useEffect(() => {
    // Monitor for suspicious authentication patterns
    if (address && asgardeoUser && !walletUserBindingValid) {
      EnhancedAuthService.logSecurityEvent('SUSPICIOUS_AUTH_ATTEMPT', {
        walletAddress: address,
        asgardeoUserId: asgardeoUser.sub,
        bindingError,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    }
  }, [address, asgardeoUser, walletUserBindingValid, bindingError]);

  return {
    logSecurityEvent: EnhancedAuthService.logSecurityEvent
  };
}
