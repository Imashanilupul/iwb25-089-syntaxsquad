/**
 * Humanode Biometric Authentication Service
 * Integrates with Humanode.io for unique user verification
 */

export interface BiometricAuthConfig {
  apiEndpoint: string
  apiKey: string
  deviceSdkParams?: FacetecDeviceSdkParams
}

export interface FacetecDeviceSdkParams {
  deviceKeyIdentifier: string
  faceScanEncryptionKey: string
  productionKeyText: string
}

export interface LivenessData {
  faceScan: string
  auditTrailImage: string
  lowQualityAuditTrailImage: string
  sessionId: string
}

export interface AuthenticationResponse {
  authTicket: string
  authTicketSignature: string
  scanResultBlob: string
  isUnique: boolean
  biometricHash: string
}

export interface EnrollmentResponse {
  scanResultBlob: string
  biometricHash: string
  enrollmentId: string
}

export interface BiometricVerificationResult {
  isValid: boolean
  isUnique: boolean
  biometricHash: string
  enrollmentId?: string
  errorMessage?: string
}

export class HumanodeBiometricService {
  private config: BiometricAuthConfig
  private sessionToken: string | null = null

  constructor(config: BiometricAuthConfig) {
    this.config = config
  }

  /**
   * Initialize the service and get device SDK parameters
   */
  async initialize(): Promise<void> {
    try {
      // Get FaceTec device SDK parameters
      const response = await fetch(`${this.config.apiEndpoint}/bioauth_getFacetecDeviceSdkParams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'bioauth_getFacetecDeviceSdkParams',
          params: [],
          id: 1
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get device SDK params: ${response.statusText}`)
      }

      const data = await response.json()
      this.config.deviceSdkParams = data.result
    } catch (error) {
      console.error('Failed to initialize Humanode service:', error)
      throw error
    }
  }

  /**
   * Get a session token for FaceTec operations
   */
  async getSessionToken(): Promise<string> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/bioauth_getFacetecSessionToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'bioauth_getFacetecSessionToken',
          params: [],
          id: 2
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get session token: ${response.statusText}`)
      }

      const data = await response.json()
      this.sessionToken = data.result
      return this.sessionToken as string
    } catch (error) {
      console.error('Failed to get session token:', error)
      throw error
    }
  }

  /**
   * Enroll a new user with biometric data
   */
  async enrollUser(livenessData: LivenessData): Promise<EnrollmentResponse> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/bioauth_enrollV2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'bioauth_enrollV2',
          params: [livenessData],
          id: 3
        })
      })

      if (!response.ok) {
        throw new Error(`Enrollment failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(`Enrollment error: ${data.error.message}`)
      }

      return {
        scanResultBlob: data.result.scanResultBlob,
        biometricHash: this.generateBiometricHash(data.result.scanResultBlob),
        enrollmentId: data.result.enrollmentId || this.generateEnrollmentId()
      }
    } catch (error) {
      console.error('Enrollment failed:', error)
      throw error
    }
  }

  /**
   * Authenticate a user and verify uniqueness
   */
  async authenticateUser(livenessData: LivenessData): Promise<AuthenticationResponse> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/bioauth_authenticateV2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'bioauth_authenticateV2',
          params: [livenessData],
          id: 4
        })
      })

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        // Check if it's a uniqueness violation
        const isUniqueError = this.isUniquenessError(data.error)
        if (isUniqueError) {
          throw new Error('Biometric identity already registered. Each person can only register once.')
        }
        throw new Error(`Authentication error: ${data.error.message}`)
      }

      return {
        authTicket: data.result.authTicket,
        authTicketSignature: data.result.authTicketSignature,
        scanResultBlob: data.result.scanResultBlob,
        isUnique: true,
        biometricHash: this.generateBiometricHash(data.result.scanResultBlob)
      }
    } catch (error) {
      console.error('Authentication failed:', error)
      throw error
    }
  }

  /**
   * Verify if a user is unique and not already registered
   */
  async verifyUniqueness(livenessData: LivenessData): Promise<BiometricVerificationResult> {
    try {
      // First try authentication to check if user already exists
      const authResult = await this.authenticateUser(livenessData)
      
      return {
        isValid: true,
        isUnique: authResult.isUnique,
        biometricHash: authResult.biometricHash,
        errorMessage: authResult.isUnique ? undefined : 'User already registered'
      }
    } catch (error: any) {
      // If authentication fails due to user not found, they are unique
      if (this.isPersonNotFoundError(error.message)) {
        return {
          isValid: true,
          isUnique: true,
          biometricHash: '',
          errorMessage: undefined
        }
      }

      // If authentication fails due to duplicate, they are not unique
      if (this.isUniquenessError(error)) {
        return {
          isValid: true,
          isUnique: false,
          biometricHash: '',
          errorMessage: 'Biometric identity already registered'
        }
      }

      // Other errors
      return {
        isValid: false,
        isUnique: false,
        biometricHash: '',
        errorMessage: error.message || 'Biometric verification failed'
      }
    }
  }

  /**
   * Check biometric authentication status
   */
  async getAuthenticationStatus(): Promise<{ isActive: boolean; expiresAt?: number }> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/bioauth_status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'bioauth_status',
          params: [],
          id: 5
        })
      })

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(`Status error: ${data.error.message}`)
      }

      const status = data.result
      return {
        isActive: status !== 'Inactive',
        expiresAt: status.Active ? status.Active.expires_at : undefined
      }
    } catch (error) {
      console.error('Status check failed:', error)
      throw error
    }
  }

  /**
   * Check if error indicates user not found (unique user)
   */
  private isPersonNotFoundError(errorMessage: string): boolean {
    return errorMessage.toLowerCase().includes('person not found') ||
           errorMessage.toLowerCase().includes('user not found') ||
           errorMessage.toLowerCase().includes('no match found')
  }

  /**
   * Check if error indicates uniqueness violation
   */
  private isUniquenessError(error: any): boolean {
    if (typeof error === 'string') {
      return error.toLowerCase().includes('already registered') ||
             error.toLowerCase().includes('duplicate') ||
             error.toLowerCase().includes('already enrolled')
    }
    
    if (error && error.message) {
      return this.isUniquenessError(error.message)
    }

    if (error && error.data && error.data.kind) {
      return error.data.kind === 'PERSON_ALREADY_ENROLLED' ||
             error.data.kind === 'DUPLICATE_ENROLLMENT'
    }

    return false
  }

  /**
   * Generate a hash from biometric data for local storage
   */
  private generateBiometricHash(scanResultBlob: string): string {
    // Simple hash generation - in production, use a proper cryptographic hash
    const encoder = new TextEncoder()
    const data = encoder.encode(scanResultBlob)
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data[i]
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Generate a unique enrollment ID
   */
  private generateEnrollmentId(): string {
    return `enroll_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  /**
   * Get device SDK parameters for frontend integration
   */
  getDeviceSdkParams(): FacetecDeviceSdkParams | undefined {
    return this.config.deviceSdkParams
  }
}

// Export configuration for development/testing
export const createHumanodeService = (endpoint?: string, apiKey?: string): HumanodeBiometricService => {
  const config: BiometricAuthConfig = {
    apiEndpoint: endpoint || process.env.NEXT_PUBLIC_HUMANODE_ENDPOINT || 'https://mainnet-rpc.humanode.io',
    apiKey: apiKey || process.env.NEXT_PUBLIC_HUMANODE_API_KEY || 'demo-key'
  }
  
  return new HumanodeBiometricService(config)
}
