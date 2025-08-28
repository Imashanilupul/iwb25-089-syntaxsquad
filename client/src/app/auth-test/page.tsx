'use client'

import React from 'react';
import AuthenticationStatus from '@/components/auth/AuthenticationStatus';
import UserRegistration from '@/components/auth/UserRegistration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hybrid Authentication System
          </h1>
          <p className="text-lg text-gray-600">
            Wallet + Asgardeo Integration for Transparent Governance Platform
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Authentication Status */}
          <div className="flex justify-center">
            <AuthenticationStatus />
          </div>

          {/* User Registration */}
          <div className="flex justify-center">
            <UserRegistration />
          </div>

          {/* System Information */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
              <CardDescription>
                Current system capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-blue-600">✅ Wallet Authentication</h3>
                <p className="text-sm text-gray-600">
                  Connect and verify blockchain wallet identity.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-green-600">✅ Asgardeo Integration</h3>
                <p className="text-sm text-gray-600">
                  OAuth2 login with enterprise identity management.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-purple-600">✅ User Registration</h3>
                <p className="text-sm text-gray-600">
                  Link wallet addresses with verified citizen accounts.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-orange-600">✅ Hybrid Validation</h3>
                <p className="text-sm text-gray-600">
                  Backend validates both wallet signatures and user registration.
                </p>
              </div>

              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <h4 className="text-sm font-semibold text-green-800 mb-1">System Ready!</h4>
                <p className="text-xs text-green-700">
                  ✅ Complete authentication flow<br />
                  ✅ User registration system<br />
                  ✅ Backend API integration<br />
                  ✅ Security validation
                </p>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <h4 className="text-sm font-semibold text-blue-800 mb-1">Next: Enhanced Features</h4>
                <p className="text-xs text-blue-700">
                  🚧 Multi-factor authentication<br />
                  🚧 Role-based access control<br />
                  🚧 Biometric verification<br />
                  🚧 Conditional authentication
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>How to Test the System</CardTitle>
              <CardDescription>
                Step-by-step testing guide
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Step 1: Wallet Connection</h3>
                  <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                    <li>Connect your Web3 wallet (MetaMask, etc.)</li>
                    <li>Sign the verification message</li>
                    <li>Check authentication status</li>
                  </ol>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Step 2: Asgardeo Login</h3>
                  <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                    <li>Click "Sign in with Asgardeo"</li>
                    <li>Complete OAuth2 authentication</li>
                    <li>Return to application</li>
                  </ol>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Step 3: User Registration</h3>
                  <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                    <li>Fill in citizen information</li>
                    <li>Submit registration form</li>
                    <li>Link wallet to identity</li>
                  </ol>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Step 4: Full Access</h3>
                  <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                    <li>Verify full authentication status</li>
                    <li>Access governance features</li>
                    <li>Participate in voting</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
