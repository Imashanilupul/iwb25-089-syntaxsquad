import { useState, useCallback, useRef } from 'react'
import { HumanodeBiometricService, BiometricVerificationResult, LivenessData, createHumanodeService } from '@/services/humanode-auth'

export interface BiometricAuthState {
  isInitialized: boolean
  isLoading: boolean
  isScanning: boolean
  error: string | null
  verificationResult: BiometricVerificationResult | null
  sessionToken: string | null
}

export interface UseBiometricAuthReturn {
  state: BiometricAuthState
  initializeAuth: () => Promise<void>
  verifyUniqueness: (faceScanData: LivenessData) => Promise<BiometricVerificationResult>
  enrollUser: (faceScanData: LivenessData) => Promise<{ success: boolean; biometricHash: string }>
  reset: () => void
}

export const useBiometricAuth = (): UseBiometricAuthReturn => {
  const [state, setState] = useState<BiometricAuthState>({
    isInitialized: false,
    isLoading: false,
    isScanning: false,
    error: null,
    verificationResult: null,
    sessionToken: null
  })

  const serviceRef = useRef<HumanodeBiometricService | null>(null)

  const updateState = useCallback((updates: Partial<BiometricAuthState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const initializeAuth = useCallback(async () => {
    try {
      updateState({ isLoading: true, error: null })
      
      if (!serviceRef.current) {
        serviceRef.current = createHumanodeService()
      }

      await serviceRef.current.initialize()
      const sessionToken = await serviceRef.current.getSessionToken()

      updateState({
        isInitialized: true,
        isLoading: false,
        sessionToken,
        error: null
      })
    } catch (error: any) {
      updateState({
        isLoading: false,
        error: error.message || 'Failed to initialize biometric authentication',
        isInitialized: false
      })
      throw error
    }
  }, [updateState])

  const verifyUniqueness = useCallback(async (faceScanData: LivenessData): Promise<BiometricVerificationResult> => {
    if (!serviceRef.current) {
      throw new Error('Biometric service not initialized')
    }

    try {
      updateState({ isScanning: true, error: null })
      
      const result = await serviceRef.current.verifyUniqueness(faceScanData)
      
      updateState({
        isScanning: false,
        verificationResult: result,
        error: result.isValid ? null : result.errorMessage || 'Verification failed'
      })

      return result
    } catch (error: any) {
      const errorMessage = error.message || 'Biometric verification failed'
      updateState({
        isScanning: false,
        error: errorMessage,
        verificationResult: {
          isValid: false,
          isUnique: false,
          biometricHash: '',
          errorMessage
        }
      })
      throw error
    }
  }, [updateState])

  const enrollUser = useCallback(async (faceScanData: LivenessData): Promise<{ success: boolean; biometricHash: string }> => {
    if (!serviceRef.current) {
      throw new Error('Biometric service not initialized')
    }

    try {
      updateState({ isScanning: true, error: null })
      
      const enrollmentResult = await serviceRef.current.enrollUser(faceScanData)
      
      updateState({
        isScanning: false,
        error: null
      })

      return {
        success: true,
        biometricHash: enrollmentResult.biometricHash
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Biometric enrollment failed'
      updateState({
        isScanning: false,
        error: errorMessage
      })
      
      return {
        success: false,
        biometricHash: ''
      }
    }
  }, [updateState])

  const reset = useCallback(() => {
    setState({
      isInitialized: false,
      isLoading: false,
      isScanning: false,
      error: null,
      verificationResult: null,
      sessionToken: null
    })
    serviceRef.current = null
  }, [])

  return {
    state,
    initializeAuth,
    verifyUniqueness,
    enrollUser,
    reset
  }
}
