'use client'

import { EnhancedRegistration } from '@/components/auth/EnhancedRegistration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, CheckCircle, Users, Database } from "lucide-react";
import Link from 'next/link';

export default function EnhancedRegistrationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Enhanced Wallet Registration</h1>
            </div>
          </div>
          <p className="text-gray-600 max-w-2xl">
            Experience the new secure registration process that uniquely binds your wallet address to your user account, 
            preventing unauthorized access and ensuring platform security.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Registration Component */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Registration Form
                </CardTitle>
                <CardDescription>
                  Complete the form below to create your secure account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedRegistration />
              </CardContent>
            </Card>
          </div>

          {/* Information Panel */}
          <div className="space-y-6">
            {/* Security Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Shield className="h-5 w-5" />
                  Security Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium">Wallet Binding</div>
                    <div className="text-gray-600">Your wallet address is uniquely linked to your account</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium">Blockchain Authorization</div>
                    <div className="text-gray-600">Your wallet is authorized on the blockchain</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium">Identity Verification</div>
                    <div className="text-gray-600">Secure identity verification through Asgardeo</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium">Fraud Prevention</div>
                    <div className="text-gray-600">Prevents account sharing and unauthorized access</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Database className="h-5 w-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</div>
                    <span className="text-sm font-medium">Connect Wallet</span>
                  </div>
                  <p className="text-xs text-gray-600 ml-8">Connect your MetaMask or compatible wallet to begin</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</div>
                    <span className="text-sm font-medium">Wallet Validation</span>
                  </div>
                  <p className="text-xs text-gray-600 ml-8">System checks if your wallet is already registered</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</div>
                    <span className="text-sm font-medium">Account Creation</span>
                  </div>
                  <p className="text-xs text-gray-600 ml-8">Create your Asgardeo account with wallet binding</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</div>
                    <span className="text-sm font-medium">Blockchain Auth</span>
                  </div>
                  <p className="text-xs text-gray-600 ml-8">Your wallet is authorized on the blockchain</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">✓</div>
                    <span className="text-sm font-medium">Ready to Use</span>
                  </div>
                  <p className="text-xs text-gray-600 ml-8">Sign in and access the platform securely</p>
                </div>
              </CardContent>
            </Card>

            {/* Testing Information */}
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-800 text-sm">Testing Environment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-amber-700">
                  This is the enhanced registration system that implements wallet-user binding for improved security. 
                  The current implementation works with your existing backend APIs and can be fully deployed when 
                  Asgardeo custom attributes are configured.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Information */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>
            Enhanced authentication system implementing wallet-user binding for the Transparent Governance Platform
          </p>
          <p className="mt-2">
            <Link href="/auth-test" className="text-blue-600 hover:underline">
              View Current Authentication System
            </Link>
            {" | "}
            <Link href="/adminLogin" className="text-blue-600 hover:underline">
              Admin Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
