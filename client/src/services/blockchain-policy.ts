import axios from 'axios';

const SMART_CONTRACTS_API_BASE = process.env.NEXT_PUBLIC_SMART_CONTRACTS_API || 'http://localhost:3001';

export interface BlockchainPolicyData {
  name: string;
  description: string;
  viewFullPolicy: string;
  ministry: string;
  effectiveDate?: string;
}

export interface BlockchainPolicyResponse {
  success: boolean;
  message?: string;
  data?: {
    policyId: string;
    transactionHash: string;
    blockNumber: number;
    contractAddress: string;
    ipfs?: {
      descriptionCid: string;
    };
  };
  error?: string;
}

export interface PolicyStatusUpdateData {
  policyId: string;
  newStatus: string;
  newEffectiveDate?: string;
}

export const createPolicyOnBlockchain = async (policyData: BlockchainPolicyData): Promise<BlockchainPolicyResponse> => {
  try {
    console.log("🔗 Sending policy to blockchain:", policyData);
    
    const response = await axios.post(`${SMART_CONTRACTS_API_BASE}/policy/create-policy`, policyData);

    return {
      success: true,
      message: response.data.message || 'Policy created on blockchain successfully!',
      data: response.data.data
    };
  } catch (error: any) {
    console.error('Blockchain policy creation error:', error);
    
    const errorMessage = error.response?.data?.error || error.message || 'Failed to create policy on blockchain';
    
    return {
      success: false,
      message: errorMessage,
      error: errorMessage
    };
  }
};

export const updatePolicyStatusOnBlockchain = async (statusData: PolicyStatusUpdateData): Promise<BlockchainPolicyResponse> => {
  try {
    console.log("🔗 Updating policy status on blockchain:", statusData);
    
    const response = await axios.post(`${SMART_CONTRACTS_API_BASE}/policy/update-policy-status`, statusData);

    return {
      success: true,
      message: response.data.message || 'Policy status updated on blockchain successfully!',
      data: response.data.data
    };
  } catch (error: any) {
    console.error('Blockchain policy status update error:', error);
    
    const errorMessage = error.response?.data?.error || error.message || 'Failed to update policy status on blockchain';
    
    return {
      success: false,
      message: errorMessage,
      error: errorMessage
    };
  }
};

export const getPolicyFromBlockchain = async (policyId: string): Promise<BlockchainPolicyResponse> => {
  try {
    console.log("🔗 Getting policy from blockchain:", policyId);
    
    const response = await axios.get(`${SMART_CONTRACTS_API_BASE}/policy/${policyId}`);

    return {
      success: true,
      message: response.data.message || 'Policy retrieved from blockchain successfully!',
      data: response.data.data
    };
  } catch (error: any) {
    console.error('Blockchain policy retrieval error:', error);
    
    const errorMessage = error.response?.data?.error || error.message || 'Failed to retrieve policy from blockchain';
    
    return {
      success: false,
      message: errorMessage,
      error: errorMessage
    };
  }
};
