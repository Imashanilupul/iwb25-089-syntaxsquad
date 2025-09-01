// src/app/layout.tsx

import type { Metadata } from "next";
import "../styles/globals.css";
import ContextProvider from "@/components/walletConnect/context";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Sri Lanka Transparent Governance Platform",
  description: "Created with v0",
  generator: "dark grecher",
  icons: {
    icon: '/images/sri-lanka-emblem.png',
    apple: '/images/sri-lanka-emblem.png',
    other: {
      rel: 'icon',
      url: '/images/sri-lanka-emblem.png',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ContextProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                },
              }}
            />
          </ContextProvider>
        </AuthProvider>
      </body>
    </html>
  );
}