"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, ChevronLeft, ChevronRight, User, Phone, Shield, CheckCircle, AlertCircle, Copy } from "lucide-react"
import { BiometricVerification } from "@/components/biometric-verification"
import { useAppKitAccount } from "@reown/appkit/react"
import { registerUser } from "@/services/registration"
import { LoadingOverlay } from "@/components/ui/loading-spinner"
import { toast } from "sonner"

interface RegistrationFormData {
  firstName: string
  lastName: string
  email: string
  nicNumber: string
  mobileNumber: string
  province: string
}

interface ValidationErrors {
  email?: string
  nicNumber?: string
  mobileNumber?: string
  evm?: string
}

interface BiometricData {
  isVerified: boolean
  isUnique: boolean
  biometricHash: string
}

interface NICValidationResult {
  isValid: boolean
  message: string
  birthYear?: number
  dayOfYear?: number
  gender?: 'Male' | 'Female'
}

// Comprehensive Sri Lankan NIC validation function
const validateSriLankanNIC = (nic: string): NICValidationResult => {
  if (!nic) {
    return { isValid: false, message: "NIC number is required" }
  }

  const cleanNIC = nic.trim().toUpperCase()

  // Check for old format NIC (9 digits + V/X)
  if (/^[0-9]{9}[VX]$/.test(cleanNIC)) {
    return validateOldFormatNIC(cleanNIC)
  }
  
  // Check for new format NIC (12 digits)
  if (/^[0-9]{12}$/.test(cleanNIC)) {
    return validateNewFormatNIC(cleanNIC)
  }

  return { 
    isValid: false, 
    message: "Invalid NIC format. Use old format (123456789V) or new format (123456789012)" 
  }
}

// Validate old format NIC (9 digits + V/X)
const validateOldFormatNIC = (nic: string): NICValidationResult => {
  const digits = nic.substring(0, 9)
  const suffix = nic.charAt(9)
  
  // Extract birth year (first 2 digits + 1900)
  const yearPrefix = parseInt(digits.substring(0, 2))
  const birthYear = 1900 + yearPrefix
  
  // Extract day of year (next 3 digits)
  let dayOfYear = parseInt(digits.substring(2, 5))
  let gender: 'Male' | 'Female' = 'Male'
  
  // If day > 500, it's female (subtract 500 to get actual day)
  if (dayOfYear > 500) {
    gender = 'Female'
    dayOfYear -= 500
  }
  
  // Validate day of year (1-366 for leap years, 1-365 for normal years)
  const isLeapYear = (birthYear % 4 === 0 && birthYear % 100 !== 0) || (birthYear % 400 === 0)
  const maxDays = isLeapYear ? 366 : 365
  
  if (dayOfYear < 1 || dayOfYear > maxDays) {
    return { 
      isValid: false, 
      message: `Invalid day of year: ${dayOfYear}. Must be between 1-${maxDays} for year ${birthYear}` 
    }
  }
  
  
  // Additional validation: reasonable birth year range
  const currentYear = new Date().getFullYear()
  if (birthYear < 1900 || birthYear > currentYear) {
    return { 
      isValid: false, 
      message: `Invalid birth year: ${birthYear}. Must be between 1900-${currentYear}` 
    }
  }
  
  return { 
    isValid: true, 
    message: "Valid NIC number", 
    birthYear, 
    dayOfYear, 
    gender 
  }
}

// Validate new format NIC (12 digits)
const validateNewFormatNIC = (nic: string): NICValidationResult => {
  // Extract birth year (first 4 digits)
  const birthYear = parseInt(nic.substring(0, 4))
  
  // Extract day of year (next 3 digits)
  let dayOfYear = parseInt(nic.substring(4, 7))
  let gender: 'Male' | 'Female' = 'Male'
  
  // If day > 500, it's female (subtract 500 to get actual day)
  if (dayOfYear > 500) {
    gender = 'Female'
    dayOfYear -= 500
  }
  
  // Validate day of year
  const isLeapYear = (birthYear % 4 === 0 && birthYear % 100 !== 0) || (birthYear % 400 === 0)
  const maxDays = isLeapYear ? 366 : 365
  
  if (dayOfYear < 1 || dayOfYear > maxDays) {
    return { 
      isValid: false, 
      message: `Invalid day of year: ${dayOfYear}. Must be between 1-${maxDays} for year ${birthYear}` 
    }
  }
  
  // Additional validation: reasonable birth year range
  const currentYear = new Date().getFullYear()
  if (birthYear < 1900 || birthYear > currentYear) {
    return { 
      isValid: false, 
      message: `Invalid birth year: ${birthYear}. Must be between 1900-${currentYear}` 
    }
  }
  
  // Validate serial number (positions 7-10) - should not be 0000
  const serialNumber = nic.substring(7, 11)
  if (serialNumber === "0000") {
    return { 
      isValid: false, 
      message: "Invalid serial number in NIC" 
    }
  }
  
  return { 
    isValid: true, 
    message: "Valid NIC number", 
    birthYear, 
    dayOfYear, 
    gender 
  }
}

