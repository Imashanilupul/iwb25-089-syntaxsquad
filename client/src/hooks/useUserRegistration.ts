import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const BALLERINA_BASE_URL = process.env.NEXT_PUBLIC_BALLERINA_BASE_URL || 'http://localhost:8080';

export function useUserRegistration() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const auth = useAuth();

  const registerUser = async (additionalData?: any) => {
    if (!auth.address) {
      setRegistrationError('Wallet must be connected first');
      return false;
    }

    if (!auth.asgardeoUser) {
      setRegistrationError('Must be signed in with Asgardeo first');
      return false;
    }

    setIsRegistering(true);
    setRegistrationError(null);

    try {
      // Register user with backend
      const response = await axios.post(`${BALLERINA_BASE_URL}/api/auth/register-user`, {
        walletAddress: auth.address,
        asgardeoUserId: auth.asgardeoUser.sub,
        asgardeoUser: auth.asgardeoUser,
        additionalData: additionalData || {}
      });

      if (response.data.success) {
        // Trigger auth context refresh
        window.location.reload(); // Simple refresh - you could implement a more elegant solution
        return true;
      } else {
        setRegistrationError(response.data.error || 'Registration failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setRegistrationError(errorMessage);
      return false;
    } finally {
      setIsRegistering(false);
    }
  };

  return {
    registerUser,
    isRegistering,
    registrationError,
    canRegister: auth.address && auth.walletVerified && auth.asgardeoUser && !auth.isRegisteredUser
  };
}

export default useUserRegistration;
