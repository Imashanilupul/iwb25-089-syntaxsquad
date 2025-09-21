// Enhanced authentication service with wallet-user binding validation
import axios from 'axios';
import { useState } from 'react';

interface AsgardeoUser {
  sub: string;
  username: string;
  email: string;
  given_name: string;
  family_name: string;
  wallet_address?: string; // Custom attribute from Asgardeo
}

interface WalletAuthValidation {
  isValid: boolean;
  error?: string;
  details?: {
    connectedWallet: string;
    registeredWallet?: string;
    asgardeoUserId: string;
  };
}

export class EnhancedAuthService {
  private static readonly ASGARDEO_API_BASE = process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL;
  private static readonly BACKEND_API_BASE = process.env.NEXT_PUBLIC_APP_URL;

  /**
   * Validates that the connected wallet matches the wallet registered with the Asgardeo user
   */
  static async validateWalletUserBinding(
    connectedWallet: string, 
    asgardeoUser: AsgardeoUser
  ): Promise<WalletAuthValidation> {
    try {
      // Normalize wallet addresses for comparison
      const normalizedConnectedWallet = connectedWallet.toLowerCase();
      const normalizedRegisteredWallet = asgardeoUser.wallet_address?.toLowerCase();

      // Check if user has a wallet address registered
      if (!normalizedRegisteredWallet) {
        return {
          isValid: false,
          error: 'No wallet address registered for this Asgardeo account',
          details: {
            connectedWallet: normalizedConnectedWallet,
            asgardeoUserId: asgardeoUser.sub
          }
        };
      }

      // Check if wallets match
      if (normalizedConnectedWallet !== normalizedRegisteredWallet) {
        return {
          isValid: false,
          error: 'Connected wallet does not match registered wallet address',
          details: {
            connectedWallet: normalizedConnectedWallet,
            registeredWallet: normalizedRegisteredWallet,
            asgardeoUserId: asgardeoUser.sub
          }
        };
      }

      // Additional validation: Check if wallet is still authorized on blockchain
      const blockchainAuthCheck = await this.checkBlockchainAuthorization(normalizedConnectedWallet);
      if (!blockchainAuthCheck.isAuthorized) {
        return {
          isValid: false,
          error: 'Wallet is not authorized on the blockchain',
          details: {
            connectedWallet: normalizedConnectedWallet,
            registeredWallet: normalizedRegisteredWallet,
            asgardeoUserId: asgardeoUser.sub
          }
        };
      }

      return {
        isValid: true,
        details: {
          connectedWallet: normalizedConnectedWallet,
          registeredWallet: normalizedRegisteredWallet,
          asgardeoUserId: asgardeoUser.sub
        }
      };

    } catch (error) {
      console.error('Wallet validation error:', error);
      return {
        isValid: false,
        error: 'Failed to validate wallet binding',
        details: {
          connectedWallet: connectedWallet.toLowerCase(),
          asgardeoUserId: asgardeoUser.sub
        }
      };
    }
  }

  /**
   * Creates a new Asgardeo user with wallet address as custom attribute
   */
  static async createAsgardeoUserWithWallet(userData: {
    walletAddress: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    [key: string]: any;
  }): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // First, check if wallet address is already registered
      const existingUser = await this.findUserByWalletAddress(userData.walletAddress);
      if (existingUser) {
        return {
          success: false,
          error: 'Wallet address is already registered to another user'
        };
      }

