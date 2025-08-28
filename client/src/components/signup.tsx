"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAppKitAccount } from '@reown/appkit/react'
import { useAuth } from "@/context/AuthContext"
import { toast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { address, isConnected } = useAppKitAccount()
  const { verified, isFullyAuthenticated } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    nic: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    terms: false
  })

  // Check if coming from admin portal
  const fromAdmin = searchParams?.get('from') === 'admin' || 
                   document.referrer.includes('/admin')

  // Redirect if already fully authenticated
  useEffect(() => {
    if (isFullyAuthenticated) {
      if (fromAdmin) {
        router.push('/admin/dashboard')
      } else {
        router.push('/') // or wherever you want to redirect normal users
      }
    }
  }, [isFullyAuthenticated, fromAdmin, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected || !verified) {
      toast({
        title: "❌ Wallet Required",
        description: "Please ensure your wallet is connected and verified before registering.",
        variant: "destructive"
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "❌ Password Mismatch",
        description: "Passwords do not match. Please check and try again.",
        variant: "destructive"
      })
      return
    }

    if (!formData.terms) {
      toast({
        title: "❌ Terms Required",
        description: "Please accept the terms and conditions to continue.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Here you would typically make an API call to register the user
      // For now, we'll simulate the registration process
      
      const registrationData = {
        ...formData,
        walletAddress: address,
        fromAdmin: fromAdmin
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast({
        title: "🎉 Registration Successful!",
        description: "Your account has been created successfully. Redirecting...",
      })

      // Redirect based on source
      setTimeout(() => {
        if (fromAdmin) {
          router.push('/admin/dashboard')
        } else {
          router.push('/')
        }
      }, 1500)

    } catch (error) {
      toast({
        title: "❌ Registration Failed",
        description: "An error occurred during registration. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Image */}
      <div className="lg:w-1/2 w-full h-64 lg:h-screen relative">
        <Image
          src="/images/gov.jpg"
          alt="Sign up illustration"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right side - Sign up form */}
      <div className="lg:w-1/2 w-full flex items-center justify-center p-6 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            {fromAdmin && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <img
                  src="/images/sri-lanka-emblem.png"
                  alt="Sri Lanka National Emblem"
                  className="h-8 w-8 object-contain"
                />
                <span className="text-sm text-blue-600 font-medium">Admin Portal Registration</span>
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-600">
              {fromAdmin 
                ? "Complete your admin registration to access the portal" 
                : "Join us today and get started"
              }
            </p>
            
            {/* Wallet Status */}
            {isConnected && address && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-green-800">
                  ✅ Wallet connected: {address.slice(0, 6)}...{address.slice(-4)}
                  {verified && <span className="ml-2 text-green-600 font-medium">(Verified)</span>}
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name
                </Label>
                <Input 
                  id="firstName" 
                  name="firstName" 
                  type="text" 
                  placeholder="John" 
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required 
                  className="w-full" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last Name
                </Label>
                <Input 
                  id="lastName" 
                  name="lastName" 
                  type="text" 
                  placeholder="Doe" 
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required 
                  className="w-full" 
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full"
              />
            </div>

            {/* NIC Number and Mobile Number (side by side on desktop) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nic" className="text-sm font-medium text-gray-700">
                  NIC Number
                </Label>
                <Input 
                  id="nic" 
                  name="nic" 
                  type="text" 
                  placeholder="123456789V" 
                  value={formData.nic}
                  onChange={handleInputChange}
                  required 
                  className="w-full" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm font-medium text-gray-700">
                  Mobile Number
                </Label>
                <Input 
                  id="mobile" 
                  name="mobile" 
                  type="tel" 
                  placeholder="+94 77 123 4567" 
                  value={formData.mobile}
                  onChange={handleInputChange}
                  required 
                  className="w-full" 
                />
              </div>
            </div>

            {/* Password fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Re-enter Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </div>
            </div>

            {/* Terms and conditions */}
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox 
                id="terms" 
                name="terms"
                checked={formData.terms}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, terms: checked as boolean }))
                }
                required 
                className="mt-1" 
              />
              <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="text-blue-600 hover:text-blue-800 underline">
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            {/* Sign up button */}
            <Button 
              type="submit" 
              disabled={isSubmitting || !isConnected || !verified}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          {/* Back to admin link */}
          {fromAdmin && (
            <div className="text-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/admin')}
                className="text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin Portal
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
