import axios from 'axios';

const SMART_CONTRACTS_API_BASE = process.env.NEXT_PUBLIC_SMART_CONTRACTS_API || 'http://localhost:3001';

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  nicNumber: string;
  mobileNumber: string;
  walletAddress: string;
  nicInfo?: {
    birthYear?: number;
    dayOfYear?: number;
    gender?: 'Male' | 'Female';
  };
  biometricData?: {
    isVerified: boolean;
    isUnique: boolean;
    biometricHash: string;
  } | null;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  transactionHash?: string;
  error?: string;
}

export const registerUser = async (registrationData: RegistrationData): Promise<RegistrationResponse> => {
  try {
    const response = await axios.post(`${SMART_CONTRACTS_API_BASE}/auth/register`, {
      userAddress: registrationData.walletAddress,
      userData: registrationData
    });

    return {
      success: true,
      message: response.data.message || 'Registration successful!',
      transactionHash: response.data.transactionHash
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    
    const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
    
    return {
      success: false,
      message: errorMessage,
      error: errorMessage
    };
  }
};
