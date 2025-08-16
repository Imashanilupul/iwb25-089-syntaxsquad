import axios from 'axios';

const SMART_CONTRACTS_API_BASE = process.env.NEXT_PUBLIC_SMART_CONTRACTS_API || 'http://localhost:3001';
const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_API || 'http://localhost:8080';

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  nicNumber: string;
  mobileNumber: string;
  province: string;
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
    // Step 1: Register in smart contract (authorize wallet)
    console.log('Step 1: Registering user in smart contract...');
    const contractResponse = await axios.post(`${SMART_CONTRACTS_API_BASE}/auth/register`, {
      userAddress: registrationData.walletAddress,
      userData: registrationData
    });

    // Step 2: Save user data to database
    console.log('Step 2: Saving user data to database...');
    const userPayload = {
      user_name: `${registrationData.firstName} ${registrationData.lastName}`,
      email: registrationData.email,
      nic: registrationData.nicNumber,
      mobile_no: registrationData.mobileNumber,
      evm: registrationData.walletAddress,
      Province: registrationData.province
    };

    const databaseResponse = await axios.post(`${BACKEND_API_BASE}/api/users`, userPayload);

    console.log('Registration completed successfully:', {
      contract: contractResponse.data,
      database: databaseResponse.data
    });

    return {
      success: true,
      message: 'Registration successful! User authorized on blockchain and saved to database.',
      transactionHash: contractResponse.data.transactionHash
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Determine which step failed based on the error
    let errorMessage = 'Registration failed';
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // If smart contract succeeded but database failed, mention it
    if (error.config?.url?.includes('/api/users')) {
      errorMessage = 'Smart contract registration succeeded, but database save failed: ' + errorMessage;
    }
    
    return {
      success: false,
      message: errorMessage,
      error: errorMessage
    };
  }
};
