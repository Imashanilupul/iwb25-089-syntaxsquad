'use client'

import React from 'react';
import AuthenticationStatus from '@/components/auth/AuthenticationStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hybrid Authentication System
          </h1>
          <p className="text-lg text-gray-600">
            Wallet + Asgardeo Integration for Transparent Governance Platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Authentication Status */}
          <div className="flex justify-center">
            <AuthenticationStatus />
          </div>

          {/* System Information */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>
                How our hybrid authentication works
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-blue-600">Phase 1: Wallet Connection</h3>
                <p className="text-sm text-gray-600">
                  Connect your blockchain wallet to establish your identity on the network.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-green-600">Phase 2: Wallet Verification</h3>
                <p className="text-sm text-gray-600">
                  Your wallet signature is verified through our Web3 authentication service.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-purple-600">Phase 3: User Registration (Future)</h3>
                <p className="text-sm text-gray-600">
                  Asgardeo will validate if your wallet is linked to a registered citizen account.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-orange-600">Phase 4: Enhanced Security (Future)</h3>
                <p className="text-sm text-gray-600">
                  Multi-factor authentication for sensitive governance actions like voting.
                </p>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <h4 className="text-sm font-semibold text-blue-800 mb-1">Current Status</h4>
                <p className="text-xs text-blue-700">
                  ✅ Wallet authentication working<br />
                  ✅ Backend validation endpoint ready<br />
                  🚧 Asgardeo integration in progress<br />
                  🚧 User registration system pending
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>
                Completing the Asgardeo integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-left space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <p className="text-sm font-medium">Configure Asgardeo Application</p>
                    <p className="text-xs text-gray-600">Set up redirect URLs and proper scopes in your Asgardeo console</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <p className="text-sm font-medium">Create User Registration System</p>
                    <p className="text-xs text-gray-600">Allow citizens to link their wallets with verified Asgardeo accounts</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <p className="text-sm font-medium">Implement MFA for Critical Actions</p>
                    <p className="text-xs text-gray-600">Add biometric or OTP verification for voting and sensitive operations</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
