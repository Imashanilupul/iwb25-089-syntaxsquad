'use client'

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, XCircle, AlertTriangle, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export function UserRegistration() {
  const auth = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    province: '',
    district: '',
    address: '',
    nicNumber: '',
    occupation: '',
    bio: ''
  });

  const provinces = [
    'Western', 'Central', 'Southern', 'Northern', 'Eastern', 
    'North Western', 'North Central', 'Uva', 'Sabaragamuwa'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegistration = async () => {
    if (!auth.address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!auth.asgardeoUser) {
      toast.error('Please sign in with Asgardeo first');
      return;
    }

    if (!formData.fullName || !formData.phoneNumber || !formData.province) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsRegistering(true);

    try {
      const response = await axios.post('http://localhost:8080/api/auth/register-user', {
        walletAddress: auth.address,
        asgardeoUserId: auth.asgardeoUser.sub,
        asgardeoUser: auth.asgardeoUser,
        additionalData: {
          ...formData,
          registrationDate: new Date().toISOString()
        }
      });

      if (response.data.success) {
        toast.success('Registration successful! Please refresh the page.');
        // Trigger a page refresh to update auth state
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(response.data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Don't show registration if user is already registered
  if (auth.isRegisteredUser) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Already Registered
          </CardTitle>
          <CardDescription>
            Your wallet is linked to a registered account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="default" className="flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            Registration Complete
          </Badge>
        </CardContent>
      </Card>
    );
  }

  // Show requirements if not ready to register
  if (!auth.address || !auth.walletVerified || !auth.asgardeoUser) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            User Registration
          </CardTitle>
          <CardDescription>
            Complete the requirements to register
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Wallet Connected</span>
            {auth.address ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Wallet Verified</span>
            {auth.walletVerified ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Asgardeo Account</span>
            {auth.asgardeoUser ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
          </div>
          
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Complete all requirements above to proceed with registration.
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
          Citizen Registration
        </CardTitle>
        <CardDescription>
          Link your wallet to your verified identity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Account Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="text-sm font-medium text-blue-800 mb-1">Account Information</div>
          <div className="text-xs text-blue-700">
            <div>Wallet: {auth.address?.slice(0, 8)}...{auth.address?.slice(-6)}</div>
            <div>Asgardeo: {auth.asgardeoUser.preferred_username || auth.asgardeoUser.username}</div>
            {auth.asgardeoUser.email && <div>Email: {auth.asgardeoUser.email}</div>}
          </div>
        </div>

        {/* Registration Form */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="+94 XXX XXX XXX"
            />
          </div>
          
          <div>
            <Label htmlFor="nicNumber">NIC Number</Label>
            <Input
              id="nicNumber"
              value={formData.nicNumber}
              onChange={(e) => handleInputChange('nicNumber', e.target.value)}
              placeholder="XXXXXXXXV or XXXXXXXXXXXX"
            />
          </div>
          
          <div>
            <Label htmlFor="province">Province *</Label>
            <Select value={formData.province} onValueChange={(value) => handleInputChange('province', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="district">District</Label>
            <Input
              id="district"
              value={formData.district}
              onChange={(e) => handleInputChange('district', e.target.value)}
              placeholder="Enter your district"
            />
          </div>
          
          <div className="col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter your address"
            />
          </div>
          
          <div className="col-span-2">
            <Label htmlFor="occupation">Occupation</Label>
            <Input
              id="occupation"
              value={formData.occupation}
              onChange={(e) => handleInputChange('occupation', e.target.value)}
              placeholder="Enter your occupation"
            />
          </div>
          
          <div className="col-span-2">
            <Label htmlFor="bio">Bio (Optional)</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>
        </div>

        {/* Register Button */}
        <Button 
          onClick={handleRegistration}
          disabled={isRegistering}
          className="w-full"
        >
          {isRegistering ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Register as Citizen
            </>
          )}
        </Button>

        <div className="text-xs text-gray-600 text-center">
          By registering, you agree to link your wallet address with your verified identity.
        </div>
      </CardContent>
    </Card>
  );
}

export default UserRegistration;
