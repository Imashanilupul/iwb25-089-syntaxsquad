import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet, Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function AuthenticationStatus() {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Authenticating...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Authentication Status
        </CardTitle>
        <CardDescription>
          Your current authentication and registration status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="text-sm font-medium">Wallet Connected</span>
          </div>
          {auth.address ? (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Not Connected
            </Badge>
          )}
        </div>

        {/* Wallet Address */}
        {auth.address && (
          <div className="text-xs text-muted-foreground">
            Address: {auth.address.slice(0, 6)}...{auth.address.slice(-4)}
          </div>
        )}

        {/* Wallet Verification Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Wallet Verified</span>
          {auth.walletVerified ? (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Verified
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Not Verified
            </Badge>
          )}
        </div>

        {/* User Registration Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Registered User</span>
          {auth.isRegisteredUser ? (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Registered
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Not Registered
            </Badge>
          )}
        </div>

        {/* Full Authentication Status */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Full Access</span>
            {auth.isFullyAuthenticated ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Granted
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Denied
              </Badge>
            )}
          </div>
        </div>

        {/* Asgardeo Authentication */}
        <div className="pt-2 border-t">
          <div className="text-sm font-medium mb-2">Asgardeo Account</div>
          {!auth.asgardeoUser ? (
            <a 
              href="/api/auth/signin"
              className="w-full inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center"
            >
              Sign in with Asgardeo
            </a>
          ) : (
            <div className="space-y-2">
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Signed In
              </Badge>
              {auth.asgardeoUser && (
                <div className="text-xs text-muted-foreground">
                  User: {auth.asgardeoUser.username || auth.asgardeoUser.sub}
                </div>
              )}
              <a 
                href="/api/auth/signout"
                className="w-full inline-block px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-center"
              >
                Sign Out
              </a>
            </div>
          )}
        </div>

        {/* Error Display */}
        {auth.error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
            Error: {auth.error}
          </div>
        )}

        {/* Access Guidance */}
        {!auth.isFullyAuthenticated && (
          <div className="p-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded">
            {!auth.address && "Please connect your wallet first."}
            {auth.address && !auth.walletVerified && "Please verify your wallet to continue."}
            {auth.address && auth.walletVerified && !auth.isRegisteredUser && "Please register as a user to access all features."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AuthenticationStatus;
