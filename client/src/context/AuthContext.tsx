

'use client'





import React, { createContext, useContext, useState, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import axios from "axios";

type AuthState = {
  address: string | null;
  verified: boolean;
  jwt: string | null;
};

const AuthContext = createContext<AuthState>({
  address: null,
  verified: false,
  jwt: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAppKitAccount();
  const [auth, setAuth] = useState<AuthState>({
    address: null,
    verified: false,
    jwt: null,
  });

  useEffect(() => {
    async function checkAuth() {
      if (isConnected && address) {
        try {
          const res = await axios.get(`http://localhost:8080/auth/isauthorized/${address}`);
          setAuth({
            address,
            verified: res.data.verified,
            jwt: res.data.token ?? null,
          });
        } catch (error) {
          console.error("Auth check failed:", error);
          setAuth({ address, verified: false, jwt: null });
        }
      } else {
        setAuth({ address: null, verified: false, jwt: null });
      }
    }
    checkAuth();
  }, [address, isConnected]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}