      // Create user via SCIM API (this would require admin access token)
      const userPayload = {
        schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
        userName: userData.username,
        password: userData.password,
        emails: [{
          primary: true,
          value: userData.email
        }],
        name: {
          familyName: userData.lastName,
          givenName: userData.firstName
        },
        // Custom enterprise extension for wallet address
        "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
          wallet_address: userData.walletAddress.toLowerCase()
        }
      };

      // Note: This requires an admin access token to create users
      // In production, this would be done server-side
      const response = await axios.post(
        `${this.ASGARDEO_API_BASE}/scim2/Users`,
        userPayload,
        {
          headers: {
            'Authorization': `Bearer ${await this.getAdminAccessToken()}`,
            'Content-Type': 'application/scim+json'
          }
        }
      );

      return {
        success: true,
        userId: response.data.id
      };

    } catch (error: any) {
      console.error('Failed to create Asgardeo user:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create user account'
      };
    }
  }

  /**
   * Find user by wallet address using SCIM filter
   */
  static async findUserByWalletAddress(walletAddress: string): Promise<AsgardeoUser | null> {
    try {
      const normalizedWallet = walletAddress.toLowerCase();
      
      // Use SCIM filter to find user by wallet address
      const filterQuery = `urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:wallet_address eq "${normalizedWallet}"`;
      
      const response = await axios.get(
        `${this.ASGARDEO_API_BASE}/scim2/Users?filter=${encodeURIComponent(filterQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${await this.getAdminAccessToken()}`,
            'Content-Type': 'application/scim+json'
          }
        }
      );

      if (response.data.Resources && response.data.Resources.length > 0) {
        const user = response.data.Resources[0];
        return {
          sub: user.id,
          username: user.userName,
          email: user.emails[0]?.value,
          given_name: user.name?.givenName,
          family_name: user.name?.familyName,
          wallet_address: user["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"]?.wallet_address
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to find user by wallet address:', error);
      return null;
    }
  }

  /**
   * Check blockchain authorization status
   */
  private static async checkBlockchainAuthorization(walletAddress: string): Promise<{ isAuthorized: boolean }> {
    try {
      const response = await axios.get(`${this.BACKEND_API_BASE}/api/auth/isauthorized/${walletAddress}`);
      return {
        isAuthorized: response.data.verified || false
      };
    } catch (error) {
      console.error('Failed to check blockchain authorization:', error);
      return { isAuthorized: false };
    }
  }

  /**
   * Get admin access token for SCIM operations
   * Note: This should be implemented server-side for security
   */
  private static async getAdminAccessToken(): Promise<string> {
    // This is a placeholder - in production, this should be handled server-side
    // with proper admin credentials and token management
    throw new Error('Admin access token retrieval should be implemented server-side');
  }

  /**
   * Enhanced user registration flow (using existing backend API)
   */
  static async registerUserWithWalletBinding(registrationData: {
    walletAddress: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    additionalInfo?: any;
  }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // For now, use the existing wallet binding API endpoint
      // This will be replaced when Asgardeo SCIM integration is ready
      const response = await axios.post('/api/auth/wallet-binding', registrationData);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'User registered successfully with wallet binding'
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Registration failed'
        };
      }

    } catch (error: any) {
      console.error('Registration with wallet binding failed:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Delete Asgardeo user (for rollback scenarios)
   */
  private static async deleteAsgardeoUser(userId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.ASGARDEO_API_BASE}/scim2/Users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${await this.getAdminAccessToken()}`
          }
        }
      );
    } catch (error) {
      console.error('Failed to delete Asgardeo user:', error);
    }
  }

  /**
   * Security event logging
   */
  static logSecurityEvent(eventType: string, details: any): void {
    const securityEvent = {
      type: eventType,
      timestamp: new Date().toISOString(),
      details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log to console for development
    console.warn('Security Event:', securityEvent);

    // In production, send to security monitoring service
    // await this.sendToSecurityMonitoring(securityEvent);
  }
}

// Enhanced authentication hook
export function useEnhancedAuth() {
  const [authState, setAuthState] = useState<{
    isValidated: boolean;
    isLoading: boolean;
    error: string | null;
    walletUserBinding: any;
  }>({
    isValidated: false,
    isLoading: true,
    error: null,
    walletUserBinding: null
  });

  const validateAuthentication = async (connectedWallet: string, asgardeoUser: AsgardeoUser) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const validation = await EnhancedAuthService.validateWalletUserBinding(connectedWallet, asgardeoUser);
      
      if (!validation.isValid) {
        // Log security event
        EnhancedAuthService.logSecurityEvent('WALLET_BINDING_VIOLATION', {
          error: validation.error,
          details: validation.details
        });

        // Handle different types of validation failures
        await handleAuthenticationFailure(validation);
      }

      setAuthState({
        isValidated: validation.isValid,
        isLoading: false,
        error: validation.error || null,
        walletUserBinding: validation.details || null
      });

    } catch (error: any) {
      setAuthState({
        isValidated: false,
        isLoading: false,
        error: error.message || 'Authentication validation failed',
        walletUserBinding: null
      });
    }
  };

  const handleAuthenticationFailure = async (validation: WalletAuthValidation) => {
    switch (validation.error) {
      case 'No wallet address registered for this Asgardeo account':
        // Redirect to wallet linking page
        window.location.href = '/link-wallet';
        break;
      
      case 'Connected wallet does not match registered wallet address':
        // Sign out and show wallet mismatch error
        await signOutFromAsgardeo();
        showWalletMismatchError(validation.details);
        break;
      
      case 'Wallet is not authorized on the blockchain':
        // Contact support or re-authorization flow
        showWalletNotAuthorizedError();
        break;
      
      default:
        // Generic authentication error
        await signOutFromAsgardeo();
        showGenericAuthError();
    }
  };

  return {
    ...authState,
    validateAuthentication
  };
}

// Helper functions for error handling
async function signOutFromAsgardeo() {
  window.location.href = '/api/auth/signout';
}

function showWalletMismatchError(details: any) {
  // Implementation would show a user-friendly error modal
  alert(`Wallet mismatch detected. Connected: ${details?.connectedWallet?.slice(0,8)}..., Registered: ${details?.registeredWallet?.slice(0,8)}...`);
}

function showWalletNotAuthorizedError() {
  alert('Your wallet is not authorized. Please contact support.');
}

function showGenericAuthError() {
  alert('Authentication failed. Please try again.');
}