// Calculate checksum for old format NIC using modulo 11 algorithm
const calculateOldNICChecksum = (digits: string): number => {
  const multipliers = [2, 3, 4, 5, 6, 7, 8, 9, 10]
  let sum = 0
  
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i)) * multipliers[i]
  }
  
  const remainder = sum % 11
  return remainder === 0 ? 0 : 11 - remainder
}

export function RegistrationDialog() {
  const { address, isConnected } = useAppKitAccount()
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nicValidation, setNicValidation] = useState<NICValidationResult | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [biometricData, setBiometricData] = useState<BiometricData>({
    isVerified: false,
    isUnique: false,
    biometricHash: ''
  })
  const [enableBiometric, setEnableBiometric] = useState(true)
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: "",
    lastName: "",
    email: "",
    nicNumber: "",
    mobileNumber: "",
    province: "",
  })

  // Step navigation
  const nextStep = () => {
    if (currentStep < totalSteps && isStepValid(currentStep)) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  // Step validation
  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return (
          formData.firstName.trim() &&
          formData.lastName.trim() &&
          formData.email.trim() &&
          formData.nicNumber.trim() &&
          nicValidation?.isValid &&
          !validationErrors.email &&
          !validationErrors.nicNumber
        )
      case 2:
        return (
          formData.mobileNumber.trim() &&
          formData.province.trim() &&
          !validationErrors.mobileNumber
        )
      case 3:
        return (
          isConnected &&
          (!enableBiometric || (biometricData.isVerified && biometricData.isUnique)) &&
          !validationErrors.evm
        )
      default:
        return false
    }
  }

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1:
        return "Personal Information"
      case 2:
        return "Contact & Location"
      case 3:
        return "Identity Verification"
      default:
        return ""
    }
  }

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1:
        return User
      case 2:
        return Phone
      case 3:
        return Shield
      default:
        return User
    }
  }

  // Clear EVM validation error when wallet address changes
  useEffect(() => {
    if (validationErrors.evm) {
      setValidationErrors(prev => ({
        ...prev,
        evm: undefined
      }))
    }
  }, [address])

  const handleInputChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
    
    // Real-time NIC validation
    if (field === 'nicNumber') {
      if (value.trim() === '') {
        setNicValidation(null)
      } else {
        const validation = validateSriLankanNIC(value)
        setNicValidation(validation)
      }
    }

    // Check for duplicates after a short delay (debounced)
    if (field === 'email' || field === 'nicNumber' || field === 'mobileNumber') {
      checkForDuplicates(field, value)
    }
  }
  // Debounced duplicate check helper
  const duplicateCheckTimers = useRef<Record<string, number>>({})

  // Basic format validators to avoid calling backend with clearly invalid inputs
  const isPossibleNIC = (v: string) => {
    const s = v.trim()
    if (!s) return false
    return /^[0-9]{9}[VXvx]$/.test(s) || /^[0-9]{12}$/.test(s)
  }

  const isPossibleMobile = (v: string) => {
    const s = v.trim()
    if (!s) return false
    return /^(\+94|0)?[0-9]{9}$/.test(s)
  }

  // Check for duplicates in the database (debounced)
  const checkForDuplicates = async (field: string, value: string) => {
    if (!value.trim()) return

    // Input guards
    if (field === 'nicNumber' && !isPossibleNIC(value)) return
    if (field === 'mobileNumber' && !isPossibleMobile(value)) return

    // Clear any existing timer
    if (duplicateCheckTimers.current[field]) {
      clearTimeout(duplicateCheckTimers.current[field])
    }

    // Debounce the request to avoid rapid backend calls while user types
    duplicateCheckTimers.current[field] = window.setTimeout(async () => {
      try {
        const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BALLERINA_BASE_URL || 'http://localhost:8080'
        let endpoint = ''
        
        switch (field) {
          case 'email':
            endpoint = `/api/users/email/${encodeURIComponent(value)}`
            break
          case 'nicNumber':
            endpoint = `/api/users/nic/${encodeURIComponent(value)}`
            break
          case 'mobileNumber':
            endpoint = `/api/users/mobile/${encodeURIComponent(value)}`
            break
          default:
            return
        }

        const response = await fetch(`${BACKEND_API_BASE}${endpoint}`)
        
        if (response.ok) {
          const data = await response.json()
          
          // If user found, set validation error
          if (data.success && data.data) {
            const errorMessages = {
              email: "Email already registered",
              nicNumber: "NIC already registered",
              mobileNumber: "Mobile number already registered"
            }
            setValidationErrors(prev => ({
              ...prev,
              [field]: errorMessages[field as keyof typeof errorMessages]
            }))
          } else {
            // Backend returned structured failure (no user) - clear any existing error
            setValidationErrors(prev => ({ ...prev, [field]: undefined }))
          }
        } else {
          // Non-OK response: attempt to parse structured JSON and surface message
          try {
            const body = await response.json()
            if (body && !body.success && body.message) {
              // Clear error (no user) or leave as-is
              setValidationErrors(prev => ({ ...prev, [field]: undefined }))
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (error) {
        console.error('Error checking for duplicates:', error)
      }
    }, 500)
  }

  // Check EVM address for duplicates
  const checkEvmDuplicate = async (evmAddress: string) => {
    if (!evmAddress.trim()) return false

    try {
      const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BALLERINA_BASE_URL || 'http://localhost:8080'
      const response = await fetch(`${BACKEND_API_BASE}/api/users/evm/${encodeURIComponent(evmAddress)}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setValidationErrors(prev => ({
            ...prev,
            evm: "Wallet address already registered"
          }))
          return true
        }
      }
    } catch (error) {
      console.error('Error checking EVM duplicate:', error)
    }
    return false
  }

  const handleBiometricVerification = (result: { isUnique: boolean; biometricHash: string }) => {
    setBiometricData({
      isVerified: true,
      isUnique: result.isUnique,
      biometricHash: result.biometricHash
    })
  }

  const handleBiometricError = (error: string) => {
    setBiometricData({
      isVerified: false,
      isUnique: false,
      biometricHash: ''
    })
    toast.error("Biometric Verification Failed", {
      description: error,
      duration: 5000
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check wallet connection
    if (!isConnected || !address) {
      toast.error("Wallet Connection Required", {
        description: "Please connect your wallet first to register",
        duration: 4000
      })
      return
    }

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.nicNumber || !formData.mobileNumber || !formData.province) {
      toast.error("Incomplete Information", {
        description: "Please fill in all fields",
        duration: 4000
      })
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Invalid Email", {
        description: "Please enter a valid email address",
        duration: 4000
      })
      return
    }

    // Comprehensive NIC validation
    const nicValidationResult = validateSriLankanNIC(formData.nicNumber)
    if (!nicValidationResult.isValid) {
      toast.error("NIC Validation Failed", {
        description: nicValidationResult.message,
        duration: 5000
      })
      return
    }

    // Mobile number validation (Sri Lankan format)
    const mobileRegex = /^(\+94|0)?[0-9]{9}$/
    if (!mobileRegex.test(formData.mobileNumber)) {
      toast.error("Invalid Mobile Number", {
        description: "Please enter a valid Sri Lankan mobile number",
        duration: 4000
      })
      return
    }

    // Check for validation errors
    if (Object.values(validationErrors).some(error => error)) {
      toast.error("Validation Errors Found", {
        description: "Please fix the validation errors before submitting",
        duration: 4000
      })
      return
    }

    // Biometric verification check (if enabled)
    if (enableBiometric && !biometricData.isVerified) {
      toast.error("Biometric Verification Required", {
        description: "Please complete biometric verification to ensure unique registration",
        duration: 5000
      })
      return
    }

    if (enableBiometric && !biometricData.isUnique) {
      toast.error("Duplicate Identity Detected", {
        description: "Biometric verification indicates this identity is already registered. Each person can only register once.",
        duration: 6000
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Show loading toast
      const loadingToast = toast.loading("Registering your account...", {
        description: "Please wait while we verify your information and process your registration",
        duration: Infinity
      })

      // Final duplicate check for EVM address
      const evmDuplicate = await checkEvmDuplicate(address)
      if (evmDuplicate) {
        toast.dismiss(loadingToast)
        toast.error("Wallet Already Registered", {
          description: "This wallet address is already registered to another user",
          duration: 5000
        })
        return
      }

      // Perform final duplicate checks for all fields
      await Promise.all([
        checkForDuplicates('email', formData.email),
        checkForDuplicates('nicNumber', formData.nicNumber),
        checkForDuplicates('mobileNumber', formData.mobileNumber)
      ])

      // Wait a moment for state updates
      await new Promise(resolve => setTimeout(resolve, 100))

      // Check again if any validation errors were set
      if (Object.values(validationErrors).some(error => error)) {
        toast.dismiss(loadingToast)
        toast.error("Registration Failed", {
          description: "Duplicate data detected. Please check the error messages below the fields.",
          duration: 5000
        })
        return
      }

      const registrationData = {
        ...formData,
        walletAddress: address,
        nicInfo: {
          birthYear: nicValidationResult.birthYear,
          dayOfYear: nicValidationResult.dayOfYear,
          gender: nicValidationResult.gender
        },
        biometricData: enableBiometric ? biometricData : null
      }

      console.log("Registering user with data:", registrationData)
      
      const result = await registerUser(registrationData)
      
      toast.dismiss(loadingToast)
      
      if (result.success) {
        // Reset form and close dialog
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          nicNumber: "",
          mobileNumber: "",
          province: "",
        })
        setNicValidation(null)
        setValidationErrors({})
        setBiometricData({
          isVerified: false,
          isUnique: false,
          biometricHash: ''
        })
        setCurrentStep(1)
        setOpen(false)
        
        const verificationMessage = enableBiometric ? "NIC and biometric identity verified and validated." : "NIC verified and validated."
        
        // Create a custom success toast with transaction hash if available
        toast.success("Registration Successful! 🎉", {
          description: (
            <div className="space-y-2">
              <p className="text-sm">{verificationMessage}</p>
              <p className="text-sm">Your wallet has been authorized and data saved to database.</p>
              {result.transactionHash && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                  <span className="text-xs text-blue-700 font-mono break-all">
                    Transaction: {result.transactionHash}
                  </span>
                  <button
                    aria-label="Copy transaction hash"
                    onClick={() => {
                      if (result.transactionHash) {
                        navigator.clipboard.writeText(result.transactionHash)
                        toast.success("Transaction hash copied to clipboard!")
                      }
                    }}
                    className="p-1 hover:bg-blue-100 rounded"
                  >
                    <Copy className="h-3 w-3 text-blue-600" />
                  </button>
                </div>
              )}
            </div>
          ),
          duration: 8000,
          action: result.transactionHash
            ? {
                label: "View Transaction",
                onClick: () => {
                  if (result.transactionHash) {
                    // You can customize this URL based on your blockchain network
                    window.open(`https://etherscan.io/tx/${result.transactionHash}`, '_blank')
                  }
                },
              }
            : undefined,
        })
      } else {
        toast.error("Registration Failed", {
          description: result.message,
          duration: 5000
        })
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      toast.error("Registration Error", {
        description: error.message || 'An unknown error occurred during registration',
        duration: 5000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      nicNumber: "",
      mobileNumber: "",
      province: "",
    })
    setNicValidation(null)
    setValidationErrors({})
    setBiometricData({
      isVerified: false,
      isUnique: false,
      biometricHash: ''
    })
    setCurrentStep(1)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 rounded-xl border-2 border-blue-600 bg-gradient-to-r from-blue-50 to-green-50 text-blue-700 shadow-md transition-all duration-200 hover:from-blue-100 hover:to-green-100 hover:shadow-lg hover:scale-105"
        >
          <UserPlus className="h-4 w-4" />
          Register
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-amber-50 to-green-50">
        {/* Loading Overlay */}
        <LoadingOverlay 
          isVisible={isSubmitting} 
          text="Processing your registration..."
          className="rounded-2xl"
        />
        <DialogHeader>
          <DialogTitle className="text-blue-800 flex items-center gap-2">
            {(() => {
              const IconComponent = getStepIcon(currentStep)
              return <IconComponent className="h-5 w-5" />
            })()}
            Citizen Registration - {getStepTitle(currentStep)}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Step {currentStep} of {totalSteps}: Complete your registration to participate in Sri Lanka's transparent governance platform.
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === currentStep
                    ? 'bg-blue-600 text-white'
                    : step < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step < currentStep ? '✓' : step}
              </div>
              {step < totalSteps && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                  className={validationErrors.email ? "border-red-500 focus:border-red-600" : ""}
                  required
                />
                {validationErrors.email && (
                  <div className="text-sm text-red-600 flex items-center gap-2 p-2 bg-red-50 rounded-md border border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    {validationErrors.email}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nicNumber">NIC Number</Label>
                <Input
                  id="nicNumber"
                  type="text"
                  value={formData.nicNumber}
                  onChange={(e) => handleInputChange("nicNumber", e.target.value)}
                  placeholder="Enter NIC number (e.g., 123456789V or 123456789012)"
                  className={`${
                    validationErrors.nicNumber
                      ? "border-red-500 focus:border-red-600"
                      : nicValidation === null 
                        ? "" 
                        : nicValidation.isValid 
                          ? "border-green-500 focus:border-green-600" 
                          : "border-red-500 focus:border-red-600"
                  }`}
                  required
                />
                {validationErrors.nicNumber && (
                  <div className="text-sm text-red-600 flex items-center gap-2 p-2 bg-red-50 rounded-md border border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    {validationErrors.nicNumber}
                  </div>
                )}
                {!validationErrors.nicNumber && nicValidation && (
                  <div className={`text-sm flex items-center gap-2 p-2 rounded-md border ${
                    nicValidation.isValid 
                      ? "text-green-600 bg-green-50 border-green-200" 
                      : "text-red-600 bg-red-50 border-red-200"
                  }`}>
                    {nicValidation.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>{nicValidation.message}</span>
                    {nicValidation.isValid && nicValidation.birthYear && (
                      <span className="text-blue-600 text-xs ml-2 px-2 py-1 bg-blue-100 rounded-full">
                        Born: {nicValidation.birthYear}, {nicValidation.gender}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Contact & Location */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                  placeholder="Enter mobile number (e.g., 0771234567)"
                  className={validationErrors.mobileNumber ? "border-red-500 focus:border-red-600" : ""}
                  required
                />
                {validationErrors.mobileNumber && (
                  <div className="text-sm text-red-600 flex items-center gap-2 p-2 bg-red-50 rounded-md border border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    {validationErrors.mobileNumber}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <select
                  aria-label="Province"
                  id="province"
                  value={formData.province}
                  onChange={(e) => handleInputChange("province", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select your province</option>
                  <option value="Western">Western</option>
                  <option value="Central">Central</option>
                  <option value="Southern">Southern</option>
                  <option value="Northern">Northern</option>
                  <option value="Eastern">Eastern</option>
                  <option value="North Western">North Western</option>
                  <option value="North Central">North Central</option>
                  <option value="Uva">Uva</option>
                  <option value="Sabaragamuwa">Sabaragamuwa</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Identity Verification */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {/* Wallet Connection Status */}
              <div className={`flex items-center gap-2 p-3 rounded-lg border ${isConnected ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                {isConnected ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${isConnected ? 'text-green-800' : 'text-red-800'}`}>
                  {isConnected ? `Wallet Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Wallet Not Connected'}
                </span>
              </div>
              
              {/* EVM Address Validation Error */}
              {validationErrors.evm && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-300">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-800">{validationErrors.evm}</span>
                </div>
              )}

              {/* Biometric Verification Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-700">Identity Verification</h3>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={enableBiometric}
                      onChange={(e) => setEnableBiometric(e.target.checked)}
                      className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-600">Enable biometric verification</span>
                  </label>
                </div>
                
                <BiometricVerification
                  onVerificationComplete={handleBiometricVerification}
                  onVerificationError={handleBiometricError}
                  isEnabled={enableBiometric}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}
            
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            
            {currentStep < totalSteps ? (
              <Button 
                type="button" 
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className={!isStepValid(currentStep) ? "bg-gray-400 cursor-not-allowed" : ""}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={!isStepValid(currentStep) || isSubmitting}
                className={!isStepValid(currentStep) ? "bg-gray-400 cursor-not-allowed" : ""}
              >
                {isSubmitting ? "Registering..." : "Register"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
