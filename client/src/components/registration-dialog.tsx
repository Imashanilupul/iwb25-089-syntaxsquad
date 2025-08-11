"use client"

import { useState } from "react"
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
import { UserPlus } from "lucide-react"

interface RegistrationFormData {
  firstName: string
  lastName: string
  email: string
  nicNumber: string
  mobileNumber: string
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
  const [open, setOpen] = useState(false)
  const [nicValidation, setNicValidation] = useState<NICValidationResult | null>(null)
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: "",
    lastName: "",
    email: "",
    nicNumber: "",
    mobileNumber: "",
  })

  const handleInputChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Real-time NIC validation
    if (field === 'nicNumber') {
      if (value.trim() === '') {
        setNicValidation(null)
      } else {
        const validation = validateSriLankanNIC(value)
        setNicValidation(validation)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.nicNumber || !formData.mobileNumber) {
      alert("Please fill in all fields")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address")
      return
    }

    // Comprehensive NIC validation
    const nicValidationResult = validateSriLankanNIC(formData.nicNumber)
    if (!nicValidationResult.isValid) {
      alert(`NIC Validation Error: ${nicValidationResult.message}`)
      return
    }

    // Mobile number validation (Sri Lankan format)
    const mobileRegex = /^(\+94|0)?[0-9]{9}$/
    if (!mobileRegex.test(formData.mobileNumber)) {
      alert("Please enter a valid mobile number")
      return
    }

    console.log("Registration data:", {
      ...formData,
      nicInfo: {
        birthYear: nicValidationResult.birthYear,
        dayOfYear: nicValidationResult.dayOfYear,
        gender: nicValidationResult.gender
      }
    })
    
    // Here you would typically send the data to your backend API
    // The backend should also perform server-side NIC validation
    
    // Reset form and close dialog
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      nicNumber: "",
      mobileNumber: "",
    })
    setNicValidation(null)
    setOpen(false)
    alert("Registration successful! NIC verified and validated.")
  }

  const handleCancel = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      nicNumber: "",
      mobileNumber: "",
    })
    setNicValidation(null)
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
        <DialogHeader>
          <DialogTitle className="text-blue-800">Citizen Registration</DialogTitle>
          <DialogDescription className="text-slate-600">
            Register to participate in Sri Lanka's transparent governance platform.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              required
            />
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
                nicValidation === null 
                  ? "" 
                  : nicValidation.isValid 
                    ? "border-green-500 focus:border-green-600" 
                    : "border-red-500 focus:border-red-600"
              }`}
              required
            />
            {nicValidation && (
              <div className={`text-sm flex items-center gap-2 ${
                nicValidation.isValid ? "text-green-600" : "text-red-600"
              }`}>
                <span className={`inline-block w-2 h-2 rounded-full ${
                  nicValidation.isValid ? "bg-green-500" : "bg-red-500"
                }`}></span>
                {nicValidation.message}
                {nicValidation.isValid && nicValidation.birthYear && (
                  <span className="text-blue-600 text-xs ml-2">
                    (Born: {nicValidation.birthYear}, {nicValidation.gender})
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile Number</Label>
            <Input
              id="mobileNumber"
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
              placeholder="Enter mobile number (e.g., 0771234567)"
              required
            />
          </div>
          
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Register</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
