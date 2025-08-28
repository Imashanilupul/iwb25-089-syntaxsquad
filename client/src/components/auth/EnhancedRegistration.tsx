'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus, CheckCircle, XCircle, AlertTriangle, Shield, Eye, EyeOff } from "lucide-react";
import { useAppKitAccount } from "@reown/appkit/react";
import { toast } from "@/hooks/use-toast";
import axios from 'axios';

interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  province: string;
  mobileNumber: string;
  acceptTerms: boolean;
}

const provinces = [
  'Western', 'Central', 'Southern', 'Northern', 'Eastern', 
  'North Western', 'North Central', 'Uva', 'Sabaragamuwa'
];

export function EnhancedRegistration() {
  const { address, isConnected } = useAppKitAccount();
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [walletBindingCheck, setWalletBindingCheck] = useState<{
    isChecking: boolean;
    isAlreadyRegistered: boolean;
    userData?: any;
  }>({ isChecking: false, isAlreadyRegistered: false });

  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    province: '',
    mobileNumber: '',
    acceptTerms: false
  });

  const [validationErrors, setValidationErrors] = useState<Partial<RegistrationFormData>>({});

  // Check if wallet is already registered when component mounts
  React.useEffect(() => {
    if (isConnected && address) {
      checkWalletBinding();
    }
  }, [isConnected, address]);

  const checkWalletBinding = async () => {
    if (!address) return;

    setWalletBindingCheck(prev => ({ ...prev, isChecking: true }));

    try {
      const response = await axios.get(`/api/auth/wallet-binding?wallet=${address}`);
      
      if (response.data.isRegistered) {
        setWalletBindingCheck({
          isChecking: false,
          isAlreadyRegistered: true,
          userData: response.data.userData
        });
      } else {
        setWalletBindingCheck({
          isChecking: false,
          isAlreadyRegistered: false
        });
      }
    } catch (error) {
      console.error('Failed to check wallet binding:', error);
      setWalletBindingCheck(prev => ({ ...prev, isChecking: false }));
    }
  };

  const handleInputChange = (field: keyof RegistrationFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<RegistrationFormData> = {};

    // Required fields
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.username.trim()) errors.username = 'Username is required';
    if (!formData.password) errors.password = 'Password is required';
    if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    if (!formData.province) errors.province = 'Province is required';
    if (!formData.mobileNumber.trim()) errors.mobileNumber = 'Mobile number is required';

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (formData.password && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Username validation
    if (formData.username && formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    }

    // Mobile number validation (basic)
    if (formData.mobileNumber && !/^[0-9+\-\s()]+$/.test(formData.mobileNumber)) {
      errors.mobileNumber = 'Please enter a valid mobile number';
    }

    // Terms acceptance
    if (!formData.acceptTerms) {
      toast({
        title: "Terms and Conditions",
        description: "You must accept the terms and conditions to register.",
        variant: "destructive"
      });
      return false;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegistration = async () => {
    if (!address) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet before registering.",
        variant: "destructive"
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsRegistering(true);
    setRegistrationStep('processing');

    try {
      const registrationData = {
        walletAddress: address,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        username: formData.username.trim().toLowerCase(),
        password: formData.password,
        additionalInfo: {
          province: formData.province,
          mobileNumber: formData.mobileNumber,
          registrationTimestamp: new Date().toISOString(),
          registrationMethod: 'enhanced_wallet_binding'
        }
      };

      const response = await axios.post('/api/auth/wallet-binding', registrationData);

      if (response.data.success) {
        setRegistrationStep('success');
        toast({
          title: "🎉 Registration Successful!",
          description: "Your account has been created and linked to your wallet. You can now sign in.",
        });

        // Redirect to login after success
        setTimeout(() => {
          window.location.href = '/api/auth/signin';
        }, 3000);
      } else {
        throw new Error(response.data.error || 'Registration failed');
      }

    } catch (error: any) {
      console.error('Registration failed:', error);
      setRegistrationStep('error');
      
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // Show wallet connection requirement
  if (!isConnected || !address) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Secure Registration
          </CardTitle>
          <CardDescription>
            Connect your wallet to begin the secure registration process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You need to connect your wallet before registering. This ensures your account is securely linked to your blockchain identity.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show if wallet is already registered
  if (walletBindingCheck.isAlreadyRegistered && walletBindingCheck.userData) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Already Registered
          </CardTitle>
          <CardDescription>
            This wallet is already linked to an account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm">
              <div className="font-medium text-green-800">Account Details:</div>
              <div className="text-green-700 mt-1">
                <div>Username: {walletBindingCheck.userData.username}</div>
                <div>Email: {walletBindingCheck.userData.email}</div>
                <div>Wallet: {address?.slice(0, 8)}...{address?.slice(-6)}</div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => window.location.href = '/api/auth/signin'}
            className="w-full"
          >
            Sign In to Your Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show loading state while checking wallet binding
  if (walletBindingCheck.isChecking) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Checking wallet registration status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show success state
  if (registrationStep === 'success') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Registration Complete!
          </CardTitle>
          <CardDescription>
            Your account has been successfully created and linked to your wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <div className="text-sm text-green-700">
              <div className="font-medium">Welcome, {formData.firstName}!</div>
              <div className="mt-1">Redirecting to sign in...</div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-green-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show registration form
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create Account with Wallet Binding
        </CardTitle>
        <CardDescription>
          Create a secure account linked to your wallet address
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="text-sm font-medium text-blue-800 mb-1">Connected Wallet</div>
          <div className="text-xs text-blue-700 font-mono">
            {address?.slice(0, 10)}...{address?.slice(-8)}
          </div>
        </div>

        {/* Registration Form */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Enter your first name"
              className={validationErrors.firstName ? 'border-red-500' : ''}
            />
            {validationErrors.firstName && (
              <div className="text-xs text-red-600 mt-1">{validationErrors.firstName}</div>
            )}
          </div>

          <div>
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Enter your last name"
              className={validationErrors.lastName ? 'border-red-500' : ''}
            />
            {validationErrors.lastName && (
              <div className="text-xs text-red-600 mt-1">{validationErrors.lastName}</div>
            )}
          </div>

          <div className="col-span-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email address"
              className={validationErrors.email ? 'border-red-500' : ''}
            />
            {validationErrors.email && (
              <div className="text-xs text-red-600 mt-1">{validationErrors.email}</div>
            )}
          </div>

          <div className="col-span-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Choose a username"
              className={validationErrors.username ? 'border-red-500' : ''}
            />
            {validationErrors.username && (
              <div className="text-xs text-red-600 mt-1">{validationErrors.username}</div>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Create a password"
                className={validationErrors.password ? 'border-red-500' : ''}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {validationErrors.password && (
              <div className="text-xs text-red-600 mt-1">{validationErrors.password}</div>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                className={validationErrors.confirmPassword ? 'border-red-500' : ''}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {validationErrors.confirmPassword && (
              <div className="text-xs text-red-600 mt-1">{validationErrors.confirmPassword}</div>
            )}
          </div>

          <div>
            <Label htmlFor="province">Province *</Label>
            <Select value={formData.province} onValueChange={(value) => handleInputChange('province', value)}>
              <SelectTrigger className={validationErrors.province ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select your province" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.province && (
              <div className="text-xs text-red-600 mt-1">{validationErrors.province}</div>
            )}
          </div>

          <div>
            <Label htmlFor="mobileNumber">Mobile Number *</Label>
            <Input
              id="mobileNumber"
              value={formData.mobileNumber}
              onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
              placeholder="Enter your mobile number"
              className={validationErrors.mobileNumber ? 'border-red-500' : ''}
            />
            {validationErrors.mobileNumber && (
              <div className="text-xs text-red-600 mt-1">{validationErrors.mobileNumber}</div>
            )}
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="acceptTerms"
            checked={formData.acceptTerms}
            onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
            className="mt-1"
          />
          <Label htmlFor="acceptTerms" className="text-sm text-gray-600">
            I accept the{' '}
            <a href="/terms" className="text-blue-600 hover:underline">
              Terms and Conditions
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </Label>
        </div>

        {/* Security Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Your account will be securely linked to wallet address: <span className="font-mono text-xs">{address?.slice(0, 8)}...{address?.slice(-6)}</span>
          </AlertDescription>
        </Alert>

        {/* Register Button */}
        <Button 
          onClick={handleRegistration}
          disabled={isRegistering || registrationStep === 'processing'}
          className="w-full"
        >
          {isRegistering ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Secure Account
            </>
          )}
        </Button>

        <div className="text-xs text-gray-600 text-center">
          Already have an account?{' '}
          <a href="/api/auth/signin" className="text-blue-600 hover:underline">
            Sign in here
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
