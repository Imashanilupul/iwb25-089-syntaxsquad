import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Asgardeo SCIM API configuration
const ASGARDEO_BASE_URL = process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL;
const ASGARDEO_CLIENT_ID = process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID;
const ASGARDEO_CLIENT_SECRET = process.env.ASGARDEO_CLIENT_SECRET;

interface CreateUserRequest {
  walletAddress: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  additionalInfo?: any;
}

interface AsgardeoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Get admin access token for Asgardeo SCIM operations
 */
async function getAsgardeoAdminToken(): Promise<string> {
  try {
    const tokenPayload = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'internal_user_mgt_create internal_user_mgt_list internal_user_mgt_view'
    });

    const response = await axios.post<AsgardeoTokenResponse>(
      `${ASGARDEO_BASE_URL}/oauth2/token`,
      tokenPayload,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${ASGARDEO_CLIENT_ID}:${ASGARDEO_CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );

    return response.data.access_token;
  } catch (error: any) {
    console.error('Failed to get Asgardeo admin token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Asgardeo');
  }
}

/**
 * Check if wallet address is already registered in Asgardeo
 */
async function checkWalletAddressExists(walletAddress: string, accessToken: string): Promise<boolean> {
  try {
    const normalizedWallet = walletAddress.toLowerCase();
    const filterQuery = `urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:wallet_address eq "${normalizedWallet}"`;
    
    const response = await axios.get(
      `${ASGARDEO_BASE_URL}/scim2/Users?filter=${encodeURIComponent(filterQuery)}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/scim+json'
        }
      }
    );

    return response.data.Resources && response.data.Resources.length > 0;
  } catch (error: any) {
    console.error('Failed to check wallet address existence:', error.response?.data || error.message);
    return false; // Assume not exists if check fails
  }
}

/**
 * Create Asgardeo user with wallet address custom attribute
 */
async function createAsgardeoUser(userData: CreateUserRequest, accessToken: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const userPayload = {
      schemas: [
        "urn:ietf:params:scim:schemas:core:2.0:User",
        "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"
      ],
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
      // Custom extension for wallet address
      "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
        wallet_address: userData.walletAddress.toLowerCase(),
        registration_date: new Date().toISOString(),
        platform_role: "citizen" // Default role
      }
    };

    const response = await axios.post(
      `${ASGARDEO_BASE_URL}/scim2/Users`,
      userPayload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/scim+json'
        }
      }
    );

    return {
      success: true,
      userId: response.data.id
    };

  } catch (error: any) {
    console.error('Failed to create Asgardeo user:', error.response?.data || error.message);
    
    let errorMessage = 'Failed to create user account';
    if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.response?.status === 409) {
      errorMessage = 'Username or email already exists';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Authorize wallet on blockchain
 */
async function authorizeWalletOnBlockchain(walletAddress: string, asgardeoUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register-user`, {
      walletAddress,
      asgardeoUserId,
      additionalData: {
        registrationMethod: 'enhanced_binding',
        timestamp: new Date().toISOString()
      }
    });

    if (response.data.success) {
      return { success: true };
    } else {
      return { success: false, error: response.data.error || 'Blockchain authorization failed' };
    }
  } catch (error: any) {
    console.error('Blockchain authorization failed:', error.response?.data || error.message);
    return { success: false, error: 'Failed to authorize wallet on blockchain' };
  }
}

/**
 * Delete Asgardeo user (for rollback)
 */
async function deleteAsgardeoUser(userId: string, accessToken: string): Promise<void> {
  try {
    await axios.delete(`${ASGARDEO_BASE_URL}/scim2/Users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log(`Rolled back: Deleted Asgardeo user ${userId}`);
  } catch (error) {
    console.error(`Failed to rollback user deletion for ${userId}:`, error);
  }
}

/**
 * API endpoint to create user with wallet binding
 */
export async function POST(request: NextRequest) {
  try {
    const userData: CreateUserRequest = await request.json();

    // Validate required fields
    if (!userData.walletAddress || !userData.firstName || !userData.lastName || 
        !userData.email || !userData.username || !userData.password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(userData.walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Get admin access token
    const accessToken = await getAsgardeoAdminToken();

    // Check if wallet address already exists
    const walletExists = await checkWalletAddressExists(userData.walletAddress, accessToken);
    if (walletExists) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is already registered to another account' },
        { status: 409 }
      );
    }

    // Create Asgardeo user
    const userCreation = await createAsgardeoUser(userData, accessToken);
    if (!userCreation.success) {
      return NextResponse.json(
        { success: false, error: userCreation.error },
        { status: 400 }
      );
    }

    // Authorize wallet on blockchain
    const blockchainAuth = await authorizeWalletOnBlockchain(userData.walletAddress, userCreation.userId!);
    if (!blockchainAuth.success) {
      // Rollback: Delete the Asgardeo user
      await deleteAsgardeoUser(userCreation.userId!, accessToken);
      
      return NextResponse.json(
        { success: false, error: `User account created but blockchain authorization failed: ${blockchainAuth.error}` },
        { status: 500 }
      );
    }

    // Log successful registration
    console.log(`✅ User registered successfully:`, {
      asgardeoUserId: userCreation.userId,
      walletAddress: userData.walletAddress,
      email: userData.email,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'User registered successfully with wallet binding',
      userId: userCreation.userId,
      walletAddress: userData.walletAddress
    });

  } catch (error: any) {
    console.error('Registration with wallet binding failed:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * API endpoint to check wallet binding status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Get admin access token
    const accessToken = await getAsgardeoAdminToken();

    // Check if wallet is bound to a user
    const normalizedWallet = walletAddress.toLowerCase();
    const filterQuery = `urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:wallet_address eq "${normalizedWallet}"`;
    
    const response = await axios.get(
      `${ASGARDEO_BASE_URL}/scim2/Users?filter=${encodeURIComponent(filterQuery)}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/scim+json'
        }
      }
    );

    const isRegistered = response.data.Resources && response.data.Resources.length > 0;
    let userData = null;

    if (isRegistered) {
      const user = response.data.Resources[0];
      userData = {
        id: user.id,
        username: user.userName,
        email: user.emails[0]?.value,
        name: {
          firstName: user.name?.givenName,
          lastName: user.name?.familyName
        },
        walletAddress: user["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"]?.wallet_address,
        registrationDate: user["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"]?.registration_date
      };
    }

    return NextResponse.json({
      isRegistered,
      walletAddress: normalizedWallet,
      userData
    });

  } catch (error: any) {
    console.error('Failed to check wallet binding:', error);
    return NextResponse.json(
      { error: 'Failed to check wallet binding status' },
      { status: 500 }
    );
  }
}
