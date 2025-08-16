"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Camera, CheckCircle, XCircle, AlertTriangle, Shield } from "lucide-react"
import { useBiometricAuth } from "@/hooks/use-biometric-auth"
import { RealFaceScanService } from "@/services/face-scan"

interface BiometricVerificationProps {
  onVerificationComplete: (result: { isUnique: boolean; biometricHash: string }) => void
  onVerificationError: (error: string) => void
  isEnabled: boolean
}

export function BiometricVerification({ 
  onVerificationComplete, 
  onVerificationError,
  isEnabled 
}: BiometricVerificationProps) {
  const { state, initializeAuth, verifyUniqueness, reset } = useBiometricAuth()
  const [currentStep, setCurrentStep] = useState<'init' | 'ready' | 'scanning' | 'complete'>('init')
  const [cameraAvailable, setCameraAvailable] = useState<boolean>(false)
  const faceScanServiceRef = useRef<RealFaceScanService | null>(null)

  useEffect(() => {
    if (isEnabled && !state.isInitialized && !state.isLoading) {
      handleInitialize()
    }
    
    // Check camera availability
    checkCameraAvailability()
  }, [isEnabled])

  const checkCameraAvailability = async () => {
    try {
      const available = await RealFaceScanService.isCameraAvailable()
      setCameraAvailable(available)
      
      if (!available) {
        onVerificationError('Camera not available. Please ensure you have a webcam connected and grant camera permissions.')
      }
    } catch (error) {
      setCameraAvailable(false)
    }
  }

  const handleInitialize = async () => {
    try {
      await initializeAuth()
      setCurrentStep('ready')
    } catch (error: any) {
      console.warn('Biometric initialization error:', error.message)
      // In development, we still proceed with mock service
      if (process.env.NODE_ENV === 'development') {
        setCurrentStep('ready')
      } else {
        onVerificationError(error.message || 'Failed to initialize biometric verification')
      }
    }
  }

  const handleStartVerification = async () => {
    if (!state.isInitialized) {
      onVerificationError('Biometric system not initialized')
      return
    }

    if (!cameraAvailable) {
      onVerificationError('Camera not available')
      return
    }

    setCurrentStep('scanning')

    try {
      // Request camera permission first
      const hasPermission = await RealFaceScanService.requestCameraPermission()
      if (!hasPermission) {
        throw new Error('Camera permission denied')
      }

      // Initialize face scan service
      faceScanServiceRef.current = new RealFaceScanService()
      
      // Start real face scanning
      const faceScanResult = await faceScanServiceRef.current.startFaceScan(
        state.sessionToken || 'real_session'
      )
      
      // Convert to format expected by Humanode service
      const livenessData = {
        faceScan: faceScanResult.faceScan,
        auditTrailImage: faceScanResult.auditTrailImage,
        lowQualityAuditTrailImage: faceScanResult.lowQualityAuditTrailImage,
        sessionId: faceScanResult.sessionId
      }
      
      const result = await verifyUniqueness(livenessData)
      
      if (result.isValid && result.isUnique) {
        setCurrentStep('complete')
        onVerificationComplete({
          isUnique: true,
          biometricHash: result.biometricHash
        })
      } else {
        // For mock "user already registered" errors, provide helpful context
        const errorMessage = result.errorMessage || 'Biometric verification failed'
        if (process.env.NODE_ENV === 'development' && errorMessage.includes('Mock: User already registered')) {
          onVerificationError(`${errorMessage} (This is a simulated error in development mode. Try again or set NEXT_PUBLIC_MOCK_BIOMETRIC_FAIL=false in .env.local to disable mock failures)`)
        } else {
          onVerificationError(errorMessage)
        }
        setCurrentStep('ready')
      }
    } catch (error: any) {
      onVerificationError(error.message || 'Face scan failed')
      setCurrentStep('ready')
    } finally {
      // Cleanup camera resources
      if (faceScanServiceRef.current) {
        faceScanServiceRef.current.cleanup()
      }
    }
  }

  const handleReset = () => {
    // Cleanup camera resources
    if (faceScanServiceRef.current) {
      faceScanServiceRef.current.cleanup()
    }
    
    reset()
    setCurrentStep('init')
  }

  if (!isEnabled) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Shield className="h-5 w-5" />
            Biometric Verification (Optional)
          </CardTitle>
          <CardDescription className="text-blue-600">
            Enable biometric verification to ensure unique user registration
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Shield className="h-5 w-5" />
          Biometric Identity Verification
          {process.env.NODE_ENV === 'development' && (
            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">DEV MODE</span>
          )}
        </CardTitle>
        <CardDescription className="text-green-700">
          Powered by Humanode.io - Ensures one person, one account
          {process.env.NODE_ENV === 'development' && (
            <div className="text-orange-600 text-sm mt-1">
              Using mock biometric service for development
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Initialization Step */}
        {currentStep === 'init' && (
          <div className="text-center space-y-4">
            {state.isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-blue-700">Initializing biometric system...</span>
              </div>
            ) : (
              <Button 
                onClick={handleInitialize}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700"
              >
                <Camera className="h-4 w-4 mr-2" />
                Initialize Biometric Verification
              </Button>
            )}
          </div>
        )}

        {/* Ready Step */}
        {currentStep === 'ready' && (
          <div className="text-center space-y-4">
            <Alert className="border-green-300 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">System Ready</AlertTitle>
              <AlertDescription className="text-green-700">
                Biometric verification system is initialized and ready to scan.
                {cameraAvailable ? ' Camera detected.' : ' Camera not available.'}
              </AlertDescription>
            </Alert>
            
            {!cameraAvailable && (
              <Alert className="border-amber-300 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Camera Required</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Please ensure you have a webcam connected and grant camera permissions to proceed with biometric verification.
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={handleStartVerification}
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700"
              disabled={state.isScanning || !cameraAvailable}
            >
              <Camera className="h-4 w-4 mr-2" />
              {cameraAvailable ? 'Start Real Face Scan' : 'Camera Not Available'}
            </Button>
            
            <p className="text-sm text-slate-600">
              The scan will use your camera to verify that you haven't registered before using facial biometrics.
            </p>
          </div>
        )}

        {/* Scanning Step */}
        {currentStep === 'scanning' && (
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="mx-auto w-32 h-32 rounded-full border-4 border-blue-300 border-dashed animate-pulse flex items-center justify-center bg-blue-100">
                <Camera className="h-12 w-12 text-blue-600" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-2 border-green-500 animate-ping"></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="font-medium text-blue-800">Scanning your face...</p>
              <p className="text-sm text-slate-600">
                Please look directly at the camera and remain still
              </p>
              <p className="text-xs text-orange-600">
                Real camera scanning in progress - this will capture your actual face
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-blue-700">Processing real biometric data...</span>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && (
          <div className="text-center space-y-4">
            <Alert className="border-green-300 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Verification Successful</AlertTitle>
              <AlertDescription className="text-green-700">
                Your biometric identity has been verified as unique. You can proceed with registration.
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center justify-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Unique identity confirmed</span>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Scan Again
            </Button>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <Alert className="border-red-300 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Verification Error</AlertTitle>
            <AlertDescription className="text-red-700">
              {state.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Development Helper */}
        {/* {process.env.NODE_ENV === 'development' && (
          <Alert className="border-orange-300 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800">Development Mode</AlertTitle>
            <AlertDescription className="text-orange-700 space-y-2">
              <p>Mock biometric service is active. To test different scenarios:</p>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li><strong>Always succeed:</strong> NEXT_PUBLIC_MOCK_BIOMETRIC_FAIL=false (current)</li>
                <li><strong>Force failures:</strong> NEXT_PUBLIC_MOCK_BIOMETRIC_FAIL=true</li>
                <li><strong>Use real service:</strong> Get Humanode API key & set NEXT_PUBLIC_USE_REAL_HUMANODE=true</li>
              </ul>
              <p className="text-xs mt-2">
                Current setting: {process.env.NEXT_PUBLIC_MOCK_BIOMETRIC_FAIL === 'true' ? 'Forced failures enabled' : 'Normal success rate (95%)'}
              </p>
            </AlertDescription>
          </Alert>
        )} */}

        {/* Security Notice */}
        <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-slate-700 mb-1">Privacy & Security</p>
              <p>
                Your biometric data is processed securely by Humanode.io and never stored permanently. 
                Only a cryptographic hash is used to ensure uniqueness across the platform.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
